import { BaseEntity, EntityTarget, InsertResult, UpdateResult } from "typeorm";
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
import { BaseSession } from "./session.interface";
import { Teacher } from "../entities/user/teacher";
import bcrypt from "bcryptjs/umd/types";
import { Student } from "../entities/user/student";
import { adminRoleName, workerRoleName } from "../session.manager";

export class AdminSession extends BaseSession {
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

    async createUser(userData: UserDto): Promise<number> {
        try {
            const role = await AppDataSource.getRepository(Role).findOneBy({roleId: userData.roleId});
            if (!role) {
                return 1;
            }

            let result: InsertResult;
            if (userData instanceof TeacherDto) {
                const teacher = <TeacherDto> userData;
                const degree = await AppDataSource.getRepository(ScientificDegree).findOneBy({degreeId: teacher.degreeId});
                const department = await AppDataSource.getRepository(Department).findOneBy({departmentId: teacher.departmentId});
                const title = await AppDataSource.getRepository(Title).findOneBy({titleId: teacher.titleId});

                if (!degree || !department || !title) {
                    return 1;
                }

                result = await AppDataSource.getRepository(Teacher).insert(
                    <Teacher>{
                        username: userData.name,
                        userSecondName: userData.secondName,
                        userPatronymic: userData.patronymic,
                        email: userData.email,
                        role: role,
                        passwordHash: await bcrypt.hash(userData.password, 5),
                        department: department,
                        scientificDegree: degree,
                        title: title
                });
            } else if (userData instanceof StudentDto) {
                const student = <StudentDto> userData;
                const faculty = await AppDataSource.getRepository(Faculty).findOneBy({facultyId: student.facultyId});

                if (!faculty) {
                    return 1;
                }

                result = await AppDataSource.getRepository(Student).insert(
                    <Student>{
                        username: userData.name,
                        userSecondName: userData.secondName,
                        userPatronymic: userData.patronymic,
                        email: userData.email,
                        role: role,
                        passwordHash: await bcrypt.hash(userData.password, 5),
                        faculty: faculty,
                        groupNumber: student.group,
                        course: student.course
                })
            } else if (role.roleName == adminRoleName || role.roleName == workerRoleName) {
                result = await AppDataSource.getRepository(User).insert(
                    {
                        username: userData.name,
                        userSecondName: userData.secondName,
                        userPatronymic: userData.patronymic,
                        email: userData.email,
                        role: role,
                        passwordHash: await bcrypt.hash(userData.password, 5)
                })
            }

            if (result.identifiers == null) {
                return 1;
            }
            return 0; // success
        } catch (error) {
            console.error('Update status error:', error);
            return 1; // failure
        }
    }
    
    async createRole(roleName: string): Promise<number> {
        const result = await AppDataSource.getRepository(Role).insert({roleName: roleName});
        if (result.identifiers == null) {
            return 1;
        }

        return 0;
    }

    async findRole(roleName: string): Promise<Role | null> {
        return await AppDataSource.getRepository(Role).findOneBy({roleName: roleName});
    }

    async getAllRoles(): Promise<Role[]> {
        return await AppDataSource.getRepository(Role).find();
    }

    async deleteRole(roleId: number): Promise<number> {
        const result = await AppDataSource.getRepository(Role).delete({roleId: roleId});
        if (result.affected == null || result.affected != 1) {
            return 1;
        }

        return 0;
    }

    async updateRole(roleId: number, roleName: string): Promise<number> {
        const result = await AppDataSource.getRepository(Role).update(roleId, {roleName: roleName});
        if (result.affected == null || result.affected != 1) {
            return 1;
        }

        return 0;
    }

    async createDepartment(name: string): Promise<number> {
        const result = await AppDataSource.getRepository(Department).insert({departmentName: name})
        if (result.identifiers == null) {
            return 1;
        }

        return 0;
    }
    
    async getAllDepartments(): Promise<Department[]> {
        return await AppDataSource.getRepository(Department).find();
    }
    
