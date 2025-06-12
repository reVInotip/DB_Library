import manager, { SessionManager } from "../../model/session.manager";
import { AdminSession } from "../../model/session/admin.session";
import { AuthorizedSession } from "../../model/session/authorized.assession";
import { ISession } from "../../model/session/session.interface";
import { SuperuserSession } from "../../model/session/superuser.asession";
import { AuthRequest } from "../auth/auth_request";
import { Response } from 'express';

export class PointUserController {
    private sessionManager: SessionManager;
    
    constructor(sessionManager: SessionManager) {
        this.sessionManager = sessionManager;
    }

    private checkAccess(session: ISession): number {
        if (session.role == 'admin' || session.role == 'worker') {
            return 0;
        } else if (session.role == 'student' || session.role == 'teacher') {
            return 1;
        }

        return 2;
    }

    async create(req: AuthRequest, res: Response) {
        if (this.checkAccess(req.session) > 1) {
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
        if (this.checkAccess(req.session) > 1) {
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
        if (this.checkAccess(req.session) > 1) {
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
        if (this.checkAccess(req.session) > 1) {
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
        if (this.checkAccess(req.session) > 1) {
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
        if (this.checkAccess(req.session) > 1) {
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
        if (this.checkAccess(req.session) > 1) {
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

    async getEleminationReaders(req: AuthRequest, res: Response) {
        if (this.checkAccess(req.session) > 0) {
            return res.status(401).json({ message: 'Access denied' });
        }

        try {
            const session = <SuperuserSession> req.session;
            const result = await session.getEleminationReaders({
                period: req.body.period,
                pointId: req.body.pointId ? Number(req.body.pointId) : undefined,
                facultyId: req.body.facultyId ? Number(req.body.facultyId) : undefined,
                departmentId: req.body.departmentId ? Number(req.body.departmentId) : undefined,
                course: req.body.course ? Number(req.body.course) : undefined,
                groupNumber: req.body.groupNumber ? Number(req.body.groupNumber) : undefined,
                roleId: req.body.roleId ? Number(req.body.roleId) : undefined,
                action: req.body.action
            });

            if (result == null) {
                return res.status(400).json({ message: 'Get failed' });
            }
            
            res.json(result);
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'get error'
            });
        }
    }
}

export const pointUserController = new PointUserController(manager);