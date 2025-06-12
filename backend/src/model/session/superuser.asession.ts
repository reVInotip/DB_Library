import { In, Not, IsNull, Between, FindOptionsWhere, LessThanOrEqual } from "typeorm";
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
import { Orders } from "../entities/books/orders";
import { format, startOfMonth, subMonths, subYears } from "date-fns";

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

    private calculateStartDate(period: 'month' | 'semester' | 'year'): Date {
        const now = new Date();
        switch (period) {
            case 'month': return new Date(now.setMonth(now.getMonth() - 1));
            case 'semester': return new Date(now.setMonth(now.getMonth() - 6));
            case 'year': return new Date(now.setFullYear(now.getFullYear() - 1));
            default: throw new Error('Invalid period');
        }
    }

    async getInterlibraryOrders(filters: {
        period?: 'month' | 'semester' | 'year';
        bookTitle?: string;
        author?: string;
        minCost?: number;
        maxCost?: number;
    }) {
        // Базовый запрос
        const queryBuilder = AppDataSource.getRepository(Orders)
            .createQueryBuilder('order')
            .leftJoinAndSelect('order.book', 'book')
            .where('book.fromAnotherLib = :fromAnotherLib', { fromAnotherLib: true });

        // Период
        if (filters.period) {
            const startDate = this.calculateStartDate(filters.period);
            queryBuilder.andWhere('order.orderDate >= :startDate', { startDate });
        }

        // Дополнительные фильтры
        if (filters.bookTitle) {
            queryBuilder.andWhere('book.title LIKE :title', { title: `%${filters.bookTitle}%` });
        }

        if (filters.author) {
            queryBuilder.andWhere('book.author LIKE :author', { author: `%${filters.author}%` });
        }

        if (filters.minCost !== undefined) {
            queryBuilder.andWhere('book.cost >= :minCost', { minCost: filters.minCost });
        }

        if (filters.maxCost !== undefined) {
            queryBuilder.andWhere('book.cost <= :maxCost', { maxCost: filters.maxCost });
        }

        // Выполнение запроса
        const [orders, totalCount] = await Promise.all([
            queryBuilder.getMany(),
            queryBuilder.getCount()
        ]);

        return {
            books: orders.map(order => order.book),
            totalCount
        };
    }

    async banUser(userId: number): Promise<number> {
        return this.update(User, { userId: userId }, { bannedDate: new Date() });
    }

    async setUserBannedDate(userId: number, bannedDate: Date): Promise<number> {
        return this.update(User, { userId: userId }, { bannedDate: bannedDate });
    }

    async unbanUser(userId: number): Promise<number> {
        return this.update(User, { userId: userId }, { bannedDate: null });
    }

    async getBannedUsersStatisticsDetailed(filters: {
        facultyId?: number;
        departmentId?: number;
        course?: number;
        groupNumber?: number;
        roleId?: number;
    }): Promise<Array<Student | Teacher>> {
        const twoMonthsAgo = subMonths(new Date(), 2);

        // Базовые условия для забаненных пользователей
        const baseConditions = {
            bannedDate: LessThanOrEqual(twoMonthsAgo)
        };

        // Создаем запросы для студентов и преподавателей
        const studentQuery = AppDataSource.createQueryBuilder(Student, 'student')
            .leftJoinAndSelect('student.faculty', 'faculty')
            .leftJoinAndSelect('student.role', 'role')
            .where({ ...baseConditions });

        const teacherQuery = AppDataSource.createQueryBuilder(Teacher, 'teacher')
            .leftJoinAndSelect('teacher.department', 'department')
            .leftJoinAndSelect('teacher.role', 'role')
            .where({ ...baseConditions });

        // Применяем фильтры
        if (filters.facultyId) {
            studentQuery.andWhere('student.facultyId = :facultyId', { facultyId: filters.facultyId });
        }

        if (filters.departmentId) {
            teacherQuery.andWhere('teacher.departmentId = :departmentId', { departmentId: filters.departmentId });
        }

        if (filters.course) {
            studentQuery.andWhere('student.course = :course', { course: filters.course });
        }

        if (filters.groupNumber) {
            studentQuery.andWhere('student.groupNumber = :groupNumber', { groupNumber: filters.groupNumber });
        }

        if (filters.roleId) {
            studentQuery.andWhere('student.roleId = :roleId', { roleId: filters.roleId });
            teacherQuery.andWhere('teacher.roleId = :roleId', { roleId: filters.roleId });
        }

        // Если тип пользователя не указан, возвращаем и студентов и преподавателей
        const [students, teachers] = await Promise.all([
            studentQuery.getMany(),
            teacherQuery.getMany()
        ]);

        return [...students, ...teachers];
    }

    async getEleminationReaders(options: {
        period: 'month' | 'semester' | 'year';
        pointId?: number;
        facultyId?: number;
        departmentId?: number;
        course?: number;
        groupNumber?: number;
        roleId?: number;
        action: 'new' | 'eliminated' | 'both';
    }): Promise<{
        total: number;
        users: Array<User & { student?: Student; teacher?: Teacher }>;
    }> {        
        // Определяем временной период
        let startDate: Date;
        const endDate = new Date();
        
        switch (options.period) {
            case 'month': startDate = subMonths(endDate, 1); break;
            case 'semester': startDate = subMonths(endDate, 6); break;
            case 'year': startDate = subYears(endDate, 1); break;
            default: startDate = subMonths(endDate, 1);
        }

        // Преобразуем даты в формат БД (YYYY-MM-DD) для корректного сравнения
        const dbStartDate = format(startDate, 'yyyy-MM-dd');
        const dbEndDate = format(endDate, 'yyyy-MM-dd');

        // Базовые условия для даты (используем строки в формате БД)
        const dateCondition = options.action === 'new' 
            ? `pu.registerDate BETWEEN '${dbStartDate}' AND '${dbEndDate}'`
            : options.action === 'eliminated' 
                ? `pu.eleminationDate BETWEEN '${dbStartDate}' AND '${dbEndDate}'`
                : `(pu.registerDate BETWEEN '${dbStartDate}' AND '${dbEndDate}' OR 
                pu.eleminationDate BETWEEN '${dbStartDate}' AND '${dbEndDate}')`;


            // Основной запрос для PointUser
        const pointUsersQuery = AppDataSource.createQueryBuilder(PointUser, 'pu')
            .innerJoinAndSelect('pu.user', 'user')
            .leftJoinAndSelect('user.role', 'role')
            .where(dateCondition);

        // Применяем общие фильтры
        if (options.pointId) {
            pointUsersQuery.andWhere('pu.pointId = :pointId', { pointId: options.pointId });
        }
        if (options.roleId) {
            pointUsersQuery.andWhere('user.roleId = :roleId', { roleId: options.roleId });
        }

        // Получаем pointUsers
        const pointUsers = await pointUsersQuery.getMany();
        const userIds = pointUsers.map(pu => pu.user.userId);

        if (userIds.length === 0) {
            return { total: 0, users: [] };
        }

        // Получаем студентов и преподавателей отдельными запросами
        const [students, teachers] = await Promise.all([
            AppDataSource.getRepository(Student).find({ 
                where: { userId: In(userIds) },
                relations: ['faculty']
            }),
            AppDataSource.getRepository(Teacher).find({
                where: { userId: In(userIds) },
                relations: ['department']
            })
        ]);

        // Применяем дополнительные фильтры
        const filteredStudents = students.filter(s => {
            return (!options.facultyId || s.faculty.facultyId === options.facultyId) &&
                (!options.course || s.course === options.course) &&
                (!options.groupNumber || s.groupNumber === options.groupNumber);
        });

        const filteredTeachers = teachers.filter(t => {
            return !options.departmentId || t.department.departmentId === options.departmentId;
        });

        // Собираем результат
        const resultUsers = pointUsers.map(pu => {
            const user = pu.user;
            const student = students.find(s => s.userId === user.userId);
            const teacher = teachers.find(t => t.userId === user.userId);

            return {
                ...user,
                student,
                teacher
            };
        }).filter(user => {
            if (user.student) {
                return filteredStudents.some(s => s.userId === user.userId);
            }
            if (user.teacher) {
                return filteredTeachers.some(t => t.userId === user.userId);
            }
            return false;
        });

        return {
            total: resultUsers.length,
            users: resultUsers
        };
    }
}