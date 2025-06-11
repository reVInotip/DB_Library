import manager, { SessionManager } from "../../model/session.manager";
import { AdminSession } from "../../model/session/admin.session";
import { AuthorizedSession } from "../../model/session/authorized.assession";
import { ISession } from "../../model/session/session.interface";
import { AuthRequest } from "../auth/auth_request";
import { Response } from 'express';

export class PointUserController {
    private sessionManager: SessionManager;
    
    constructor(sessionManager: SessionManager) {
        this.sessionManager = sessionManager;
    }

    private checkAccess(session: ISession): number {
        return session.role != 'unauth' ? 0 : 1;
    }

    async create(req: AuthRequest, res: Response) {
        if (this.checkAccess(req.session) > 0) {
            return res.status(403).json({ message: 'Forbidden: Admin access required' });
        }

        try {
            const adminSession = <AuthorizedSession> req.session;
            const result = await adminSession.createPointUser({
                userId: Number(req.body.userId),
                pointId: Number(req.body.pointId),
                registerDate: new Date(req.body.registerDate),
                eleminationDate: req.body.eleminationDate ? new Date(req.body.eleminationDate) : undefined
            });
            
            if (result !== 0) {
                return res.status(400).json({ message: 'PointUser creation failed' });
            }
            
            res.status(201).json({ message: 'PointUser created successfully' });
        } catch (error) {
            res.status(500).json({ 
                message: error instanceof Error ? error.message : 'PointUser creation error' 
            });
        }
    }

    async getById(req: AuthRequest, res: Response) {
        if (this.checkAccess(req.session) > 0) {
            return res.status(403).json({ message: 'Forbidden: Admin access required' });
        }

        try {
            const session = <AuthorizedSession> req.session;
            const pointUser = await session.findPointUser(
                Number(req.params.userId),
                Number(req.params.pointId)
            );
            
            if (!pointUser) {
                return res.status(404).json({ message: 'PointUser not found' });
            }
            
            res.json(pointUser);
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'Failed to fetch PointUser'
            });
        }
    }

    async find(req: AuthRequest, res: Response) {
        if (this.checkAccess(req.session) > 0) {
            return res.status(403).json({ message: 'Forbidden: Admin access required' });
        }

        try {
            const session = <AuthorizedSession> req.session;
            const pointUsers = await session.findPointUsers({
                userId: req.query.userId ? Number(req.query.userId) : undefined,
                pointId: req.query.pointId ? Number(req.query.pointId) : undefined,
                minRegisterDate: req.query.minRegisterDate ? new Date(req.query.minRegisterDate as string) : undefined,
                maxRegisterDate: req.query.maxRegisterDate ? new Date(req.query.maxRegisterDate as string) : undefined,
                isActive: req.query.isActive ? req.query.isActive === 'true' : undefined
            });
            
            res.json(pointUsers);
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'Failed to fetch PointUsers'
            });
        }
    }

    async update(req: AuthRequest, res: Response) {
        if (this.checkAccess(req.session) > 0) {
            return res.status(403).json({ message: 'Forbidden: Admin access required' });
        }

        try {
            const adminSession = <AuthorizedSession> req.session;
            const result = await adminSession.updatePointUser(
                Number(req.params.userId),
                Number(req.params.pointId),
                {
                    registerDate: req.body.registerDate ? new Date(req.body.registerDate) : undefined,
                    eleminationDate: req.body.eleminationDate === null ? null : 
                                     req.body.eleminationDate ? new Date(req.body.eleminationDate) : undefined
                }
            );
            
            if (result !== 0) {
                return res.status(400).json({ message: 'PointUser update failed' });
            }
            
            res.json({ message: 'PointUser updated successfully' });
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'PointUser update error'
            });
        }
    }

    async deactivate(req: AuthRequest, res: Response) {
        if (this.checkAccess(req.session) > 0) {
            return res.status(403).json({ message: 'Forbidden: Admin access required' });
        }

        try {
            const adminSession = <AuthorizedSession> req.session;
            const result = await adminSession.deactivatePointUser(
                Number(req.params.userId),
                Number(req.params.pointId)
            );
            
            if (result !== 0) {
                return res.status(400).json({ message: 'PointUser deactivation failed' });
            }
            
            res.json({ message: 'PointUser deactivated successfully' });
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'PointUser deactivation error'
            });
        }
    }

    async activate(req: AuthRequest, res: Response) {
        if (this.checkAccess(req.session) > 0) {
            return res.status(403).json({ message: 'Forbidden: Admin access required' });
        }

        try {
            const adminSession = <AuthorizedSession> req.session;
            const result = await adminSession.activatePointUser(
                Number(req.params.userId),
                Number(req.params.pointId)
            );
            
            if (result !== 0) {
                return res.status(400).json({ message: 'PointUser activation failed' });
            }
            
            res.json({ message: 'PointUser activated successfully' });
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'PointUser activation error'
            });
        }
    }

    async delete(req: AuthRequest, res: Response) {
        if (this.checkAccess(req.session) > 0) {
            return res.status(403).json({ message: 'Forbidden: Admin access required' });
        }

        try {
            const adminSession = <AuthorizedSession> req.session;
            const result = await adminSession.deletePointUser(
                Number(req.params.userId),
                Number(req.params.pointId)
            );
            
            if (result !== 0) {
                return res.status(400).json({ message: 'PointUser deletion failed' });
            }
            
            res.json({ message: 'PointUser deleted successfully' });
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'PointUser deletion error'
            });
        }
    }
}

export const pointUserController = new PointUserController(manager);