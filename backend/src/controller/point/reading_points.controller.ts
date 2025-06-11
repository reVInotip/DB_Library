
import { Response } from 'express';
import manager, { SessionManager } from '../../model/session.manager';
import { AuthRequest } from '../auth/auth_request';
import { AdminSession } from '../../model/session/admin.session';
import { ISession } from '../../model/session/session.interface';
import { UnauthorizedSession } from '../../model/session/unauth.session';

export class ReadingPointController {
    private sessionManager: SessionManager;
    
    constructor(sessionManager: SessionManager) {
        this.sessionManager = sessionManager;
    }

    private checkAvailableRoles(session: ISession): number {
        if (session.role == 'admin') {
            return 0;
        }

        return 1;
    }

    async create(req: AuthRequest, res: Response) {
        if (this.checkAvailableRoles(req.session) > 0) {
            return res.status(401).json({ message: 'Access denied' });
        }

        try {
            const adminSession = <AdminSession> req.session;
            const result = await adminSession.createReadingPoint(req.body.typeId, req.body.address, req.body.bookIds);
            
            if (result !== 0) {
                return res.status(400).json({ message: 'Title creation failed' });
            }
            
            res.status(201).json({ message: 'Title created successfully' });
        } catch (error) {
            res.status(500).json({ 
                message: error instanceof Error ? error.message : 'Title creation error' 
            });
        }
    }

    async getAll(req: AuthRequest, res: Response) {
        try {
            const session = req.session;
            const readingPoints = await session.getAllReadingPoints();
            res.json(readingPoints);
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'Failed to fetch titles'
            });
        }
    }

    async getByType(req: AuthRequest, res: Response) {
        try {
            const session = req.session;
            const readingPoints = await session.getReadingPointsByType(Number.parseInt(req.params.typeId));
            res.json(readingPoints);
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'Failed to fetch titles'
            });
        }
    }

    async getById(req: AuthRequest, res: Response) {
        if (this.checkAvailableRoles(req.session) > 0) {
            return res.status(401).json({ message: 'Access denied' });
        }

        const session = req.session;
        const result = await session.getReadingPointById(Number.parseInt(req.params.id));
        if (result == null) {
            res.status(404).json({ message: 'Request failed' }).send();
            return;
        }
    
        res.json(result).send();
    }

    async update(req: AuthRequest, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const adminSession = <AdminSession> req.session;
            const result = await adminSession.updateReadingPoint(id, (req.body.typeId, req.body.address, req.body.bookIds));
            
            if (result !== 0) {
                return res.status(400).json({ message: 'Title update failed' });
            }
            
            res.json({ message: 'Title updated successfully' });
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'Title update error'
            });
        }
    }

    async delete(req: AuthRequest, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const adminSession = <AdminSession> req.session;
            const result = await adminSession.deleteReadingPoint(id);
            
            if (result !== 0) {
                return res.status(400).json({ message: 'Title deletion failed' });
            }
            
            res.json({ message: 'Title deleted successfully' });
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'Title deletion error'
            });
        }
    }
}

export const readingPointController: ReadingPointController = new ReadingPointController(manager);