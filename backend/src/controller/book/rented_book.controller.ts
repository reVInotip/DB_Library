import manager, { SessionManager } from "../../model/session.manager";
import { AdminSession } from "../../model/session/admin.session";
import { AuthorizedSession } from "../../model/session/authorized.assession";
import { ISession } from "../../model/session/session.interface";
import { SuperuserSession } from "../../model/session/superuser.asession";
import { AuthRequest } from "../auth/auth_request";
import { Response } from 'express';

export class RentedBookController {
    private sessionManager: SessionManager;
    
    constructor(sessionManager: SessionManager) {
        this.sessionManager = sessionManager;
    }

    private checkWorkerAccess(session: ISession): number {
        return ['admin', 'worker', 'teacher', 'student'].includes(session.role) ? 0 : 1;
    }

    async create(req: AuthRequest, res: Response) {
        if (this.checkWorkerAccess(req.session) > 0) {
            return res.status(403).json({ message: 'Forbidden: Worker access required' });
        }

        try {
            const adminSession = <AuthorizedSession> req.session;
            const result = await adminSession.createRentedBook({
                userId: Number(req.body.userId),
                bookId: Number(req.body.bookId),
                pointId: Number(req.body.pointId),
                rentedDate: new Date(req.body.rentedDate),
                expiredDate: new Date(req.body.expiredDate),
                statusId: Number(req.body.statusId)
            });
            
            if (result !== 0) {
                return res.status(400).json({ message: 'RentedBook creation failed' });
            }
            
            res.status(201).json({ message: 'RentedBook created successfully' });
        } catch (error) {
            res.status(500).json({ 
                message: error instanceof Error ? error.message : 'RentedBook creation error' 
            });
        }
    }

    async find(req: AuthRequest, res: Response) {
        if (this.checkWorkerAccess(req.session) > 0) {
            return res.status(403).json({ message: 'Forbidden: Worker access required' });
        }
        
        try {
            const session = <AuthorizedSession> req.session;
            const rentedBooks = await session.findRentedBooks({
                userId: req.query.userId ? Number(req.query.userId) : undefined,
                bookId: req.query.bookId ? Number(req.query.bookId) : undefined,
                pointId: req.query.pointId ? Number(req.query.pointId) : undefined,
                statusId: req.query.statusId ? Number(req.query.statusId) : undefined,
                minRentedDate: req.query.minRentedDate ? new Date(req.query.minRentedDate as string) : undefined,
                maxRentedDate: req.query.maxRentedDate ? new Date(req.query.maxRentedDate as string) : undefined,
                minExpiredDate: req.query.minExpiredDate ? new Date(req.query.minExpiredDate as string) : undefined,
                maxExpiredDate: req.query.maxExpiredDate ? new Date(req.query.maxExpiredDate as string) : undefined,
                isExpired: req.query.isExpired ? req.query.isExpired === 'true' : undefined
            });
            
            res.json(rentedBooks);
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'Failed to fetch RentedBooks'
            });
        }
    }

    async delete(req: AuthRequest, res: Response) {
        if (this.checkWorkerAccess(req.session) > 0) {
            return res.status(403).json({ message: 'Forbidden: Worker access required' });
        }

        try {
            const adminSession = <AuthorizedSession> req.session;
            const result = await adminSession.deleteRentedBook(
                Number(req.params.userId),
                Number(req.params.bookId),
                Number(req.params.pointId)
            );
            
            if (result !== 0) {
                return res.status(400).json({ message: 'RentedBook deletion failed' });
            }
            
            res.json({ message: 'RentedBook deleted successfully' });
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'RentedBook deletion error'
            });
        }
    }
}

export const rentedBookController = new RentedBookController(manager);