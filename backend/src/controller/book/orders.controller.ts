import { Response } from 'express';
import manager, { SessionManager } from '../../model/session.manager';
import { AuthRequest } from '../auth/auth_request';
import { BaseSession, ISession } from '../../model/session/session.interface';
import { SuperuserSession } from '../../model/session/superuser.asession';
import { AuthorizedSession } from '../../model/session/authorized.assession';

export class OrdersController {
    private sessionManager: SessionManager;
    
    constructor(sessionManager: SessionManager) {
        this.sessionManager = sessionManager;
    }

    private checkAvailableRoles(session: ISession): number {
        if (session.role === 'admin' || session.role === 'worker') {
            return 0;
        } else if (session.role === 'student' || session.role === 'teacher') {
            return 1;
        }

        return 2;
    }

    async create(req: AuthRequest, res: Response) {
        if (this.checkAvailableRoles(req.session) > 0) {
            return res.status(403).json({ message: 'Forbidden: Admin or worker access required' });
        }

        try {
            const adminSession = <AuthorizedSession> req.session;
            const result = await adminSession.createOrder({
                bookId: Number(req.body.bookId),
                userId: Number(req.body.userId),
                phoneNumber: req.body.phoneNumber,
                orderDate: req.body.orderDate ? new Date(req.body.orderDate) : undefined
            });

            if (result !== 0) {
                return res.status(400).json({ message: 'Order creation failed' });
            }
            
            res.status(201).json({ message: 'Order created successfully' });
        } catch (error) {
            res.status(500).json({ 
                message: error instanceof Error ? error.message : 'Order creation error' 
            });
        }
    }

    async getById(req: AuthRequest, res: Response) {
        if (this.checkAvailableRoles(req.session) > 0) {
            return res.status(403).json({ message: 'Forbidden: Authorized access required' });
        }

        try {
            const session = <AuthorizedSession> req.session;
            const order = await session.getOrder(Number(req.params.bookId), Number(req.params.userId));
            
            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }
            
            res.json(order);
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'Failed to fetch order'
            });
        }
    }

    async getAll(req: AuthRequest, res: Response) {
        if (this.checkAvailableRoles(req.session) > 0) {
            return res.status(403).json({ message: 'Forbidden: Authorized access required' });
        }

        try {
            const session = <AuthorizedSession> req.session;
            const orders = await session.getAllOrders();
            
            res.json(orders);
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'Failed to fetch orders'
            });
        }
    }

    async update(req: AuthRequest, res: Response) {
        if (this.checkAvailableRoles(req.session) > 0) {
            return res.status(403).json({ message: 'Forbidden: Admin or worker access required' });
        }

        try {
            const adminSession = <AuthorizedSession> req.session;
            const result = await adminSession.updateOrder(Number(req.params.bookId), Number(req.params.userId), {
                phoneNumber: req.body.phoneNumber,
                orderDate: req.body.orderDate ? new Date(req.body.orderDate) : undefined
            });

            if (result !== 0) {
                return res.status(400).json({ message: 'Order update failed' });
            }
            
            res.json({ message: 'Order updated successfully' });
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'Order update error'
            });
        }
    }

    async delete(req: AuthRequest, res: Response) {
        if (this.checkAvailableRoles(req.session) > 0) {
            return res.status(403).json({ message: 'Forbidden: Admin or worker access required' });
        }

        try {
            const adminSession = <AuthorizedSession> req.session;
            const result = await adminSession.deleteOrder(Number(req.params.bookId), Number(req.params.userId));
            
            if (result !== 0) {
                return res.status(400).json({ message: 'Order deletion failed' });
            }
            
            res.json({ message: 'Order deleted successfully' });
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'Order deletion error'
            });
        }
    }

    async getInterlibraryOrders(req: AuthRequest, res: Response) {
        if (this.checkAvailableRoles(req.session) > 1) {
            return res.status(403).json({ message: 'Forbidden: Admin or worker access required' });
        }

        try {
            const adminSession = <SuperuserSession> req.session;
            const result = await adminSession.getInterlibraryOrders({
                period: req.body.period ? req.body.period : undefined,
                bookTitle: req.body.title ? req.body.title : undefined,
                author: req.body.author ? req.body.author : undefined,
                minCost: req.body.minCost ? Number(req.body.minCost) : undefined,
                maxCost: req.body.maxCost ? Number(req.body.maxCost) : undefined
            });
            
            if (result == null) {
                return res.status(400).json({ message: 'Get failed' });
            }
            
            res.json(result);
        } catch (error) {
            res.status(500).json({
                message: error instanceof Error ? error.message : 'Get error'
            });
        }
    }
}

export const ordersController = new OrdersController(manager);