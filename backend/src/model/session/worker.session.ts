import { AuthorizedSession, BaseSession, SuperuserSession } from "./session.interface";

export class WorkerSession extends SuperuserSession {
    constructor(userId: number, token: string, expiresAt: Date) {
        super(userId, 'worker', token, expiresAt);
    }
    
    destroy(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    refresh(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    
}