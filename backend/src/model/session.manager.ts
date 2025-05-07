import { ISession } from './session/session.interface';
import { AuthService } from './auth/auth.service';
import { User } from './entities/user/user';
import { StudentSession } from './session/student.session';
import { TeacherSession } from './session/teacher.session';

export class SessionManager {
    private authService: AuthService = new AuthService();
    private sessions: Map<string, ISession> = new Map();

    constructor(private cleanupInterval: number = 60000) {
        this.startCleanupTask();
    }

    /**
     * 
     * @param email 
     * @param password 
     * @returns Promise<0> if all is Ok, Promise<1> if authentication failed, Promise<2> if internal error occurred
     */
    async createSession(email: string, password: string): Promise<number> {
        const authInfo: [User, string] | null = await this.authService.authenticate(email, password);
        if (authInfo == null) {
            return 1;
        }

        const user: User = authInfo[0];
        const token: string = authInfo[1];
        const expiresAt = this.authService.getTokenExpiredDate(token);
        
        var session: ISession;
        switch (user.role.roleName) {
        case 'student':
            session = new StudentSession(user.userId, token, expiresAt);
            this.sessions.set(token, new StudentSession(user.userId, token, expiresAt));
            this.scheduleDestruction(session);
            return 0;
        case 'teacher':
            session = new TeacherSession(user.userId, token, expiresAt);
            this.sessions.set(token, new TeacherSession(user.userId, token, expiresAt));
            this.scheduleDestruction(session);
            return 0;
        default:
            return 2;
        }
    }

    getSession(token: string): ISession | undefined {
        return this.sessions.get(token);
    }

    getRole(token: string): string {
        return this.sessions.get(token).role
    }

    private scheduleDestruction(session: ISession): void {
        const ttl = session.expiresAt.getTime() - Date.now();
        setTimeout(async () => {
        await session.destroy();
        this.sessions.delete(session.token);
        }, ttl);
    }

    private startCleanupTask(): void {
        setInterval(() => {
        const now = Date.now();
        this.sessions.forEach((session, userId) => {
            if (session.expiresAt.getTime() < now) {
            session.destroy();
            this.sessions.delete(userId);
            }
        });
        }, this.cleanupInterval);
    }
}