    async findDepartment(name: string): Promise<Department> {
        return await AppDataSource.getRepository(Department).findOneBy({departmentName: name});
    }
    
    async updateDepartment(id: number, newName: string): Promise<number> {
        const result = await AppDataSource.getRepository(Department).update(id, {departmentName: newName});
        if (result.affected == null || result.affected != 1) {
            return 1;
        }

        return 0;
    }
    
    async deleteDepartment(id: number): Promise<number> {
        const result = await AppDataSource.getRepository(Department).delete({departmentId: id});
        if (result.affected == null || result.affected != 1) {
            return 1;
        }

        return 0;
    }

    async createScientificDegree(name: string): Promise<number> {
        try {
            const repo = AppDataSource.getRepository(ScientificDegree);
            const degree = repo.create({ degreeName: name });
            await repo.save(degree);
            return 0; // success
        } catch (error) {
            console.error('Create scientific degree error:', error);
            return 1; // failure
        }
    }
    
    async getAllScientificDegrees(): Promise<ScientificDegree[]> {
        return AppDataSource
            .getRepository(ScientificDegree)
            .find({ relations: ['teachers'] });
    }
    
    async getScientificDegreeByName(name: string): Promise<ScientificDegree | null> {
        return AppDataSource
            .getRepository(ScientificDegree)
            .findOne({
                where: { degreeName: name },
                relations: ['teachers']
            });
    }
    
    async updateScientificDegree(id: number, newName: string): Promise<number> {
        try {
            const repo = AppDataSource.getRepository(ScientificDegree);
            const degree = await repo.findOneBy({ degreeId: id });
            
            if (!degree) {
                return 1; // not found
            }
            
            degree.degreeName = newName;
            await repo.save(degree);
            return 0; // success
        } catch (error) {
            console.error('Update scientific degree error:', error);
            return 1; // failure
        }
    }
    
    async deleteScientificDegree(id: number): Promise<number> {
        try {
            const repo = AppDataSource.getRepository(ScientificDegree);
            const degree = await repo.findOneBy({ degreeId: id });
            
            if (!degree) {
                return 1; // not found
            }
            
            await repo.remove(degree);
            return 0; // success
        } catch (error) {
            console.error('Delete scientific degree error:', error);
            return 1; // failure
        }
    }

    async createTitle(name: string): Promise<number> {
        try {
            const repo = AppDataSource.getRepository(Title);
            const degree = repo.create({ titleName: name });
            await repo.save(degree);
            return 0; // success
        } catch (error) {
            console.error('Create scientific degree error:', error);
            return 1; // failure
        }
    }
    
    async getAllTitles(): Promise<Title[]> {
        return AppDataSource
            .getRepository(Title)
            .find({ relations: ['teachers'] });
    }
    
    async findTitle(name: string): Promise<Title | null> {
        return AppDataSource
            .getRepository(Title)
            .findOne({
                where: { titleName: name },
                relations: ['teachers']
            });
    }
    
    async updateTitle(id: number, newName: string): Promise<number> {
        try {
            const repo = AppDataSource.getRepository(Title);
            const title = await repo.findOneBy({ titleId: id });
            
            if (!title) {
                return 1; // not found
            }
            
            title.titleName = newName;
            await repo.save(title);
            return 0; // success
        } catch (error) {
            console.error('Update scientific degree error:', error);
            return 1; // failure
        }
    }
    
    async deleteTitle(id: number): Promise<number> {
        try {
            const repo = AppDataSource.getRepository(Title);
            const title = await repo.findOneBy({ titleId: id });
            
            if (!title) {
                return 1; // not found
            }
            
            await repo.remove(title);
            return 0; // success
        } catch (error) {
            console.error('Delete scientific degree error:', error);
            return 1; // failure
        }
    }

