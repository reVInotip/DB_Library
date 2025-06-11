import * as jwt  from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { authConfig } from '../../config/auth';
import { User } from '../entities/user/user';
import AppDataSource from '../data-source';
import { StudentDto, TeacherDto, UserDto } from '../../dto/user_info.dto';
import { Teacher } from '../entities/user/teacher';
import { Student } from '../entities/user/student';
import { Role } from '../entities/user/role';
import { ScientificDegree } from '../entities/user/scientific_degree';
import { Department } from '../entities/user/department';
import { Title } from '../entities/user/title';
import { Faculty } from '../entities/user/faculty';
import { adminRoleName, workerRoleName } from '../session.manager';
import { InsertResult } from 'typeorm';

export class AuthService {
    private userRepository = AppDataSource.getRepository(User);
    private teacherRepository = AppDataSource.getRepository(Teacher);
    private studentRepository = AppDataSource.getRepository(Student);

    async authenticate(email: string, password: string, role: string): Promise<[User, string] | null> {
        const user = await this.validateUser(email, password, role);
        if (!user) {
            return null
        };

        const token = this.generateToken(user);
        return [user, token];
    }

    async register(user: UserDto): Promise<[User, string] | null> {
        const role = await AppDataSource.getRepository(Role).findOneBy({roleId: user.roleId});
        if (!role) {
            return null;
        }

        let result: InsertResult;
        if (role.roleName == 'teacher') {
            const teacher = <TeacherDto> user;
            const degree = await AppDataSource.getRepository(ScientificDegree).findOneBy({degreeId: teacher.degreeId});
            const department = await AppDataSource.getRepository(Department).findOneBy({departmentId: teacher.departmentId});
            const title = await AppDataSource.getRepository(Title).findOneBy({titleId: teacher.titleId});

            if (!degree || !department || !title) {
                return null;
            }

            result = await this.teacherRepository.insert(
                <Teacher>{
                    username: user.name,
                    userSecondName: user.secondName,
                    userPatronymic: user.patronymic,
                    email: user.email,
                    role: role,
                    passwordHash: await bcrypt.hash(user.password, 5),
                    department: department,
                    scientificDegree: degree,
                    title: title
            });
        } else if (role.roleName == 'student') {
            const student = <StudentDto> user;
            const faculty = await AppDataSource.getRepository(Faculty).findOneBy({facultyId: student.facultyId});

            if (!faculty) {
                return null;
            }

            result = await this.studentRepository.insert(
                <Student>{
                    username: user.name,
                    userSecondName: user.secondName,
                    userPatronymic: user.patronymic,
                    email: user.email,
                    role: role,
                    passwordHash: await bcrypt.hash(user.password, 5),
                    faculty: faculty,
                    groupNumber: student.group,
                    course: student.course
            })
        }

        if (result == null || result.identifiers == null) {
            return null;
        }

        const userEntity = await this.userRepository.findOne({
            where: { email: user.email },
            relations: ['role']
        });

        const token = this.generateToken(userEntity);
        return [userEntity, token];
    }

    private generateToken(user: User): string {
        return jwt.sign(
            { userId: user.userId, role: user.role.roleName },
            authConfig.secret,
            { expiresIn: authConfig.expiresIn, algorithm: 'HS256' } as jwt.SignOptions
        );
    }

    isTokenValid(token: string): boolean {
        const decoded = jwt.verify(token, authConfig.secret) as jwt.JwtPayload;
        return decoded != null
    }

    getTokenExpiredDate(token: string): Date {
        const decoded = jwt.verify(token, authConfig.secret) as jwt.JwtPayload;
        return new Date(decoded.exp! * 1000);
    }

    async validateUser(email: string, password: string, role: string): Promise<User | null> {
        const user = await this.userRepository.findOne({ where: { email: email }, relations: ['role'] });
        
        if (!user) {
            return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        const isRoleMatches = role == user.role.roleName;
        return isPasswordValid && isRoleMatches ? user : null;
    }
}