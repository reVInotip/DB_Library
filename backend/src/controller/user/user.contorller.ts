
import { Response } from 'express';
import manager, { SessionManager } from '../../model/session.manager';
import { AuthRequest } from '../auth/auth_request';
import { AdminSession } from '../../model/session/admin.session';
import { ISession } from '../../model/session/session.interface';
import { SuperuserSession } from '../../model/session/superuser.asession';

export class UserController {
    private sessionManager: SessionManager;
    
    constructor(sessionManager: SessionManager) {
        this.sessionManager = sessionManager;
    }

    private checkAvailableRoles(session: ISession): number {
        if (session.role == 'admin') {
            return 0;
        } else if (session.role == 'worker') {
            return 1;
        }

        return 2;
    }

    async create(req: AuthRequest, res: Response) {
        if (this.checkAvailableRoles(req.session) > 0) {
            return res.status(401).json({ message: 'Access denied' });
        }

        try {
            const adminSession = <AdminSession> req.session;
            const result = await adminSession.createUser(req.body);
            
            if (result !== 0) {
                return res.status(400).json({ message: 'User creation failed' });
            }
            
            res.status(201).json({ message: 'User created successfully' });
        } catch (error) {
            res.status(500).json({ 
                message: error instanceof Error ? error.message : 'User creation error' 
            });
        }
    }

    async getAll(req: AuthRequest, res: Response) {
        if (this.checkAvailableRoles(req.session) > 1) {
            return res.status(401).json({ message: 'Access denied' });
        }

        try {
            const adminSession = <AdminSession> req.session;
            const users = await adminSession.getAllUsers();
            res.json(users);
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'Failed to fetch users'
            });
        }
    }

    async getBySomething(req: AuthRequest, res: Response) {
        if (this.checkAvailableRoles(req.session) > 1) {
            return res.status(401).json({ message: 'Access denied' });
        }

        try {
            const adminSession = <AdminSession> req.session;
            const user = await adminSession.findUser(req.body);
            
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            
            res.json(user);
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'Failed to fetch user'
            });
        }
    }

    async update(req: AuthRequest, res: Response) {
        if (this.checkAvailableRoles(req.session) > 0) {
            return res.status(401).json({ message: 'Access denied' });
        }

        try {
            const id = Number(req.params.id);
            const adminSession = <AdminSession> req.session;
            const result = await adminSession.updateUser(id, req.body);
            
            if (result !== 0) {
                return res.status(400).json({ message: 'User update failed' });
            }
            
            res.json({ message: 'User updated successfully' });
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'User update error'
            });
        }
    }

    async delete(req: AuthRequest, res: Response) {
        if (this.checkAvailableRoles(req.session) > 0) {
            return res.status(401).json({ message: 'Access denied' });
        }

        try {
            const id = Number(req.params.id);
            const adminSession = <AdminSession> req.session;
            const result = await adminSession.deleteUser(id);
            
            if (result !== 0) {
                return res.status(400).json({ message: 'User deletion failed' });
            }
            
            res.json({ message: 'User deleted successfully' });
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'User deletion error'
            });
        }
    }

    async getDebtors(req: AuthRequest, res: Response) {
        if (this.checkAvailableRoles(req.session) > 1) {
            return res.status(401).json({ message: 'Access denied' });
        }

        try {
            const session = <SuperuserSession> req.session;
            const result = await session.getDebtors(req.body);

            if (result == null) {
                return res.status(400).json({ message: 'Get debtors failed' });
            }
            
            res.json(result);
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'get debtors error'
            });
        }
    }

    async banUser(req: AuthRequest, res: Response) {
        if (this.checkAvailableRoles(req.session) > 1) {
            return res.status(401).json({ message: 'Access denied' });
        }

        try {
            const session = <SuperuserSession> req.session;
            const result = await session.banUser(
                req.params.id ? Number(req.params.id) : undefined
            );

            if (result == null) {
                return res.status(400).json({ message: 'Ban failed' });
            }
            
            res.json(result);
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'ban error'
            });
        }
    }

    async setUserBannedDate(req: AuthRequest, res: Response) {
        if (this.checkAvailableRoles(req.session) > 1) {
            return res.status(401).json({ message: 'Access denied' });
        }

        try {
            const session = <SuperuserSession> req.session;
            const result = await session.setUserBannedDate(
                req.params.id ? Number(req.params.id) : undefined,
                req.body.date ? new Date(req.body.date) : undefined
            );

            if (result == null) {
                return res.status(400).json({ message: 'Ban failed' });
            }
            
            res.json(result);
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'ban error'
            });
        }
    }

    async unbanUser(req: AuthRequest, res: Response) {
        if (this.checkAvailableRoles(req.session) > 1) {
            return res.status(401).json({ message: 'Access denied' });
        }

        try {
            const session = <SuperuserSession> req.session;
            const result = await session.unbanUser(
                req.params.id ? Number(req.params.id) : undefined
            );

            if (result == null) {
                return res.status(400).json({ message: 'Unban failed' });
            }
            
            res.json(result);
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'unban error'
            });
        }
    }

    async getBannedUsersStats(req: AuthRequest, res: Response) {
        if (this.checkAvailableRoles(req.session) > 1) {
            return res.status(401).json({ message: 'Access denied' });
        }

        try {
            const session = <SuperuserSession> req.session;
            const result = await session.getBannedUsersStatisticsDetailed({
                facultyId: req.body.facultyId ? Number(req.body.facultyId) : undefined,
                departmentId: req.body.departmentId ? Number(req.body.departmentId) : undefined,
                course: req.body.course ? Number(req.body.course) : undefined,
                groupNumber: req.body.groupNumber ? Number(req.body.groupNumber) : undefined,
                roleId: req.body.roleId ? Number(req.body.roleId) : undefined
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

export const userController: UserController = new UserController(manager);