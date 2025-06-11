import { BaseSession } from "./session.interface";

export class WorkerSession extends BaseSession {
    constructor(userId: number, token: string, expiresAt: Date) {
        super(userId, 'student', token, expiresAt);
    }
    
    destroy(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    refresh(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    
}