    async createFaculty(name: string): Promise<number> {
        try {
            const repo = AppDataSource.getRepository(Faculty);
            const faculty = repo.create({ facultyName: name });
            await repo.save(faculty);
            return 0; // success
        } catch (error) {
            console.error('Create faculty error:', error);
            return 1; // failure
        }
    }
    
    async getAllFaculties(): Promise<Faculty[]> {
        return AppDataSource
            .getRepository(Faculty)
            .find({ relations: ['students'] });
    }
    
    async getFacultyByName(name: string): Promise<Faculty | null> {
        return AppDataSource
            .getRepository(Faculty)
            .findOne({
                where: { facultyName: name },
                relations: ['students']
            });
    }
    
    async updateFaculty(id: number, newName: string): Promise<number> {
        try {
            const repo = AppDataSource.getRepository(Faculty);
            const faculty = await repo.findOneBy({ facultyId: id });
            
            if (!faculty) {
                return 1; // not found
            }
            
            faculty.facultyName = newName;
            await repo.save(faculty);
            return 0; // success
        } catch (error) {
            console.error('Update faculty error:', error);
            return 1; // failure
        }
    }
    
    async deleteFaculty(id: number): Promise<number> {
        try {
            const repo = AppDataSource.getRepository(Faculty);
            const faculty = await repo.findOneBy({ facultyId: id });
            
            if (!faculty) {
                return 1; // not found
            }
            
            await repo.remove(faculty);
            return 0; // success
        } catch (error) {
            console.error('Delete faculty error:', error);
            return 1; // failure
        }
    }

    async createPointType(name: string): Promise<number> {
        try {
            const repo = AppDataSource.getRepository(PointType);
            const pointType = repo.create({ typeName: name });
            await repo.save(pointType);
            return 0; // success
        } catch (error) {
            console.error('Create point type error:', error);
            return 1; // failure
        }
    }
    
    async getAllPointTypes(): Promise<PointType[]> {
        return AppDataSource
            .getRepository(PointType)
            .find({ relations: ['readingPoints'] });
    }
    
    async findPointType(name: string): Promise<PointType | null> {
        return AppDataSource
            .getRepository(PointType)
            .findOne({
                where: { typeName: name },
                relations: ['readingPoints']
            });
    }
    
    async updatePointType(id: number, newName: string): Promise<number> {
        try {
            const repo = AppDataSource.getRepository(PointType);
            const pointType = await repo.findOneBy({ typeId: id });
            
            if (!pointType) {
                return 1; // not found
            }
            
            pointType.typeName = newName;
            await repo.save(pointType);
            return 0; // success
        } catch (error) {
            console.error('Update point type error:', error);
            return 1; // failure
        }
    }
    
    async deletePointType(id: number): Promise<number> {
        try {
            const repo = AppDataSource.getRepository(PointType);
            const pointType = await repo.findOneBy({ typeId: id });
            
            if (!pointType) {
                return 1; // not found
            }
            
            await repo.remove(pointType);
            return 0; // success
        } catch (error) {
            console.error('Delete point type error:', error);
            return 1; // failure
        }
    }

    async createStatus(name: string): Promise<number> {
        try {
            const repo = AppDataSource.getRepository(Status);
            const status = repo.create({ statusName: name });
            await repo.save(status);
            return 0; // success
        } catch (error) {
            console.error('Create status error:', error);
            return 1; // failure
        }
    }
    
    async getAllStatuses(): Promise<Status[]> {
        return AppDataSource
            .getRepository(Status)
            .find({ relations: ['rentedBooks'] });
    }
    
    async findStatus(name: string): Promise<Status | null> {
        return AppDataSource
            .getRepository(Status)
            .findOne({
                where: { statusName: name },
                relations: ['rentedBooks']
            });
    }
    
    async updateStatus(id: number, newName: string): Promise<number> {
        try {
            const repo = AppDataSource.getRepository(Status);
            const status = await repo.findOneBy({ statusId: id });
            
            if (!status) {
                return 1; // not found
            }
            
            status.statusName = newName;
            await repo.save(status);
            return 0; // success
        } catch (error) {
            console.error('Update status error:', error);
            return 1; // failure
        }
    }
    
