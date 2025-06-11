
import { Response } from 'express';
import manager, { SessionManager } from '../../model/session.manager';
import { AuthRequest } from '../auth/auth_request';
import { AdminSession } from '../../model/session/admin.session';
import { ISession } from '../../model/session/session.interface';

export class UserController {
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
            const result = await adminSession.createTitle(req.body.titleName);
            
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
            const adminSession = <AdminSession> req.session;
            const titles = await adminSession.getAllTitles();
            res.json(titles);
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'Failed to fetch titles'
            });
        }
    }

    async getByName(req: AuthRequest, res: Response) {
        try {
            const adminSession = <AdminSession> req.session;
            const title = await adminSession.findTitle(req.params.titleName);
            
            if (!title) {
                return res.status(404).json({ message: 'Title not found' });
            }
            
            res.json(title);
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'Failed to fetch title'
            });
        }
    }

    async update(req: AuthRequest, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const adminSession = <AdminSession> req.session;
            const result = await adminSession.updateTitle(id, req.body.titleName);
            
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
            const result = await adminSession.deleteTitle(id);
            
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

export const userController: UserController = new UserController(manager);