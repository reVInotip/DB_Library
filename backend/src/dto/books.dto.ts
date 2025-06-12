import { Book } from "../model/entities/books/book";
import { PointType } from "../model/entities/points/point_type";
import { ReadingPoint } from "../model/entities/points/reading_point";

export class PopularBooksFilterDto {
    facultyId?: number;
    pointId?: number;
    universityWide?: boolean;
}

export class BookPopularityDto {
    bookId: number;
    title: string;
    author: string;
    totalOrders: number;
}

export class BookStatsFilterDto {
    pointId?: number;
    userId?: number;
    author?: string;
    releaseYear?: number;
    admissionYear?: number;
    libraryWide?: boolean;
}

export class BookStatResultDto {
    bookId: number;
    title: string;
    author: string;
    releaseDate: Date;
    admissionDate: Date;
    lostDate?: Date;
    status: 'Поступила' | 'Утеряна';
}

export class BookStatsResponseDto {
    books: BookStatResultDto[];
    totalReceived: number;
    totalLost: number;
}

export class BookWithReadingPointDto {
    bookId: number;
    title: string;
    author: string;
    releaseDate: Date;
    pointId: number;
    type: PointType;
    address: string;
}

export class BookSearchCriteria {
    title?: string;
    author?: string;
    minReleaseDate?: Date;
    maxReleaseDate?: Date;
    minAdmissionDate?: Date;
    maxAdmissionDate?: Date;
    minCost?: number;
    maxCost?: number;
    fromAnotherLib?: boolean;
    isLost?: boolean;
    pointId?: number
}

export class RentedBookSearchCriteria {
    userId?: number;
    bookId?: number;
    pointId?: number;
    statusId?: number;
    minRentedDate?: Date;
    maxRentedDate?: Date;
    minExpiredDate?: Date;
    maxExpiredDate?: Date;
    isExpired?: boolean;
}