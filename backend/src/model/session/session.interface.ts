import AppDataSource from "../data-source";
import { ReadersWithCountDto, UserDto, UserInfoDto } from "../../dto/user_info.dto";
import { DebtorFilterDto, DebtorResultDto, DebtorsWithCountDto } from "../../dto/debtor.dto"
import { RentedBook } from "../entities/books/rented_book";
import { PointUser } from "../entities/points/point_user";
import { User } from "../entities/user/user";
import { BookPopularityDto, BookSearchCriteria, BookStatResultDto, BookStatsFilterDto, BookStatsResponseDto, PopularBooksFilterDto } from "../../dto/books.dto";
import { Book } from "../entities/books/book";
import { Between, DeepPartial, EntityTarget, FindManyOptions, FindOneOptions, FindOptionsWhere, In, IsNull, Like, Not } from "typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { ReadingPoint } from "../entities/points/reading_point";

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

    async getReadersByReadingPoint(pointId: number, userInfoDto: UserInfoDto): Promise<ReadersWithCountDto> {
        // Основной запрос для получения данных о читателях
        const query = AppDataSource.getRepository(PointUser)
            .createQueryBuilder('pu')
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

        // Создаем копию запроса для подсчета общего количества
        const countQuery = AppDataSource.getRepository(PointUser)
            .createQueryBuilder('pu')
            .select('COUNT(DISTINCT u.userId)', 'count')
            .leftJoin('pu.user', 'u')
            .leftJoin('u.category', 'c')
            .leftJoin('student', 's', 's.userId = u.userId')
            .leftJoin('teacher', 't', 't.userId = u.userId')
            .leftJoin('faculties', 'f', 'f.facultyId = s.facultyId')
            .leftJoin('departments', 'd', 'd.departmentId = t.departmentId')
            .where('pu.pointId = :pointId', { pointId });

        // Добавляем опциональные фильтры в оба запроса
        if (userInfoDto.faculty) {
            query.andWhere('f.facultyName = :facultyName', { facultyName: userInfoDto.faculty });
            countQuery.andWhere('f.facultyName = :facultyName', { facultyName: userInfoDto.faculty });
        }

        if (userInfoDto.department) {
            query.andWhere('d.departmentName = :departmentName', { departmentName: userInfoDto.department });
            countQuery.andWhere('d.departmentName = :departmentName', { departmentName: userInfoDto.department });
        }

        if (userInfoDto.group) {
            query.andWhere('s.groupNumber = :group', { group: userInfoDto.group }); // Исправлена опечатка (было department вместо group)
            countQuery.andWhere('s.groupNumber = :group', { group: userInfoDto.group });
        }

        if (userInfoDto.course) {
            query.andWhere('s.course = :course', { course: userInfoDto.course });
            countQuery.andWhere('s.course = :course', { course: userInfoDto.course });
        }

        // Выполняем оба запроса
        const [readers, totalCount] = await Promise.all([
            query.getRawMany(),
            countQuery.getRawOne()
        ]);

        return {
            readers,
            totalCount: parseInt(totalCount.count, 10) || 0
        };
    }

    async getDebtors(filters: DebtorFilterDto): Promise<DebtorsWithCountDto> {
        const mainQuery = AppDataSource.getRepository(User).createQueryBuilder('user')
            .select([
                'user.user_id as "userId"',
                'user.username as "username"',
                'user.user_second_name as "userSecondName"',
                'faculty.faculty_name as "facultyName"',
                'department.department_name as "departmentName"',
                'student.group_number as "groupNumber"',
                'student.course as "course"',
                'category.category_name as "categoryName"',
                `EXTRACT(DAY FROM NOW() - rb.expired_date)::INTEGER as "daysOverdue"`
            ])
            .innerJoin('rented_books', 'rb', 'rb.user_id = user.user_id')
            .innerJoin('statuses', 'status', 'status.status_id = rb.status_id')
            .leftJoin('student', 'student', 'student.user_id = user.user_id')
            .leftJoin('teacher', 'teacher', 'teacher.user_id = user.user_id')
            .leftJoin('faculties', 'faculty', 'faculty.faculty_id = student.faculty_id')
            .leftJoin('departments', 'department', 'department.department_id = teacher.department_id')
            .leftJoin('categories', 'category', 'category.category_id = user.category_id')
            .where('status.status_name = :statusName', { statusName: 'Expired' })
            .andWhere('rb.expired_date < NOW() - INTERVAL \'10 days\'');

        // Фильтр по абоненту
        if (filters.pointId) {
            mainQuery.andWhere('rb.point_id = :pointId', { pointId: filters.pointId });
        }

        // Остальные фильтры
        if (filters.faculty) {
            mainQuery.andWhere('faculty.faculty_name = :faculty', { faculty: filters.faculty });
        }

        if (filters.department) {
            mainQuery.andWhere('department.department_name = :department', { department: filters.department });
        }

        if (filters.course) {
            mainQuery.andWhere('student.course = :course', { course: filters.course });
        }

        if (filters.group) {
            mainQuery.andWhere('student.group_number = :group', { group: filters.group });
        }

        if (filters.category) {
            mainQuery.andWhere('category.category_name = :category', { category: filters.category });
        }

        // Запрос для подсчета общего количества
        const countQuery = mainQuery.clone()
            .select('COUNT(DISTINCT user.user_id)', 'count')
            .orderBy(null); // Сбрасываем сортировку

        const [debtors, countResult] = await Promise.all([
            mainQuery.groupBy('user.user_id, faculty.faculty_name, department.department_name, student.group_number, student.course, category.category_name, rb.expired_date')
                .getRawMany<DebtorResultDto>(),
            countQuery.getRawOne<{ count: string }>()
        ]);

        return {
            debtors,
            totalCount: parseInt(countResult?.count || '0', 10)
      }
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

    abstract destroy(): Promise<void>;
    abstract refresh(): Promise<void>;
    //abstract createNewUser(userData: UserDto): Promise<[number, string]>;
}

