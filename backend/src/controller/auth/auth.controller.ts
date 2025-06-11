import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from "./auth_request";
import manager, { SessionManager } from '../../model/session.manager';

export class AuthController {
    private sessionManager: SessionManager;

    constructor(sessionManager: SessionManager) {
        this.sessionManager = sessionManager;

        this.authenticateJWT = this.authenticateJWT.bind(this);
        this.registerUser = this.registerUser.bind(this);
        this.authenticatePassword = this.authenticatePassword.bind(this);
    }
    
    async authenticateJWT(req: AuthRequest, res: Response, next: NextFunction) {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ message: 'No token provided' }).send();
            return;
        }

        const token = authHeader.split(' ')[1];

        try {
            const session = this.sessionManager.getSession(token);

            if (!session) {
                res.status(401).json({ message: 'Invalid session' }).send();
                return;
            }

            req.session = session;
            next();
        } catch (err) {
            res.status(403).json({ message: 'Token invalid or expired' }).send();
        }
    }

    async authenticatePassword(req: Request, res: Response) {
        const result: [number, string] = await this.sessionManager.createSession(req.body.email, req.body.password, req.body.role);
        if (result[0] == 1) {
            res.status(403).json({ message: 'Authentication failed' }).send();
            return;
        } else if (result[0] == 2) {
            res.status(500).json({ message: 'Internal server error' }).send();
            return;
        }

        res.json( { message: result[1] } ).send();
    }

    async registerUser(req: Request, res: Response) {
        if (!req.body) {
            res.status(403).json({ message: 'Empty body' }).send();
            return;
        }

        const result: [number, string] = await this.sessionManager.registerNewUser(req.body);
        if (result[0] == 1) {
            res.status(401).json({ message: 'Authentication failed' }).send();
            return;
        } else if (result[0] == 2) {
            res.status(500).json({ message: 'Internal server error' }).send();
            return;
        }

        res.json( { message: result[1] } );
    }
}

export const authController: AuthController = new AuthController(manager);