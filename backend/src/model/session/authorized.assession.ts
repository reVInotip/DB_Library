import { FindOptionsWhere, Like, Between, Not, IsNull, LessThan, MoreThanOrEqual } from "typeorm";
import { BookSearchCriteria, PopularBooksFilterDto, BookPopularityDto, BookStatsFilterDto, BookStatsResponseDto, BookStatResultDto, RentedBookSearchCriteria } from "../../dto/books.dto";
import { PointUserSearchCriteria } from "../../dto/user_info.dto";
import AppDataSource from "../data-source";
import { Book } from "../entities/books/book";
import { PointUser } from "../entities/points/point_user";
import { ReadingPoint } from "../entities/points/reading_point";
import { User } from "../entities/user/user";
import { BaseSession, RoleType } from "./session.interface";
import { RentedBook } from "../entities/books/rented_book";
import { Status } from "../entities/books/status";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { Orders } from "../entities/books/orders";

export abstract class AuthorizedSession extends BaseSession {
    constructor(userId: number, role: RoleType, token: string, expiresAt: Date) {
        super(userId, role, token, expiresAt);
    }

    async findBooks(criteria: BookSearchCriteria): Promise<Book[]> {
        const where: FindOptionsWhere<Book> = {};
        
        if (criteria.title) {
            where.title = Like(`%${criteria.title}%`);
        }
        
        if (criteria.author) {
            where.author = Like(`%${criteria.author}%`);
        }
        
        if (criteria.minReleaseDate || criteria.maxReleaseDate) {
            where.releaseDate = Between(
                criteria.minReleaseDate || new Date(0),
                criteria.maxReleaseDate || new Date()
            );
        }
        
        if (criteria.minAdmissionDate || criteria.maxAdmissionDate) {
            where.admissionDate = Between(
                criteria.minAdmissionDate || new Date(0),
                criteria.maxAdmissionDate || new Date()
            );
        }
        
        if (criteria.minCost || criteria.maxCost) {
            where.cost = Between(
                criteria.minCost || 0,
                criteria.maxCost || Number.MAX_SAFE_INTEGER
            );
        }
        
        if (criteria.fromAnotherLib !== undefined) {
            where.fromAnotherLib = criteria.fromAnotherLib;
        }
        
        if (criteria.isLost !== undefined) {
            where.lostDate = criteria.isLost ? Not(IsNull()) : IsNull();
        }

        if (criteria.pointId !== undefined) {
            const point = await this.getReadingPointById(criteria.pointId);
            if (!point) return null;
            where.point = point;
        }
        
        return this.getAll(Book, [], { where });
    }

    async getBookById(bookId: number): Promise<Book | null> {
        return this.find(Book, { bookId });
    }

    async getAllBooks(): Promise<Book[]> {
        return this.getAll(Book);
    }

    async getReadingPointById(id: number): Promise<ReadingPoint | null> {
        return this.find(ReadingPoint, 
            { pointId: id }, 
            ['type', 'books', 'rentedBooks']
        );
    }

    async getAvailableBooks(): Promise<Book[]> {
        return this.getAll(Book, [], {
            where: { lostDate: IsNull() }
        });
    }

    async getAllReadingPoints(): Promise<ReadingPoint[]> {
        return this.getAll(ReadingPoint, 
            ['type', 'books', 'rentedBooks']
        );
    }

    async getReadingPointsByType(typeId: number): Promise<ReadingPoint[]> {
        return this.getAll(ReadingPoint, 
            ['type', 'books', 'rentedBooks'],
            { where: { type: { typeId } } }
        );
    }

    async createPointUser(pointUserData: {
        userId: number;
        pointId: number;
        registerDate: Date;
        eleminationDate?: Date;
    }): Promise<number> {
        try {
            // Проверяем существование пользователя и точки
            const [user, point] = await Promise.all([
                this.find(User, { userId: pointUserData.userId }),
                this.find(ReadingPoint, { pointId: pointUserData.pointId })
            ]);

            if (!user || !point) {
                return 1; // Пользователь или точка не найдены
            }

            return this.create(PointUser, {
                userId: pointUserData.userId,
                pointId: pointUserData.pointId,
                registerDate: pointUserData.registerDate,
                eleminationDate: pointUserData.eleminationDate
            });
        } catch (error) {
            console.error('Create PointUser error:', error);
            return 1;
        }
    }

