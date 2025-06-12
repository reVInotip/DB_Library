
import { Response } from 'express';
import manager, { SessionManager } from '../../model/session.manager';
import { AuthRequest } from '../auth/auth_request';
import { AdminSession } from '../../model/session/admin.session';
import { ISession } from '../../model/session/session.interface';

export class DepartmentController {
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
            const result = await adminSession.createDepartment(req.body.departmentName);
            
            if (result !== 0) {
                return res.status(400).json({ message: 'Department creation failed' });
            }
            
            res.status(201).json({ message: 'Department created successfully' });
        } catch (error) {
            res.status(500).json({ 
                message: error instanceof Error ? error.message : 'Department creation error' 
            });
        }
    }

    async getAll(req: AuthRequest, res: Response) {
        if (this.checkAvailableRoles(req.session) > 0) {
            return res.status(401).json({ message: 'Access denied' });
        }

        try {
            const adminSession = <AdminSession> req.session;
            const departments = await adminSession.getAllDepartments();
            res.json(departments);
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'Failed to fetch departments'
            });
        }
    }

    async getByName(req: AuthRequest, res: Response) {
        if (this.checkAvailableRoles(req.session) > 0) {
            return res.status(401).json({ message: 'Access denied' });
        }

        try {
            const adminSession = <AdminSession> req.session;
            const department = await adminSession.findDepartment(req.params.departmentName);
            
            if (!department) {
                return res.status(404).json({ message: 'Department not found' });
            }
            
            res.json(department);
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'Failed to fetch department'
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
            const result = await adminSession.updateDepartment(id, req.body.departmentName);
            
            if (result !== 0) {
                return res.status(400).json({ message: 'Department update failed' });
            }
            
            res.json({ message: 'Department updated successfully' });
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'Department update error'
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
            const result = await adminSession.deleteDepartment(id);
            
            if (result !== 0) {
                return res.status(400).json({ message: 'Department deletion failed' });
            }
            
            res.json({ message: 'Department deleted successfully' });
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'Department deletion error'
            });
        }
    }
}

export const departmentController: DepartmentController = new DepartmentController(manager);