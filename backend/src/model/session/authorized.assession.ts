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


    async getPopularBooks(filter: PopularBooksFilterDto): Promise<BookPopularityDto[]> {
      const query = AppDataSource.getRepository(Book)
          .createQueryBuilder('book')
          .select([
              'book.book_id as "bookId"',
              'book.title as "title"',
              'book.author as "author"',
              'COUNT(rb.book_id)::INTEGER as "totalOrders"'
          ])
          .innerJoin('rented_books', 'rb', 'rb.book_id = book.book_id')
          .groupBy('book.book_id, book.title, book.author')
          .orderBy('"totalOrders"', 'DESC')
          .limit(20);

      if (filter.universityWide) {
          // Для всего вуза не применяем фильтры по точке и факультету
          return query.getRawMany<BookPopularityDto>();
      }

      if (filter.pointId) {
          query.andWhere('rb.point_id = :pointId', { pointId: filter.pointId });
      }

      if (filter.facultyId) {
          query
              .innerJoin('users', 'u', 'u.user_id = rb.user_id')
              .innerJoin('student', 's', 's.user_id = u.user_id')
              .andWhere('s.faculty_id = :facultyId', { facultyId: filter.facultyId });
      }

      return await query.getRawMany<BookPopularityDto>();
    }

    async getBookStats(filter: BookStatsFilterDto): Promise<BookStatsResponseDto> {
        const bookRepo = AppDataSource.getRepository(Book);
        const baseQuery = bookRepo.createQueryBuilder('b')
            .select([
                'b.book_id as "bookId"',
                'b.title as "title"',
                'b.author as "author"',
                'b.release_date as "releaseDate"',
                'b.admission_date as "admissionDate"',
                'b.lost_date as "lostDate"',
                `CASE 
                    WHEN b.lost_date >= CURRENT_DATE - INTERVAL '1 year' THEN 'Утеряна'
                    ELSE 'Поступила'
                END as "status"`
            ])
            .where(`(b.admission_date >= CURRENT_DATE - INTERVAL '1 year' 
                    OR b.lost_date >= CURRENT_DATE - INTERVAL '1 year')`);

        // Фильтр по читальному залу
        if (filter.pointId && !filter.libraryWide) {
            baseQuery.innerJoin('points_books', 'pb', 'pb.book_id = b.book_id')
                    .andWhere('pb.point_id = :pointId', { pointId: filter.pointId });
        }

        // Фильтр по абоненту
        if (filter.userId) {
            baseQuery.innerJoin('rented_books', 'rb', 'rb.book_id = b.book_id')
                    .andWhere('rb.user_id = :userId', { userId: filter.userId });
        }

        // Общие фильтры
        if (filter.author) {
            baseQuery.andWhere('b.author ILIKE :author', { author: `%${filter.author}%` });
        }

        if (filter.releaseYear) {
            baseQuery.andWhere('EXTRACT(YEAR FROM b.release_date) = :releaseYear', 
                              { releaseYear: filter.releaseYear });
        }

        if (filter.admissionYear) {
            baseQuery.andWhere('EXTRACT(YEAR FROM b.admission_date) = :admissionYear', 
                              { admissionYear: filter.admissionYear });
        }

        // Запрос для подсчета статистики
        const countQuery = baseQuery.clone()
            .select([
                `SUM(CASE WHEN b.admission_date >= CURRENT_DATE - INTERVAL '1 year' THEN 1 ELSE 0 END) as "received"`,
                `SUM(CASE WHEN b.lost_date >= CURRENT_DATE - INTERVAL '1 year' THEN 1 ELSE 0 END) as "lost"`
            ]);

        const [books, counts] = await Promise.all([
            baseQuery.getRawMany<BookStatResultDto>(),
            countQuery.getRawOne<{ received: string, lost: string }>()
        ]);

        return {
            books,
            totalReceived: parseInt(counts?.received || '0', 10),
            totalLost: parseInt(counts?.lost || '0', 10)
        };
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

    abstract destroy(): Promise<void>;
    abstract refresh(): Promise<void>;
    //abstract createNewUser(userData: UserDto): Promise<[number, string]>;
}