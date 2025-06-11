import { RoleType } from './session/session.interface';
import { AuthService } from './auth/auth.service';
import { User } from './entities/user/user';
import { StudentSession } from './session/student.session';
import { TeacherSession } from './session/teacher.session';
import { UserDto } from '../dto/user_info.dto';
import { AdminSession } from './session/admin.session';
import { Student } from './entities/user/student';
import { Teacher } from './entities/user/teacher';
import { WorkerSession } from './session/worker.session';
import { UnauthorizedSession } from './session/unauth.session';
import { AuthorizedSession } from './session/authorized.assession';

export const adminRoleName: RoleType = "admin";
export const workerRoleName: RoleType = 'worker';

export class SessionManager {
    initialized = false;
    private authService: AuthService = new AuthService();
    private sessions: Map<string, AuthorizedSession> = new Map();

    constructor(private cleanupInterval: number = 60000) {
        this.startCleanupTask();
    }

    async init() {
        // create init admin session
        const initSession: AdminSession = this.createInitSession();
        await initSession.createRole(adminRoleName);

        const users = await initSession.getAllUsers();

        if (users && users.length != 0) {
            return;
        }

        const role = await initSession.findRole(adminRoleName);
        const result = await initSession.createUser({
            name: process.env.USERNAME,
            secondName: "",
            patronymic: "",
            email: "aboba@mail.ru",
            password: process.env.PASSWORD,
            roleId: role.roleId
        });

        if (result != 0) {
            throw new Error("can not create default user");
        }
    }

    /**
     * 
     * @param email 
     * @param password 
     * @returns Promise<0> if all is Ok, Promise<1> if authentication failed, Promise<2> if internal error occurred
     */
    async createSession(email: string, password: string, role: string): Promise<[number, string]> {
        const authInfo: [User, string] | null = await this.authService.authenticate(email, password, role);
        if (authInfo == null) {
            return [1, null];
        }

        const user: User = authInfo[0];
        const token: string = authInfo[1];
        const expiresAt = this.authService.getTokenExpiredDate(token);
        
        var session: AuthorizedSession;
        if (user instanceof Student) {
            session = new StudentSession(user.userId, token, expiresAt);
            this.sessions.set(token, session);
            this.scheduleDestruction(session);
            return [0, token];
        } else if (user instanceof Teacher) {
            session = new TeacherSession(user.userId, token, expiresAt);
            this.sessions.set(token, session);
            this.scheduleDestruction(session);
            return [0, token];
        } else if (user.role.roleName == adminRoleName) {
            session = new AdminSession(user.userId, token, expiresAt, this.authService);
            this.sessions.set(token, session);
            this.scheduleDestruction(session);
            return [0, token];
        } else if (user.role.roleName == workerRoleName) {
            session = new WorkerSession(user.userId, token, expiresAt);
            this.sessions.set(token, session);
            this.scheduleDestruction(session);
            return [0, token];
        }

        return [2, token];
    }

    createUnauthSession() {
        return new UnauthorizedSession(null, null, null);
    }

    private createInitSession() {
        return new AdminSession(1, "aksmdksacm", new Date(), this.authService);
    }

    async registerNewUser(userData: UserDto): Promise<[number, string]> {
        const regInfo: [User, string] | null = await this.authService.register(userData);
        if (regInfo == null) {
            return [1, null];
        }

        const user: User = regInfo[0];
        const token: string = regInfo[1];
        const expiresAt = this.authService.getTokenExpiredDate(token);
        
        var session: AuthorizedSession;
        if (user instanceof Student) {
            session = new StudentSession(user.userId, token, expiresAt);
            this.sessions.set(token, session);
            this.scheduleDestruction(session);
            return [0, token];
        } else if (user instanceof Teacher) {
            session = new TeacherSession(user.userId, token, expiresAt);
            this.sessions.set(token, session);
            this.scheduleDestruction(session);
            return [0, token];
        }

        return [2, token];
    }

    getSession(token: string): AuthorizedSession | undefined {
        if (!this.authService.isTokenValid(token)) {
            return undefined;
        }
        return this.sessions.get(token);
    }

    getRole(token: string): string {
        return this.sessions.get(token).role
    }

    private scheduleDestruction(session: AuthorizedSession): void {
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

const manager = new SessionManager();

export default manager;