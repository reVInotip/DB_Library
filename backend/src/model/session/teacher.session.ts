import { AuthorizedSession, BaseSession } from './session.interface';

export class TeacherSession extends AuthorizedSession {
    constructor(userId: number, token: string, expiresAt: Date) {
        super(userId, 'student', token, expiresAt);
    }

    async destroy(): Promise<void> {
        // Логика удаления сессии студента
    }

    async refresh(): Promise<void> {
        // Логика обновления токена
    }
}