import { InsertResult } from 'typeorm';
import { BookDataSource, UserDataSource } from '../data-source';
import { UserInfoDto } from '../dto/user_info.dto';
import { BaseSession } from './session.interface';
import { Book } from '../entities/books/book';
import { RentedBook } from '../entities/books/rented_book';
import { User } from '../entities/user/user';
import { BookWithReadingPointDto } from '../dto/books.dto';
import { ReadingPoint } from '../entities/points/reading_point';
import { PointType } from '../entities/points/point_type';
import { Orders } from '../entities/books/orders';

export class StudentSession extends BaseSession {
    constructor(userId: number, token: string, expiresAt: Date) {
        super(userId, 'student', token, expiresAt);
    }

    async destroy(): Promise<void> {
        // Логика удаления сессии студента
    }

    async refresh(): Promise<void> {
        // Логика обновления токена
    }

    async updateProfile(userId: number, updateData: Partial<User>) {
        return UserDataSource.getRepository(User)
        .createQueryBuilder()
        .update()
        .set(updateData)
        .where('user_id = :userId AND role = :role', { 
            userId, 
            role: 'student' 
        })
        .execute();
    }

    // Аренда книг
    async rentBook(userId: number, bookId: number, pointId: number, rentedDate: Date, expiredDate: Date): Promise<number> {
        const countBooks: number = await BookDataSource.getRepository(RentedBook)
        .createQueryBuilder('rb')
        .select([
            'rb.book_id as rented_book'
        ])
        .getCount()

        if (countBooks <= 0) {
            return 2;
        }

        const result: InsertResult = await BookDataSource.getRepository(RentedBook)
        .createQueryBuilder()
        .insert()
        .values({
            user: userId,
            book: bookId,
            point: pointId,
            rentedDate: rentedDate,
            expiredDate: expiredDate
        })
        .execute();

        if (result.identifiers == null) {
            return 1;
        }

        return 0;
    }

    async orderBook(bookId: number, phone: string, orderDate: Date): Promise<number> {
        const result: InsertResult  = await BookDataSource.getRepository(Orders)
        .createQueryBuilder()
        .insert()
        .values({
            book: bookId,
            phoneNumber: phone,
            orderDate: orderDate
        })
        .execute();

        if (result.identifiers == null) {
            return 1;
        }

        return 0;
    }

    // Поиск книг
    async searchBooks(filters: { author?: string; title?: string }): Promise<BookWithReadingPointDto[]> {
        const query = BookDataSource.getRepository(Book)
        .createQueryBuilder('b')
        .select([
            'b.book_id AS bookId',
            'b.title AS title',
            'b.author AS author',
            'b.release_date AS releaseDate',
            'rp.point_id AS pointId',
            'rp.point_type AS pointType',
            'rp.address AS address',
        ])
        .innerJoin('points_books', 'pb', 'pb.book_id = b.book_id')
        .innerJoin(ReadingPoint, 'rp', 'rp.point_id = pb.point_id')
        .innerJoin(PointType, 'pt', 'pt.type_id = rp.type_id')
        .leftJoin(RentedBook, 'rb', 
            'rb.book_id = b.book_id AND rb.point_id = pb.point_id AND rb.status_id = 1'
        )
        .where('rb.book_id IS NULL') // Исключаем арендованные книги
        .andWhere('b.lost_date IS NULL'); // Исключаем утерянные книги

        if (filters.author) {
            query.andWhere('b.author ILIKE :author', { author: `%${filters.author}%` });
        }

        if (filters.title) {
            query.andWhere('b.title ILIKE :title', { title: `%${filters.title}%` });
        }

        return query.getRawMany<BookWithReadingPointDto>();
    }

    async getBooksFromReadingPoint(filters: { author?: string; title?: string }, pointId: number): Promise<Book[]> {
        const query = BookDataSource.getRepository(Book)
        .createQueryBuilder('b')
        .select([
            'b.book_id AS bookId',
            'b.title AS title',
            'b.author AS author',
            'b.release_date AS releaseDate'
        ])
        .innerJoin('points_books', 'pb', 'pb.book_id = b.book_id')
        .innerJoin(ReadingPoint, 'rp', 'rp.point_id = pb.point_id')
        .innerJoin(PointType, 'pt', 'pt.type_id = rp.type_id')
        .leftJoin(RentedBook, 'rb', 
            'rb.book_id = b.book_id AND rb.point_id = pb.point_id AND rb.status_id = 1'
        )
        .where('rb.book_id IS NULL') // Исключаем арендованные книги
        .andWhere('b.lost_date IS NULL') // Исключаем утерянные книги
        .andWhere('readingPoint.pointId = :pointId', { pointId });

        if (filters.author) {
            query.andWhere('b.author ILIKE :author', { author: `%${filters.author}%` });
        }

        if (filters.title) {
            query.andWhere('b.title ILIKE :title', { title: `%${filters.title}%` });
        }

        return query.getMany();
    }
}