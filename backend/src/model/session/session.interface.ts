import { ReadingPointDataSource } from "../data-source";
import { UserInfoDto } from "../dto/user_info.dto";
import { RentedBook } from "../entities/books/rented_book";
import { PointUser } from "../entities/points/point_user";
import { User } from "../entities/user/user";

export type RoleType = 'teacher' | 'student' | 'admin'

export interface ISession {
    userId: number;
    role: RoleType;
    token: string;
    expiresAt: Date;
    destroy(): Promise<void>;
    refresh(): Promise<void>;
    //getProfile(): Promise<User>;
    //getRentedBooks(): Promise<RentedBook[]>;
    getReadersByReadingPoint(pointId: number, userInfoDto: UserInfoDto): Promise<any[]>
}
  
// Базовый класс для всех сессий
export abstract class BaseSession implements ISession {
    constructor(
        public readonly userId: number,
        public readonly role: RoleType,
        public token: string,
        public expiresAt: Date
    ) {
        this.userId = userId;
        this.role = role;
        this.token = token;
        this.expiresAt = expiresAt;
    }

    async getReadersByReadingPoint(pointId: number, userInfoDto: UserInfoDto): Promise<any[]> {
        const query = ReadingPointDataSource.getRepository(PointUser).createQueryBuilder('pu')
            .select([
                'u.userId as userId',
                'u.username as username',
                'u.userSecondName as userSecondName',
                'f.facultyName as facultyName',
                'd.departmentName as departmentName',
                's.groupNumber as groupNumber',
                's.course as course',
                'c.categoryName as categoryName'
            ])
            .leftJoin('pu.user', 'u')
            .leftJoin('u.category', 'c')
            .leftJoin('student', 's', 's.userId = u.userId')
            .leftJoin('teacher', 't', 't.userId = u.userId')
            .leftJoin('faculties', 'f', 'f.facultyId = s.facultyId')
            .leftJoin('departments', 'd', 'd.departmentId = t.departmentId')
            .where('pu.pointId = :pointId', { pointId });
    
        // Добавляем опциональные фильтры
        if (userInfoDto.faculty) {
          query.andWhere('f.facultyName = :facultyName', { facultyName: userInfoDto.faculty });
        }
    
        if (userInfoDto.department) {
          query.andWhere('d.departmentName = :departmentName', { departmentName: userInfoDto.department });
        }
    
        if (userInfoDto.group) {
          query.andWhere('s.groupNumber = :group', { group: userInfoDto.department });
        }
    
        if (userInfoDto.course) {
          query.andWhere('s.course = :course', { course: userInfoDto.course });
        }
    
        return query.getRawMany();
    }

    abstract destroy(): Promise<void>;
    abstract refresh(): Promise<void>;
}