export abstract class SuperuserSession extends AuthorizedSession {
    constructor(userId: number, role: RoleType, token: string, expiresAt: Date) {
        super(userId, role, token, expiresAt);
    }

    async addBooksToReadingPoint(
        pointId: number, 
        bookIds: number[]
    ): Promise<number> {
        try {
            const point = await this.getReadingPointById(pointId);
            if (!point) return 1;

            const books = await this.getAll(Book, [], { 
                where: { bookId: In(bookIds) } 
            });

            point.books = [...point.books, ...books];
            await AppDataSource.getRepository(ReadingPoint).save(point);
            return 0;
        } catch (error) {
            console.error('Add books to reading point error:', error);
            return 1;
        }
    }

    async removeBooksFromReadingPoint(
        pointId: number, 
        bookIds: number[]
    ): Promise<number> {
        try {
            const point = await this.getReadingPointById(pointId);
            if (!point) return 1;

            point.books = point.books.filter(book => !bookIds.includes(book.bookId));
            await AppDataSource.getRepository(ReadingPoint).save(point);
            return 0;
        } catch (error) {
            console.error('Remove books from reading point error:', error);
            return 1;
        }
    }

    async createBook(bookData: {
        title: string;
        author: string;
        releaseDate: Date;
        admissionDate: Date;
        cost: number;
        fromAnotherLib: boolean;
        lostDate?: Date;
    }): Promise<number> {
        try {
            return this.create(Book, {
                title: bookData.title,
                author: bookData.author,
                releaseDate: bookData.releaseDate,
                admissionDate: bookData.admissionDate,
                cost: bookData.cost,
                fromAnotherLib: bookData.fromAnotherLib,
                lostDate: bookData.lostDate
            });
        } catch (error) {
            console.error('Create book error:', error);
            return 1;
        }
    }

    async markBookAsLost(bookId: number): Promise<number> {
        return this.update(Book, { bookId }, { 
            lostDate: new Date() 
        });
    }

    async markBookAsFound(bookId: number): Promise<number> {
        return this.update(Book, { bookId }, { 
            lostDate: null 
        });
    }

    async deleteBook(bookId: number): Promise<number> {
        return this.delete(Book, { bookId });
    }

    async getLostBooks(): Promise<Book[]> {
        return this.getAll(Book, [], {
            where: { lostDate: Not(IsNull()) }
        });
    }

    async updateBook(
        bookId: number, 
        updateData: {
            title?: string;
            author?: string;
            releaseDate?: Date;
            admissionDate?: Date;
            cost?: number;
            fromAnotherLib?: boolean;
            lostDate?: Date | null;
        }
    ): Promise<number> {
        try {
            // Обработка специального случая для сброса lostDate
            if (updateData.lostDate === null) {
                return this.update(Book, { bookId }, { lostDate: null });
            }
            
            return this.update(Book, { bookId }, updateData);
        } catch (error) {
            console.error('Update book error:', error);
            return 1;
        }
    }
}