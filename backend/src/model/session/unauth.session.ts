import { In } from "typeorm";
import { Book } from "../entities/books/book";
import { PointType } from "../entities/points/point_type";
import { ReadingPoint } from "../entities/points/reading_point";
import { BaseSession } from "./session.interface";
import AppDataSource from "../data-source";

export class UnauthorizedSession extends BaseSession {
    constructor(userId: number, token: string, expiresAt: Date) {
        super(userId, 'unauth', token, expiresAt);
    }

    destroy(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    refresh(): Promise<void> {
        throw new Error("Method not implemented.");
    }
}