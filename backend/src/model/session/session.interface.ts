import AppDataSource from "../data-source";
import { PointUserSearchCriteria, ReadersWithCountDto, UserDto, UserInfoDto } from "../../dto/user_info.dto";
import { DebtorFilterDto, DebtorResultDto, DebtorsWithCountDto } from "../../dto/debtor.dto"
import { RentedBook } from "../entities/books/rented_book";
import { PointUser } from "../entities/points/point_user";
import { User } from "../entities/user/user";
import { BookPopularityDto, BookSearchCriteria, BookStatResultDto, BookStatsFilterDto, BookStatsResponseDto, PopularBooksFilterDto } from "../../dto/books.dto";
import { Book } from "../entities/books/book";
import { Between, DeepPartial, EntityTarget, FindManyOptions, FindOneOptions, FindOptionsWhere, In, IsNull, Like, Not } from "typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { ReadingPoint } from "../entities/points/reading_point";
import { Student } from "../entities/user/student";
import { Teacher } from "../entities/user/teacher";
import { Faculty } from "../entities/user/faculty";
import { Department } from "../entities/user/department";

export type RoleType = 'teacher' | 'student' | 'admin' | 'worker' | 'unauth';
type Status = 'Expired'

export interface ISession {
    userId: number;
    role: RoleType;
    token: string;
    expiresAt: Date;
    destroy(): Promise<void>;
    refresh(): Promise<void>;
    //getProfile(): Promise<User>;
    //getRentedBooks(): Promise<RentedBook[]>;
    //getReadersByReadingPoint(pointId: number, userInfoDto: UserInfoDto): Promise<ReadersWithCountDto>;
    //getDebtors(filters: DebtorFilterDto): Promise<DebtorsWithCountDto>;
    //getPopularBooks(filter: PopularBooksFilterDto): Promise<BookPopularityDto[]>;
    //createNewUser(userData: UserDto): Promise<[number, string]>;

    getReadingPointById(id: number): Promise<ReadingPoint | null>;
    getAllReadingPoints(): Promise<ReadingPoint[]>;
    getReadingPointsByType(typeId: number): Promise<ReadingPoint[]>;
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

    // Улучшенные базовые CRUD операции
    protected async create<T>(
        entity: EntityTarget<T>, 
        data: DeepPartial<T>
    ): Promise<number> {
        try {
            const repo = AppDataSource.getRepository(entity);
            const entityObj = repo.create(data);
            await repo.save(entityObj);
            return 0;
        } catch (error) {
            console.error(`Create error for ${entity.toString()}:`, error);
            return 1;
        }
    }

    protected async find<T>(
        entity: EntityTarget<T>,
        conditions: FindOptionsWhere<T>,
        relations?: string[],
        options?: FindOneOptions<T>
    ): Promise<T | null> {
        return AppDataSource.getRepository(entity).findOne({
            where: conditions,
            relations,
            ...options
        });
    }

    protected async getAll<T>(
        entity: EntityTarget<T>,
        relations?: string[],
        options?: FindManyOptions<T>
    ): Promise<T[]> {
        return AppDataSource.getRepository(entity).find({
            relations,
            ...options
        });
    }

    protected async delete<T>(
        entity: EntityTarget<T>, 
        conditions: FindOptionsWhere<T>
    ): Promise<number> {
        const result = await AppDataSource.getRepository(entity).delete(conditions);
        return result.affected ? 0 : 1;
    }

    protected async update<T>(
        entity: EntityTarget<T>,
        conditions: FindOptionsWhere<T>,
        data: QueryDeepPartialEntity<T>
    ): Promise<number> {
        const result = await AppDataSource.getRepository(entity).update(conditions, data);
        return result.affected ? 0 : 1;
    }

    async getReadingPointById(id: number): Promise<ReadingPoint | null> {
        return this.find(ReadingPoint, 
            { pointId: id }, 
            ['type', 'books']
        );
    }

    async getAllReadingPoints(): Promise<ReadingPoint[]> {
        return this.getAll(ReadingPoint, 
            ['type', 'books']
        );
    }

    async getReadingPointsByType(typeId: number): Promise<ReadingPoint[]> {
        return this.getAll(ReadingPoint, 
            ['type', 'books'],
            { where: { type: { typeId } } }
        );
    }

    abstract destroy(): Promise<void>;
    abstract refresh(): Promise<void>;
    //abstract createNewUser(userData: UserDto): Promise<[number, string]>;
}