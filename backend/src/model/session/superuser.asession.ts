import { In, Not, IsNull } from "typeorm";
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
}