    async findPointUser(userId: number, pointId: number): Promise<PointUser | null> {
        return this.find(PointUser, 
            { userId, pointId },
            ['readingPoint']
        );
    }

    async findPointUsers(criteria: PointUserSearchCriteria): Promise<PointUser[]> {
        const where: FindOptionsWhere<PointUser> = {};
        
        if (criteria.userId !== undefined) {
            where.userId = criteria.userId;
        }
        
        if (criteria.pointId !== undefined) {
            where.pointId = criteria.pointId;
        }
        
        if (criteria.minRegisterDate || criteria.maxRegisterDate) {
            where.registerDate = Between(
                criteria.minRegisterDate || new Date(0),
                criteria.maxRegisterDate || new Date()
            );
        }
        
        if (criteria.isActive !== undefined) {
            where.eleminationDate = criteria.isActive ? IsNull() : Not(IsNull());
        }
        
        return this.getAll(PointUser, 
            ['readingPoint'],
            { where }
        );
    }

    async updatePointUser(
        userId: number,
        pointId: number,
        updateData: {
            registerDate?: Date;
            eleminationDate?: Date | null; // null для сброса даты
        }
    ): Promise<number> {
        try {
            // Специальная обработка для сброса даты elimination
            if (updateData.eleminationDate === null) {
                return this.update(
                    PointUser, 
                    { userId, pointId },
                    { eleminationDate: null }
                );
            }
            
            return this.update(
                PointUser, 
                { userId, pointId },
                updateData
            );
        } catch (error) {
            console.error('Update PointUser error:', error);
            return 1;
        }
    }

    async deletePointUser(userId: number, pointId: number): Promise<number> {
        return this.delete(PointUser, { userId, pointId });
    }

    async deactivatePointUser(userId: number, pointId: number): Promise<number> {
        return this.update(
            PointUser,
            { userId, pointId },
            { eleminationDate: new Date() }
        );
    }

    async activatePointUser(userId: number, pointId: number): Promise<number> {
        return this.update(
            PointUser,
            { userId, pointId },
            { eleminationDate: null }
        );
    }

    async createRentedBook(rentedBookData: {
        userId: number;
        bookId: number;
        pointId: number;
        rentedDate: Date;
        expiredDate: Date;
        statusId: number;
    }): Promise<number> {
        try {
            // Проверяем существование связанных сущностей
            const [user, book, point, status] = await Promise.all([
                this.find(User, { userId: rentedBookData.userId }),
                this.find(Book, { bookId: rentedBookData.bookId }),
                this.find(ReadingPoint, { pointId: rentedBookData.pointId }),
                this.find(Status, { statusId: rentedBookData.statusId })
            ]);

            if (!user || !book || !point || !status) {
                return 1; // Одна из связанных сущностей не найдена
            }

            return this.create(RentedBook, {
                userId: rentedBookData.userId,
                bookId: rentedBookData.bookId,
                pointId: rentedBookData.pointId,
                rentedDate: rentedBookData.rentedDate,
                expiredDate: rentedBookData.expiredDate,
                status
            });
        } catch (error) {
            console.error('Create RentedBook error:', error);
            return 1;
        }
    }

    async findRentedBooks(criteria: RentedBookSearchCriteria): Promise<RentedBook[]> {
        const where: FindOptionsWhere<RentedBook> = {};
        
        if (criteria.userId !== undefined) {
            where.userId = criteria.userId;
        }
        
        if (criteria.bookId !== undefined) {
            where.bookId = criteria.bookId;
        }
        
        if (criteria.pointId !== undefined) {
            where.pointId = criteria.pointId;
        }
        
        if (criteria.statusId !== undefined) {
            where.status = { statusId: criteria.statusId };
        }
        
        if (criteria.minRentedDate || criteria.maxRentedDate) {
            where.rentedDate = Between(
                criteria.minRentedDate || new Date(0),
                criteria.maxRentedDate || new Date()
            );
        }
        
        if (criteria.minExpiredDate || criteria.maxExpiredDate) {
            where.expiredDate = Between(
                criteria.minExpiredDate || new Date(0),
                criteria.maxExpiredDate || new Date()
            );
        }
        
        if (criteria.isExpired !== undefined) {
            where.expiredDate = criteria.isExpired ? 
                LessThan(new Date()) : 
                MoreThanOrEqual(new Date());
        }
        
        return this.getAll(RentedBook, 
            ['user', 'book', 'point', 'status'],
            { where }
        );
    }

