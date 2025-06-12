import manager, { SessionManager } from "../../model/session.manager";
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from "../auth/auth_request";
import { AdminSession } from "../../model/session/admin.session";
import { ISession } from "../../model/session/session.interface";

export class RoleController {
    sessionManager: SessionManager;
    
    constructor(sessionManager: SessionManager) {
        this.sessionManager = sessionManager;
    }

    private checkAvailableRoles(session: ISession): number {
        if (session.role == 'admin') {
            return 0;
        }

        return 1;
    } 
    
    async createRole(req: AuthRequest, res: Response) {
        if (this.checkAvailableRoles(req.session) > 0) {
            return res.status(401).json({ message: 'Access denied' });
        }

        const adminSession = <AdminSession> req.session;
        const result = await adminSession.createRole(req.body.roleName);
        if (result == 1) {
            res.status(401).json({ message: 'Request failed' }).send();
            return;
        }
    
        res.json("OK").send();
    }
    
    async getRole(req: AuthRequest, res: Response) {
        if (this.checkAvailableRoles(req.session) > 0) {
            return res.status(401).json({ message: 'Access denied' });
        }

        const adminSession = <AdminSession> req.session;
        const result = await adminSession.findRole(req.params.roleName);
        if (result == null) {
            res.status(404).json({ message: 'Request failed' }).send();
            return;
        }
    
        res.json(result).send();
    }
    
    async getAllRoles(req: AuthRequest, res: Response) {
        if (this.checkAvailableRoles(req.session) > 0) {
            return res.status(401).json({ message: 'Access denied' });
        }

        const adminSession = <AdminSession> req.session;
        const result = await adminSession.getAllRoles();
        if (result == null) {
            res.status(401).json({ message: 'Request failed' }).send();
            return;
        }
    
        res.json(result).send();
    }
    
    async deleteRole(req: AuthRequest, res: Response) {
        if (this.checkAvailableRoles(req.session) > 0) {
            return res.status(401).json({ message: 'Access denied' });
        }

        const adminSession = <AdminSession> req.session;
        const result = await adminSession.deleteRole(Number(req.params.roleId));
        if (result == 1) {
            res.status(401).json({ message: 'Request failed' }).send();
            return;
        }
    
        res.json("OK").send();
    }
    
    async updateRole(req: AuthRequest, res: Response) {
        if (this.checkAvailableRoles(req.session) > 0) {
            return res.status(401).json({ message: 'Access denied' });
        }
        
        const adminSession = <AdminSession> req.session;
        const result = await adminSession.updateRole(Number(req.params.roleId), req.body.roleName);
        if (result == 1) {
            res.status(401).json({ message: 'Request failed' }).send();
            return;
        }
    
        res.json("OK").send();
    }
}

export const roleController: RoleController = new RoleController(manager);