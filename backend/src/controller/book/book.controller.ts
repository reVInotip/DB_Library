import { Response } from 'express';
import manager, { SessionManager } from '../../model/session.manager';
import { AuthRequest } from '../auth/auth_request';
import { BaseSession, ISession } from '../../model/session/session.interface';
import { SuperuserSession } from '../../model/session/superuser.asession';
import { AuthorizedSession } from '../../model/session/authorized.assession';

export class BookController {
    private sessionManager: SessionManager;
    
    constructor(sessionManager: SessionManager) {
        this.sessionManager = sessionManager;
    }

    private checkAvailableRoles(session: ISession): number {
        if (session.role == 'admin' || session.role == 'worker') {
            return 0;
        } else if (session.role == 'student' || session.role == 'teacher') {
            return 1;
        }

        return 1;
    }

    async create(req: AuthRequest, res: Response) {
        if (this.checkAvailableRoles(req.session) > 0) {
            return res.status(403).json({ message: 'Forbidden: Admin access required' });
        }

        try {
            const adminSession = <SuperuserSession> req.session;
            const result = await adminSession.createBook({
                title: req.body.title,
                author: req.body.author,
                releaseDate: new Date(req.body.releaseDate),
                admissionDate: new Date(req.body.admissionDate),
                cost: req.body.cost,
                fromAnotherLib: req.body.fromAnotherLib,
                lostDate: req.body.lostDate ? new Date(req.body.lostDate) : undefined
            });

            if (result !== 0) {
                return res.status(400).json({ message: 'Book creation failed' });
            }
            
            res.status(201).json({ message: 'Book created successfully' });
        } catch (error) {
            res.status(500).json({ 
                message: error instanceof Error ? error.message : 'Book creation error' 
            });
        }
    }

    async find(req: AuthRequest, res: Response) {
        if (this.checkAvailableRoles(req.session) > 1) {
            return res.status(403).json({ message: 'Forbidden: Admin access required' });
        }

        try {
            const session = <AuthorizedSession> req.session;
            const books = await session.findBooks({
                title: req.query.title as string,
                author: req.query.author as string,
                minReleaseDate: req.query.minReleaseDate ? new Date(req.query.minReleaseDate as string) : undefined,
                maxReleaseDate: req.query.maxReleaseDate ? new Date(req.query.maxReleaseDate as string) : undefined,
                minAdmissionDate: req.query.minAdmissionDate ? new Date(req.query.minAdmissionDate as string) : undefined,
                maxAdmissionDate: req.query.maxAdmissionDate ? new Date(req.query.maxAdmissionDate as string) : undefined,
                minCost: req.query.minCost ? Number(req.query.minCost) : undefined,
                maxCost: req.query.maxCost ? Number(req.query.maxCost) : undefined,
                fromAnotherLib: req.query.fromAnotherLib ? req.query.fromAnotherLib === 'true' : undefined,
                isLost: req.query.isLost ? req.query.isLost === 'true' : undefined
            });
            
            res.json(books);
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'Failed to fetch books'
            });
        }
    }

    async getById(req: AuthRequest, res: Response) {
        if (this.checkAvailableRoles(req.session) > 1) {
            return res.status(403).json({ message: 'Forbidden: Admin access required' });
        }

        try {
            const session = <AuthorizedSession> req.session;
            const book = await session.getBookById(Number(req.params.id));
            
            if (!book) {
                return res.status(404).json({ message: 'Book not found' });
            }
            
            res.json(book);
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'Failed to fetch book'
            });
        }
    }

    async update(req: AuthRequest, res: Response) {
        if (this.checkAvailableRoles(req.session) > 0) {
            return res.status(403).json({ message: 'Forbidden: Admin access required' });
        }

        try {
            const adminSession = <SuperuserSession> req.session;
            const result = await adminSession.updateBook(Number(req.params.id), {
                title: req.body.title,
                author: req.body.author,
                releaseDate: req.body.releaseDate ? new Date(req.body.releaseDate) : undefined,
                admissionDate: req.body.admissionDate ? new Date(req.body.admissionDate) : undefined,
                cost: req.body.cost,
                fromAnotherLib: req.body.fromAnotherLib,
                lostDate: req.body.lostDate === null ? null : req.body.lostDate ? new Date(req.body.lostDate) : undefined
            });

            if (result !== 0) {
                return res.status(400).json({ message: 'Book update failed' });
            }
            
            res.json({ message: 'Book updated successfully' });
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'Book update error'
            });
        }
    }

    async markAsLost(req: AuthRequest, res: Response) {
        if (this.checkAvailableRoles(req.session) > 0) {
            return res.status(403).json({ message: 'Forbidden: Admin access required' });
        }

        try {
            const adminSession = <SuperuserSession> req.session;
            const result = await adminSession.markBookAsLost(Number(req.params.id));
            
            if (result !== 0) {
                return res.status(400).json({ message: 'Failed to mark book as lost' });
            }
            
            res.json({ message: 'Book marked as lost successfully' });
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'Failed to mark book as lost'
            });
        }
    }

    async markAsFound(req: AuthRequest, res: Response) {
        if (this.checkAvailableRoles(req.session) > 0) {
            return res.status(403).json({ message: 'Forbidden: Admin access required' });
        }

        try {
            const adminSession = <SuperuserSession> req.session;
            const result = await adminSession.markBookAsFound(Number(req.params.id));
            
            if (result !== 0) {
                return res.status(400).json({ message: 'Failed to mark book as found' });
            }
            
            res.json({ message: 'Book marked as found successfully' });
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'Failed to mark book as found'
            });
        }
    }

    async delete(req: AuthRequest, res: Response) {
        if (this.checkAvailableRoles(req.session) > 0) {
            return res.status(403).json({ message: 'Forbidden: Admin access required' });
        }

        try {
            const adminSession = <SuperuserSession> req.session;
            const result = await adminSession.deleteBook(Number(req.params.id));
            
            if (result !== 0) {
                return res.status(400).json({ message: 'Book deletion failed' });
            }
            
            res.json({ message: 'Book deleted successfully' });
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'Book deletion error'
            });
        }
    }


    async getPopularBooks(req: AuthRequest, res: Response) {
        try {
            const session = <BaseSession> req.session;
            const result = await session.getPopularBooks(req.body);
            
            if (result == null) {
                return res.status(400).json({ message: 'Get popular books failed' });
            }
            
            res.json(result);
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'Get popular books error'
            });
        }
    }
}

export const bookController = new BookController(manager);