    async deleteRentedBook(userId: number, bookId: number, pointId: number): Promise<number> {
        return this.delete(RentedBook, { userId, bookId, pointId });
    }

    async changeRentedBookStatus(userId: number, pointId: number, bookId: number, statusId: number): Promise<number> {
        let status: Status;
        if (statusId !== undefined) {
            status = await AppDataSource.getRepository(Status).findOneBy({statusId});
            if (!status) return 1;
        }

        return this.update(RentedBook, {userId, pointId, bookId}, { status });
    }

    async updateRentedBook(
        userId: number,
        bookId: number,
        pointId: number,
        updateData: {
            rentedDate?: Date;
            expiredDate?: Date;
            statusId?: number;
        }
    ): Promise<number> {
        try {
            const updateObj: QueryDeepPartialEntity<RentedBook> = {};
            
            if (updateData.rentedDate !== undefined) {
                updateObj.rentedDate = updateData.rentedDate;
            }
            
            if (updateData.expiredDate !== undefined) {
                updateObj.expiredDate = updateData.expiredDate;
            }
            
            if (updateData.statusId !== undefined) {
                const status = await this.find(Status, { statusId: updateData.statusId });
                if (!status) return 1;
                updateObj.status = status;
            }

            // Проверяем, что есть что обновлять
            if (Object.keys(updateObj).length === 0) {
                return 1; // Нет полей для обновления
            }

            const result = await AppDataSource.getRepository(RentedBook)
                .createQueryBuilder()
                .update(RentedBook)
                .set(updateObj) // Явное указание значений для обновления
                .where("userId = :userId AND bookId = :bookId AND pointId = :pointId", {
                    userId,
                    bookId,
                    pointId
                })
                .execute();

            return result.affected ? 0 : 1;
        } catch (error) {
            console.error('Update RentedBook error:', error);
            return 1;
        }
    }

    async createOrder(orderData: {
        bookId: number;
        userId: number;
        phoneNumber: string;
        orderDate?: Date;
    }): Promise<number> {
        try {
            // Проверяем существование книги и пользователя
            const [book, user] = await Promise.all([
                AppDataSource.getRepository(Book).findOneBy({ bookId: orderData.bookId }),
                AppDataSource.getRepository(User).findOneBy({ userId: orderData.userId })
            ]);
            
            if (!book || !user) {
                return 1; // Книга или пользователь не найдены
            }

            const order = new Orders();
            order.book = book;
            order.user = user;
            order.phoneNumber = orderData.phoneNumber;
            order.orderDate = orderData.orderDate || new Date();

            await AppDataSource.getRepository(Orders).save(order);
            return 0; // Успех
        } catch (error) {
            console.error('Create order error:', error);
            return 1; // Ошибка
        }
    }

    async getOrder(bookId: number, userId: number): Promise<Orders | null> {
        return AppDataSource.getRepository(Orders).findOne({
            where: { bookId, userId },
            relations: ['book', 'user']
        });
    }

    async getAllOrders(): Promise<Orders[]> {
        return AppDataSource.getRepository(Orders).find({
            relations: ['book', 'user'],
            order: { orderDate: 'DESC' }
        });
    }

    async updateOrder(
        bookId: number,
        userId: number,
        updateData: {
            phoneNumber?: string;
            orderDate?: Date;
        }
    ): Promise<number> {
        try {
            const result = await AppDataSource.getRepository(Orders).update(
                { bookId, userId },
                updateData
            );
            
            return result.affected ? 0 : 1;
        } catch (error) {
            console.error('Update order error:', error);
            return 1;
        }
    }

    async deleteOrder(bookId: number, userId: number): Promise<number> {
        try {
            const result = await AppDataSource.getRepository(Orders).delete({ bookId, userId });
            return result.affected ? 0 : 1;
        } catch (error) {
            console.error('Delete order error:', error);
            return 1;
        }
    }

    abstract destroy(): Promise<void>;
    abstract refresh(): Promise<void>;
    //abstract createNewUser(userData: UserDto): Promise<[number, string]>;
}