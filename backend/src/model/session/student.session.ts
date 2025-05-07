import { BaseSession } from './session.interface';

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

    // Специфичные методы для студента
    getGrades(): Promise<any> {
        // ...
    }
}