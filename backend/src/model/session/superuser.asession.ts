import { In, Not, IsNull, Between, FindOptionsWhere } from "typeorm";
import { DebtorFilterDto, DebtorsWithCountDto } from "../../dto/debtor.dto";
import { UserInfoDto, ReadersWithCountDto } from "../../dto/user_info.dto";
import AppDataSource from "../data-source";
import { Book } from "../entities/books/book";
import { RentedBook } from "../entities/books/rented_book";
import { PointUser } from "../entities/points/point_user";
import { ReadingPoint } from "../entities/points/reading_point";
import { Department } from "../entities/user/department";
import { Faculty } from "../entities/user/faculty";
import { Student } from "../entities/user/student";
import { Teacher } from "../entities/user/teacher";
import { RoleType } from "./session.interface";
import { AuthorizedSession } from "./authorized.assession";
import { BookStatResultDto, BookStatsFilterDto, BookStatsResponseDto, RentedBookSearchCriteria } from "../../dto/books.dto";
import { Status } from "../entities/books/status";
import { User } from "../entities/user/user";
import { ReadingPointStats } from "../../dto/reading_point.dto";

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
        pointId: number;
    }): Promise<number> {
        try {
            const point = await this.getReadingPointById(bookData.pointId);
            if (!point) return 1;
            return this.create(Book, {
                title: bookData.title,
                author: bookData.author,
                releaseDate: bookData.releaseDate,
                admissionDate: bookData.admissionDate,
                cost: bookData.cost,
                fromAnotherLib: bookData.fromAnotherLib,
                lostDate: bookData.lostDate,
                point: point
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
            pointId?: number;
        }
    ): Promise<number> {
        try {
            const updateObj: any = {};

            if (updateData.pointId !== undefined) {
                const point = await this.getReadingPointById(updateData.pointId);
                if (!point) return 1;
                updateObj.point = point;
            }

            updateObj.title = updateData.title;
            updateObj.author = updateData.author;
            updateObj.releaseDate = updateData.releaseDate;
            updateObj.admissionDate = updateData.admissionDate;
            updateObj.cost = updateData.cost;
            updateObj.fromAnotherLib = updateData.fromAnotherLib;
            updateObj.lostDate = updateData.lostDate;
            
            // Обработка специального случая для сброса lostDate
            if (updateData.lostDate === null) {
                return this.update(Book, { bookId }, { lostDate: null });
            }
            
            return this.update(Book, { bookId }, updateObj);
        } catch (error) {
            console.error('Update book error:', error);
            return 1;
        }
    }

    async getReadersByReadingPoint(pointId: number, userInfoDto: UserInfoDto): Promise<ReadersWithCountDto> {
        // Основной запрос для получения данных о читателях
        const query = AppDataSource.getRepository(PointUser)
            .createQueryBuilder('pu')
            .select([
                'u.userId as "userId"',
                'u.username as "username"',
                'u.userSecondName as "userSecondName"',
                'u.userPatronymic as "userPatronymic"',
                'u.email as "email"',
                'CASE WHEN s.userId IS NOT NULL THEN \'student\' ELSE \'teacher\' END as "userType"',
                'f.facultyName as "facultyName"',
                'd.departmentName as "departmentName"',
                's.groupNumber as "groupNumber"',
                's.course as "course"',
                't.scientificDegree as "scientificDegree"',
                't.title as "title"'
            ])
            .innerJoin('pu.user', 'u')
            .leftJoin(
                Student, 
                's', 
                's.userId = u.userId'
            )
            .leftJoin(
                Teacher, 
                't', 
                't.userId = u.userId'
            )
            .leftJoin(
                Faculty, 
                'f', 
                'f.facultyId = s.facultyId'
            )
            .leftJoin(
                Department, 
                'd', 
                'd.departmentId = t.departmentId'
            )
            .where('pu.pointId = :pointId', { pointId });

        // Запрос для подсчета общего количества
        const countQuery = AppDataSource.getRepository(PointUser)
            .createQueryBuilder('pu')
            .select('COUNT(DISTINCT u.userId)', 'count')
            .innerJoin('pu.user', 'u')
            .leftJoin(
                Student, 
                's', 
                's.userId = u.userId'
            )
            .leftJoin(
                Teacher, 
                't', 
                't.userId = u.userId'
            )
            .leftJoin(
                Faculty, 
                'f', 
                'f.facultyId = s.facultyId'
            )
            .leftJoin(
                Department, 
                'd', 
                'd.departmentId = t.departmentId'
            )
            .where('pu.pointId = :pointId', { pointId });

        // Добавляем фильтры для студентов
        if (userInfoDto.faculty) {
            query.andWhere('(s.userId IS NOT NULL AND f.facultyName = :facultyName)', { 
                facultyName: userInfoDto.faculty 
            });
            countQuery.andWhere('(s.userId IS NOT NULL AND f.facultyName = :facultyName)', { 
                facultyName: userInfoDto.faculty 
            });
        }

        if (userInfoDto.group) {
            query.andWhere('(s.userId IS NOT NULL AND s.groupNumber = :group)', { 
                group: userInfoDto.group 
            });
            countQuery.andWhere('(s.userId IS NOT NULL AND s.groupNumber = :group)', { 
                group: userInfoDto.group 
            });
        }

        if (userInfoDto.course) {
            query.andWhere('(s.userId IS NOT NULL AND s.course = :course)', { 
                course: userInfoDto.course 
            });
            countQuery.andWhere('(s.userId IS NOT NULL AND s.course = :course)', { 
                course: userInfoDto.course 
            });
        }

        // Добавляем фильтры для преподавателей
        if (userInfoDto.department) {
            query.andWhere('(t.userId IS NOT NULL AND d.departmentName = :departmentName)', { 
                departmentName: userInfoDto.department 
            });
            countQuery.andWhere('(t.userId IS NOT NULL AND d.departmentName = :departmentName)', { 
                departmentName: userInfoDto.department 
            });
        }

        // Выполняем оба запроса
        const [readers, totalCount] = await Promise.all([
            query.getRawMany(),
            countQuery.getRawOne()
        ]);

        // Форматируем результат
        const formattedReaders = readers.map(reader => ({
            ...reader,
            facultyName: reader.userType === 'student' ? reader.facultyName : null,
            departmentName: reader.userType === 'teacher' ? reader.departmentName : null,
            groupNumber: reader.userType === 'student' ? reader.groupNumber : null,
            course: reader.userType === 'student' ? reader.course : null,
            scientificDegree: reader.userType === 'teacher' ? reader.scientificDegree : null,
            title: reader.userType === 'teacher' ? reader.title : null
        }));

        return {
            readers: formattedReaders,
            totalCount: parseInt(totalCount.count, 10) || 0
        };
    }

    async getDebtors(filters: DebtorFilterDto): Promise<DebtorsWithCountDto> {
        // Основной запрос для получения данных о должниках
        const query = AppDataSource.getRepository(RentedBook)
            .createQueryBuilder('rb')
            .select([
                'u.userId as "userId"',
                'u.username as "username"',
                'u.userSecondName as "userSecondName"',
                'u.userPatronymic as "userPatronymic"',
                'CASE WHEN s.userId IS NOT NULL THEN \'student\' ELSE \'teacher\' END as "userType"',
                'f.facultyName as "facultyName"',
                'd.departmentName as "departmentName"',
                's.groupNumber as "groupNumber"',
                's.course as "course"',
                't.scientificDegree as "scientificDegree"',
                't.title as "title"',
                'EXTRACT(DAY FROM (NOW() - rb.expiredDate))::INTEGER as "daysOverdue"',
                'COUNT(rb.userId) as "booksCount"'
            ])
            .innerJoin('rb.user', 'u')
            .innerJoin('rb.status', 'status', 'status.statusName = \'Expired\'')
            .leftJoin(Student, 's', 's.userId = u.userId')
            .leftJoin(Teacher, 't', 't.userId = u.userId')
            .leftJoin(Faculty, 'f', 'f.facultyId = s.facultyId')
            .leftJoin(Department, 'd', 'd.departmentId = t.departmentId')
            .where('rb.expiredDate < NOW()')
            .groupBy('u.userId, s.userId, t.userId, f.facultyName, d.departmentName, s.groupNumber, s.course, t.scientificDegree, t.title, rb.expiredDate');

        // Фильтр по точке выдачи
        if (filters.pointId) {
            query.andWhere('rb.pointId = :pointId', { pointId: filters.pointId });
        }

        // Фильтры для студентов
        if (filters.faculty) {
            query.andWhere('(s.userId IS NOT NULL AND f.facultyName = :faculty)', { 
                faculty: filters.faculty 
            });
        }

        if (filters.course) {
            query.andWhere('(s.userId IS NOT NULL AND s.course = :course)', { 
                course: filters.course 
            });
        }

        if (filters.group) {
            query.andWhere('(s.userId IS NOT NULL AND s.groupNumber = :group)', { 
                group: filters.group 
            });
        }

        // Фильтры для преподавателей
        if (filters.department) {
            query.andWhere('(t.userId IS NOT NULL AND d.departmentName = :department)', { 
                department: filters.department 
            });
        }

        // Фильтр по минимальному сроку просрочки
        if (filters.minOverdueDays) {
            query.andWhere('EXTRACT(DAY FROM (NOW() - rb.expiredDate)) >= :minOverdueDays', { 
                minOverdueDays: filters.minOverdueDays 
            });
        }

        // Сортировка по количеству дней просрочки (по убыванию)
        query.orderBy('"daysOverdue"', 'DESC');

        // Запрос для подсчета общего количества уникальных должников
        const countQuery = query.clone()
            .select('COUNT(DISTINCT u.userId)', 'count')
            .orderBy(null); // Сбрасываем сортировку

        const [debtors, countResult] = await Promise.all([
            query.getRawMany(),
            countQuery.getRawOne()
        ]);

        // Форматируем результат
        const formattedDebtors = debtors.map(debtor => ({
            ...debtor,
            facultyName: debtor.userType === 'student' ? debtor.facultyName : null,
            departmentName: debtor.userType === 'teacher' ? debtor.departmentName : null,
            groupNumber: debtor.userType === 'student' ? debtor.groupNumber : null,
            course: debtor.userType === 'student' ? debtor.course : null,
            scientificDegree: debtor.userType === 'teacher' ? debtor.scientificDegree : null,
            title: debtor.userType === 'teacher' ? debtor.title : null
        }));

        return {
            debtors: formattedDebtors,
            totalCount: parseInt(countResult?.count || '0', 10)
        };
    }

    async getBookStats(filter: BookStatsFilterDto): Promise<BookStatsResponseDto> {
        const bookRepo = AppDataSource.getRepository(Book);
        const baseQuery = bookRepo.createQueryBuilder('b')
            .select([
                'b.bookId as "bookId"',
                'b.title as "title"',
                'b.author as "author"',
                'b.releaseDate as "releaseDate"',
                'b.admissionDate as "admissionDate"',
                'b.lostDate as "lostDate"',
                `CASE 
                    WHEN b.lostDate IS NOT NULL AND b.lostDate >= CURRENT_DATE - INTERVAL '1 year' THEN 'Утеряна'
                    ELSE 'Поступила'
                END as "status"`
            ])
            .where(`(b.admissionDate >= CURRENT_DATE - INTERVAL '1 year' 
                    OR (b.lostDate IS NOT NULL AND b.lostDate >= CURRENT_DATE - INTERVAL '1 year'))`);

        // Фильтр по читальному залу с использованием сущности ReadingPoint
        if (filter.pointId && !filter.libraryWide) {
            baseQuery.innerJoin(
                'b.point', 
                'rp', 
                'rp.pointId = :pointId', 
                { pointId: filter.pointId }
            );
        }

        // Фильтр по абоненту через сущность RentedBook
        if (filter.userId) {
            baseQuery.andWhere('rp.pointId = :pointId', { pointId: filter.pointId });
        }

        // Общие фильтры
        if (filter.author) {
            baseQuery.andWhere('b.author ILIKE :author', { author: `%${filter.author}%` });
        }

        if (filter.releaseYear) {
            baseQuery.andWhere('EXTRACT(YEAR FROM b.releaseDate) = :releaseYear', 
                            { releaseYear: filter.releaseYear });
        }

        if (filter.admissionYear) {
            baseQuery.andWhere('EXTRACT(YEAR FROM b.admissionDate) = :admissionYear', 
                            { admissionYear: filter.admissionYear });
        }

        // Запрос для подсчета статистики
        const countQuery = baseQuery.clone()
            .select([
                `SUM(CASE WHEN b.admissionDate >= CURRENT_DATE - INTERVAL '1 year' THEN 1 ELSE 0 END) as "received"`,
                `SUM(CASE WHEN b.lostDate IS NOT NULL AND b.lostDate >= CURRENT_DATE - INTERVAL '1 year' THEN 1 ELSE 0 END) as "lost"`
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

    async getReadingPointsStats(): Promise<{
        mostPopularPoint: ReadingPointStats;
        leastPopularPoint: ReadingPointStats;
        mostDebtorsPoint: ReadingPointStats;
        highestDebtPoint: ReadingPointStats;
    }> {
        // 1. Пункт с наибольшим числом читателей
        const mostPopularQuery = AppDataSource.getRepository(ReadingPoint)
            .createQueryBuilder('rp')
            .select([
                'rp.pointId as "pointId"',
                'rp.address as "address"',
                'COUNT(DISTINCT pu.userId) as "readerCount"'
            ])
            .leftJoin('rp.users', 'pu')
            .groupBy('rp.pointId, rp.address')
            .orderBy('"readerCount"', 'DESC')
            .limit(1)
            .getRawOne();

        // 2. Пункт с наименьшим числом читателей
        const leastPopularQuery = AppDataSource.getRepository(ReadingPoint)
            .createQueryBuilder('rp')
            .select([
                'rp.pointId as "pointId"',
                'rp.address as "address"',
                'COUNT(DISTINCT pu.userId) as "readerCount"'
            ])
            .leftJoin('rp.users', 'pu')
            .groupBy('rp.pointId, rp.address')
            .orderBy('"readerCount"', 'ASC')
            .limit(1)
            .getRawOne();

        // 3. Пункт с наибольшим числом задолжников
        const mostDebtorsQuery = AppDataSource.getRepository(ReadingPoint)
            .createQueryBuilder('rp')
            .select([
                'rp.pointId as "pointId"',
                'rp.address as "address"',
                'COUNT(DISTINCT rb.userId) as "debtorCount"'
            ])
            .leftJoin('rp.rentedBooks', 'rb')
            .leftJoin('rb.status', 'status')
            .where('status.statusName = :statusName', { statusName: 'Expired' })
            .andWhere('rb.expiredDate < CURRENT_DATE')
            .groupBy('rp.pointId, rp.address')
            .orderBy('"debtorCount"', 'DESC')
            .limit(1)
            .getRawOne();

        // 4. Пункт с наибольшей суммой задолженности
        const highestDebtQuery = AppDataSource.getRepository(ReadingPoint)
            .createQueryBuilder('rp')
            .select([
                'rp.pointId as "pointId"',
                'rp.address as "address"',
                'SUM(b.cost) as "totalDebt"'
            ])
            .leftJoin('rp.rentedBooks', 'rb')
            .leftJoin('rb.book', 'b')
            .leftJoin('rb.status', 'status')
            .where('status.statusName = :statusName', { statusName: 'Expired' })
            .andWhere('rb.expiredDate < CURRENT_DATE')
            .groupBy('rp.pointId, rp.address')
            .orderBy('"totalDebt"', 'DESC')
            .limit(1)
            .getRawOne();

        const [
            mostPopularPoint,
            leastPopularPoint,
            mostDebtorsPoint,
            highestDebtPoint
        ] = await Promise.all([
            mostPopularQuery,
            leastPopularQuery,
            mostDebtorsQuery,
            highestDebtQuery
        ]);

        return {
            mostPopularPoint: mostPopularPoint || null,
            leastPopularPoint: leastPopularPoint || null,
            mostDebtorsPoint: mostDebtorsPoint || null,
            highestDebtPoint: highestDebtPoint || null
        };
    }
}