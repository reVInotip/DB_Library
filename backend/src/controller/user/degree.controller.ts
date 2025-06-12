
import { Response } from 'express';
import manager, { SessionManager } from '../../model/session.manager';
import { AuthRequest } from '../auth/auth_request';
import { AdminSession } from '../../model/session/admin.session';
import { ISession } from '../../model/session/session.interface';

export class ScientificDegreeController {
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
            const adminSession = <AdminSession> req.session;
            const result = await adminSession.createScientificDegree(req.body.degreeName);
            
            if (result !== 0) {
                return res.status(400).json({ message: 'Scientific degree creation failed' });
            }
            
            res.status(201).json({ message: 'Scientific degree created successfully' });
        } catch (error) {
            res.status(500).json({ 
                message: error instanceof Error ? error.message : 'Scientific degree creation error' 
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
            const degrees = await adminSession.getAllScientificDegrees();
            res.json(degrees);
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'Failed to fetch scientific degrees'
            });
        }
    }

    // READ ONE
    async getByName(req: AuthRequest, res: Response) {
        if (this.checkAvailableRoles(req.session) > 0) {
            return res.status(401).json({ message: 'Access denied' });
        }

        try {
            const adminSession = <AdminSession> req.session;
            const degree = await adminSession.getScientificDegreeByName(req.params.degreeName);
            
            if (!degree) {
                return res.status(404).json({ message: 'Scientific degree not found' });
            }
            
            res.json(degree);
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'Failed to fetch scientific degree'
            });
        }
    }

    // UPDATE
    async update(req: AuthRequest, res: Response) {
        if (this.checkAvailableRoles(req.session) > 0) {
            return res.status(401).json({ message: 'Access denied' });
        }

        try {
            const id = Number(req.params.id);
            const adminSession = <AdminSession> req.session;
            const result = await adminSession.updateScientificDegree(id, req.body.degreeName);
            
            if (result !== 0) {
                return res.status(400).json({ message: 'Scientific degree update failed' });
            }
            
            res.json({ message: 'Scientific degree updated successfully' });
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'Scientific degree update error'
            });
        }
    }

    // DELETE
    async delete(req: AuthRequest, res: Response) {
        if (this.checkAvailableRoles(req.session) > 0) {
            return res.status(401).json({ message: 'Access denied' });
        }
        
        try {
            const id = Number(req.params.id);
            const adminSession = <AdminSession> req.session;
            const result = await adminSession.deleteScientificDegree(id);
            
            if (result !== 0) {
                return res.status(400).json({ message: 'Scientific degree deletion failed' });
            }
            
            res.json({ message: 'Scientific degree deleted successfully' });
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'Scientific degree deletion error'
            });
        }
    }
}

export const scientificDegreeController: ScientificDegreeController = new ScientificDegreeController(manager);