    async deleteStatus(id: number): Promise<number> {
        try {
            const repo = AppDataSource.getRepository(Status);
            const status = await repo.findOneBy({ statusId: id });
            
            if (!status) {
                return 1; // not found
            }
            
            await repo.remove(status);
            return 0; // success
        } catch (error) {
            console.error('Delete status error:', error);
            return 1; // failure
        }
    }

    async getAllUsers(): Promise<User[]> {
        return AppDataSource
            .getRepository(User)
            .find({ relations: ['rentedBooks', 'points'] });
    }
    
    async findUser(userDto: UserDto): Promise<User | null> {
        return AppDataSource
            .getRepository(User)
            .findOne({
                where: {
                    username: userDto.name,
                    userPatronymic: userDto.patronymic,
                    email: userDto.email
                },
                relations: ['rentedBooks', 'points']
        });
    }
    
    async updateUser(id: number, userData: UserDto): Promise<number> {
        try {
            const repo = AppDataSource.getRepository(User);
            const user = await repo.findOneBy({ userId: id });
            
            if (!user) {
                return 1; // not found
            }

            const role = await AppDataSource.getRepository(Role).findOneBy({roleId: userData.roleId});
            if (!role) {
                return 1;
            }

            let result: UpdateResult;
            if (userData instanceof TeacherDto) {
                const teacher = <TeacherDto> userData;
                const degree = await AppDataSource.getRepository(ScientificDegree).findOneBy({degreeId: teacher.degreeId});
                const department = await AppDataSource.getRepository(Department).findOneBy({departmentId: teacher.departmentId});
                const title = await AppDataSource.getRepository(Title).findOneBy({titleId: teacher.titleId});

                if (!degree || !department || !title) {
                    return 1;
                }

                result = await AppDataSource.getRepository(Teacher).update(
                    id,
                    <Teacher>{
                        username: userData.name,
                        userSecondName: userData.secondName,
                        userPatronymic: userData.patronymic,
                        email: userData.email,
                        role: role,
                        passwordHash: await bcrypt.hash(userData.password, 5),
                        department: department,
                        scientificDegree: degree,
                        title: title
                });
            } else if (user instanceof StudentDto) {
                const student = <StudentDto> user;
                const faculty = await AppDataSource.getRepository(Faculty).findOneBy({facultyId: student.facultyId});

                if (!faculty) {
                    return 1;
                }

                result = await AppDataSource.getRepository(Student).update(
                    id,
                    <Student>{
                        username: userData.name,
                        userSecondName: userData.secondName,
                        userPatronymic: userData.patronymic,
                        email: userData.email,
                        role: role,
                        passwordHash: await bcrypt.hash(userData.password, 5),
                        faculty: faculty,
                        groupNumber: student.group,
                        course: student.course
                })
            } else if (role.roleName == adminRoleName || role.roleName == workerRoleName) {
                result = await AppDataSource.getRepository(User).update(
                    id,
                    {
                        username: userData.name,
                        userSecondName: userData.secondName,
                        userPatronymic: userData.patronymic,
                        email: userData.email,
                        role: role,
                        passwordHash: await bcrypt.hash(userData.password, 5)
                })
            }

            if (result.generatedMaps == null) {
                return 1;
            }
            return 0; // success
        } catch (error) {
            console.error('Update status error:', error);
            return 1; // failure
        }
    }
    
    async deleteUser(id: number): Promise<number> {
        try {
            const repo = AppDataSource.getRepository(User);
            const user = await repo.findOneBy({ userId: id });
            
            if (!user) {
                return 1; // not found
            }
            
            await repo.remove(user);
            return 0; // success
        } catch (error) {
            console.error('Delete status error:', error);
            return 1; // failure
        }
    }
}