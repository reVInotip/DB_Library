import { Response } from 'express';
import manager, { SessionManager } from '../../model/session.manager';
import { AuthRequest } from '../auth/auth_request';
import { AdminSession } from '../../model/session/admin.session';
import { ISession } from '../../model/session/session.interface';

export class FacultyController {
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

    // CREATE
    async create(req: AuthRequest, res: Response) {
        if (this.checkAvailableRoles(req.session) > 0) {
            return res.status(401).json({ message: 'Access denied' });
        }

        try {
            const { facultyName } = req.body;
            const adminSession = <AdminSession> req.session;
            const result = await adminSession.createFaculty(facultyName);
            
            if (result !== 0) {
                return res.status(400).json({ message: 'Faculty creation failed' });
            }
            
            res.status(201).json({ message: 'Faculty created successfully' });
        } catch (error) {
            res.status(500).json({ 
                message: error instanceof Error ? error.message : 'Faculty creation error' 
            });
        }
    }

    // READ ALL
    async getAll(req: AuthRequest, res: Response) {
        if (this.checkAvailableRoles(req.session) > 0) {
            return res.status(401).json({ message: 'Access denied' });
        }

        try {
            const adminSession = <AdminSession> req.session;
            const faculties = await adminSession.getAllFaculties();
            res.json(faculties);
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'Failed to fetch faculties'
            });
        }
    }

    // READ BY NAME (вместо поиска по ID)
    async getByName(req: AuthRequest, res: Response) {
        if (this.checkAvailableRoles(req.session) > 0) {
            return res.status(401).json({ message: 'Access denied' });
        }

        try {
            const name = req.params.facultyName;
            const adminSession = <AdminSession> req.session;
            const faculty = await adminSession.getFacultyByName(name);
            
            if (!faculty) {
                return res.status(404).json({ message: 'Faculty not found' });
            }
            
            res.json(faculty);
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'Failed to fetch faculty'
            });
        }
    }

    async update(req: AuthRequest, res: Response) {
        if (this.checkAvailableRoles(req.session) > 0) {
            return res.status(401).json({ message: 'Access denied' });
        }

        try {
            const id = parseInt(req.params.id);
            const adminSession = <AdminSession> req.session;
            const result = await adminSession.updateFaculty(id, req.body.facultyName);
            
            if (result !== 0) {
                return res.status(400).json({ message: 'Faculty update failed' });
            }
            
            res.json({ message: 'Faculty updated successfully' });
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'Faculty update error'
            });
        }
    }

    async delete(req: AuthRequest, res: Response) {
        if (this.checkAvailableRoles(req.session) > 0) {
            return res.status(401).json({ message: 'Access denied' });
        }
        
        try {
            const id = parseInt(req.params.id);
            const adminSession = <AdminSession> req.session;
            const result = await adminSession.deleteFaculty(id);
            
            if (result !== 0) {
                return res.status(400).json({ message: 'Faculty deletion failed' });
            }
            
            res.json({ message: 'Faculty deleted successfully' });
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'Faculty deletion error'
            });
        }
    }
}

export const facultyController: FacultyController = new FacultyController(manager);