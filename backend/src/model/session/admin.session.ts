import { BaseEntity, EntityTarget, In, InsertResult, UpdateResult } from "typeorm";
import { StudentDto, TeacherDto, UserDto } from "../../dto/user_info.dto";
import { AuthService } from "../auth/auth.service";
import AppDataSource from "../data-source";
import { Status } from "../entities/books/status";
import { PointType } from "../entities/points/point_type";
import { Department } from "../entities/user/department";
import { Faculty } from "../entities/user/faculty";
import { Role } from "../entities/user/role";
import { ScientificDegree } from "../entities/user/scientific_degree";
import { Title } from "../entities/user/title";
import { User } from "../entities/user/user";
import { Teacher } from "../entities/user/teacher";
import * as bcrypt from 'bcryptjs';
import { Student } from "../entities/user/student";
import { adminRoleName, workerRoleName } from "../session.manager";
import { ReadingPoint } from "../entities/points/reading_point";
import { Book } from "../entities/books/book";
import { SuperuserSession } from "./superuser.asession";

export class AdminSession extends SuperuserSession {
    private authService: AuthService;
    
    constructor(userId: number, token: string, expiresAt: Date, authService: AuthService) {
        super(userId, 'admin', token, expiresAt);
        this.authService = authService;
    }

    destroy(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    refresh(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    // Специфичные методы для пользователей
    async createUser(userData: UserDto): Promise<number> {
        try {
            const role = await this.find(Role, { roleId: userData.roleId });
            if (!role) return 1;

            const commonData = {
                username: userData.name,
                userSecondName: userData.secondName,
                userPatronymic: userData.patronymic,
                email: userData.email,
                role: role,
                passwordHash: await bcrypt.hash(userData.password, 5)
            };

            if (role.roleName == 'teacher') {
                const teacher = userData as TeacherDto;
                const [degree, department, title] = await Promise.all([
                    this.find(ScientificDegree, { degreeId: teacher.degreeId }),
                    this.find(Department, { departmentId: teacher.departmentId }),
                    this.find(Title, { titleId: teacher.titleId })
                ]);

                if (!degree || !department || !title) return 1;

                return this.create(Teacher, {
                    ...commonData,
                    department,
                    scientificDegree: degree,
                    title
                });
            } 
            else if (role.roleName == 'student') {
                const student = userData as StudentDto;
                const faculty = await this.find(Faculty, { facultyId: student.facultyId });
                if (!faculty) return 1;

                return this.create(Student, {
                    ...commonData,
                    faculty,
                    groupNumber: student.group,
                    course: student.course
                });
            } 
            else if (role.roleName === adminRoleName || role.roleName === workerRoleName) {
                return this.create(User, commonData);
            }

            return 1;
        } catch (error) {
            console.error('Create user error:', error);
            return 1;
        }
    }

    async updateUser(id: number, userData: UserDto): Promise<number> {
        try {
            const role = await this.find(Role, { roleId: userData.roleId });
            if (!role) return 1;

            const commonData = {
                username: userData.name,
                userSecondName: userData.secondName,
                userPatronymic: userData.patronymic,
                email: userData.email,
                role: role,
                passwordHash: await bcrypt.hash(userData.password, 5)
            };

            if (role.roleName == 'teacher') {
                const teacher = userData as TeacherDto;
                const [degree, department, title] = await Promise.all([
                    this.find(ScientificDegree, { degreeId: teacher.degreeId }),
                    this.find(Department, { departmentId: teacher.departmentId }),
                    this.find(Title, { titleId: teacher.titleId })
                ]);

                if (!degree || !department || !title) return 1;

                return this.update(Teacher, { userId: id }, {
                    ...commonData,
                    department,
                    scientificDegree: degree,
                    title
                });
            } 
            else if (role.roleName == 'student') {
                const student = userData as StudentDto;
                const faculty = await this.find(Faculty, { facultyId: student.facultyId });
                if (!faculty) return 1;

                return this.update(Student, { userId: id }, {
                    ...commonData,
                    faculty,
                    groupNumber: student.group,
                    course: student.course
                });
            } 
            else if (role.roleName === adminRoleName || role.roleName === workerRoleName) {
                return this.update(User, { userId: id }, commonData);
            }

            return 1;
        } catch (error) {
            console.error('Update user error:', error);
            return 1;
        }
    }

    // Методы для работы с ролями
    async createRole(roleName: string): Promise<number> {
        return this.create(Role, { roleName });
    }

    async findRole(roleName: string): Promise<Role | null> {
        return this.find(Role, { roleName });
    }

    async getAllRoles(): Promise<Role[]> {
        return this.getAll(Role);
    }

    async deleteRole(roleId: number): Promise<number> {
        return this.delete(Role, { roleId });
    }

    async updateRole(roleId: number, roleName: string): Promise<number> {
        return this.update(Role, { roleId }, { roleName });
    }

    // Методы для работы с кафедрами
    async createDepartment(name: string): Promise<number> {
        return this.create(Department, { departmentName: name });
    }

    async getAllDepartments(): Promise<Department[]> {
        return this.getAll(Department, ['teachers']);
    }

    async findDepartment(name: string): Promise<Department | null> {
        return this.find(Department, { departmentName: name }, ['teachers']);
    }

    async updateDepartment(id: number, newName: string): Promise<number> {
        return this.update(Department, { departmentId: id }, { departmentName: newName });
    }

    async deleteDepartment(id: number): Promise<number> {
        return this.delete(Department, { departmentId: id });
    }

    // Методы для научных степеней
    async createScientificDegree(name: string): Promise<number> {
        return this.create(ScientificDegree, { degreeName: name });
    }

    async getAllScientificDegrees(): Promise<ScientificDegree[]> {
        return this.getAll(ScientificDegree, ['teachers']);
    }

    async getScientificDegreeByName(name: string): Promise<ScientificDegree | null> {
        return this.find(ScientificDegree, { degreeName: name }, ['teachers']);
    }

    async updateScientificDegree(id: number, newName: string): Promise<number> {
        return this.update(ScientificDegree, { degreeId: id }, { degreeName: newName });
    }

    async deleteScientificDegree(id: number): Promise<number> {
        return this.delete(ScientificDegree, { degreeId: id });
    }

    // Методы для ученых званий
    async createTitle(name: string): Promise<number> {
        return this.create(Title, { titleName: name });
    }

    async getAllTitles(): Promise<Title[]> {
        return this.getAll(Title, ['teachers']);
    }

    async findTitle(name: string): Promise<Title | null> {
        return this.find(Title, { titleName: name }, ['teachers']);
    }

    async updateTitle(id: number, newName: string): Promise<number> {
        return this.update(Title, { titleId: id }, { titleName: newName });
    }

    async deleteTitle(id: number): Promise<number> {
        return this.delete(Title, { titleId: id });
    }

    // Методы для факультетов
    async createFaculty(name: string): Promise<number> {
        return this.create(Faculty, { facultyName: name });
    }

    async getAllFaculties(): Promise<Faculty[]> {
        return this.getAll(Faculty, ['students']);
    }

    async getFacultyByName(name: string): Promise<Faculty | null> {
        return this.find(Faculty, { facultyName: name }, ['students']);
    }

    async updateFaculty(id: number, newName: string): Promise<number> {
        return this.update(Faculty, { facultyId: id }, { facultyName: newName });
    }

    async deleteFaculty(id: number): Promise<number> {
        return this.delete(Faculty, { facultyId: id });
    }

    // Методы для типов точек
    async createPointType(name: string): Promise<number> {
        return this.create(PointType, { typeName: name });
    }

    async getAllPointTypes(): Promise<PointType[]> {
        return this.getAll(PointType, ['readingPoints']);
    }

    async findPointType(name: string): Promise<PointType | null> {
        return this.find(PointType, { typeName: name }, ['readingPoints']);
    }

    async updatePointType(id: number, newName: string): Promise<number> {
        return this.update(PointType, { typeId: id }, { typeName: newName });
    }

    async deletePointType(id: number): Promise<number> {
        return this.delete(PointType, { typeId: id });
    }

    // Методы для статусов
    async createStatus(name: string): Promise<number> {
        return this.create(Status, { statusName: name });
    }

    async getAllStatuses(): Promise<Status[]> {
        return this.getAll(Status, ['rentedBooks']);
    }

    async findStatus(name: string): Promise<Status | null> {
        return this.find(Status, { statusName: name }, ['rentedBooks']);
    }

    async updateStatus(id: number, newName: string): Promise<number> {
        return this.update(Status, { statusId: id }, { statusName: newName });
    }

    async deleteStatus(id: number): Promise<number> {
        return this.delete(Status, { statusId: id });
    }

    // Методы для работы с пользователями
    async getAllUsers(): Promise<User[]> {
        return this.getAll(User);
    }

    async findUser(userDto: UserDto): Promise<User | null> {
        return this.find(User, {
            username: userDto.name,
            userPatronymic: userDto.patronymic,
            email: userDto.email
        }, ['rentedBooks', 'points']);
    }

    async deleteUser(id: number): Promise<number> {
        return this.delete(User, { userId: id });
    }

    async createReadingPoint(
        typeId: number, 
        address: string, 
        bookIds?: number[]
    ): Promise<number> {
        try {
            const type = await this.find(PointType, { typeId });
            if (!type) return 1;

            const books = bookIds 
                ? await this.getAll(Book, [], { where: { bookId: In(bookIds) } })
                : [];

            return this.create(ReadingPoint, {
                type,
                address,
                books
            });
        } catch (error) {
            console.error('Create reading point error:', error);
            return 1;
        }
    }

    async getReadingPointById(id: number): Promise<ReadingPoint | null> {
        return this.find(ReadingPoint, 
            { pointId: id }, 
            ['type', 'books', 'rentedBooks', 'users']
        );
    }

    async updateReadingPoint(
        id: number, 
        updateData: {
            typeId?: number;
            address?: string;
            bookIds?: number[];
        }
    ): Promise<number> {
        try {
            const updateObj: any = {};
            
            if (updateData.typeId !== undefined) {
                const type = await this.find(PointType, { typeId: updateData.typeId });
                if (!type) return 1;
                updateObj.type = type;
            }

            if (updateData.address !== undefined) {
                updateObj.address = updateData.address;
            }

            if (updateData.bookIds !== undefined) {
                const books = await this.getAll(Book, [], { 
                    where: { bookId: In(updateData.bookIds) } 
                });
                updateObj.books = books;
            }

            return this.update(
                ReadingPoint, 
                { pointId: id }, 
                updateObj
            );
        } catch (error) {
            console.error('Update reading point error:', error);
            return 1;
        }
    }

    async deleteReadingPoint(id: number): Promise<number> {
        return this.delete(ReadingPoint, { pointId: id });
    }

    async getAllReadingPoints(): Promise<ReadingPoint[]> {
        return this.getAll(ReadingPoint, 
            ['type', 'books', 'rentedBooks', 'users']
        );
    }

    async getReadingPointsByType(typeId: number): Promise<ReadingPoint[]> {
        return this.getAll(ReadingPoint, 
            ['type', 'books', 'rentedBooks', 'users'],
            { where: { type: { typeId } } }
        );
    }
}