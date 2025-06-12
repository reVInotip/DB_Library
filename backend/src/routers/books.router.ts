import express from 'express';
import { authController } from '../controller/auth/auth.controller';
import { bookController } from '../controller/book/book.controller';
import { rentedBookController } from '../controller/book/rented_book.controller';
import { ordersController } from '../controller/book/orders.controller';

const router = express.Router();

router.get('/rented', authController.authenticateJWT, rentedBookController.find.bind(rentedBookController));
router.post('/rented', authController.authenticateJWT, rentedBookController.create.bind(rentedBookController));
router.delete('/rented/:userId/:bookId/:pointId', authController.authenticateJWT, rentedBookController.delete.bind(rentedBookController));
router.patch('/rented/:userId/:bookId/:pointId', authController.authenticateJWT, rentedBookController.changeStatus.bind(rentedBookController));
router.put('/rented/:userId/:bookId/:pointId', authController.authenticateJWT, rentedBookController.update.bind(rentedBookController));

router.post('/order/', authController.authenticateJWT, ordersController.create.bind(ordersController));
router.put('/order/:bookId/:userId', authController.authenticateJWT, ordersController.update.bind(ordersController));
router.delete('/order/:bookId/:userId', authController.authenticateJWT, ordersController.delete.bind(ordersController));
router.get('/order/', authController.authenticateJWT, ordersController.getAll.bind(ordersController));
router.get('/order/:bookId/:userId', authController.authenticateJWT, ordersController.getById.bind(ordersController));
router.get('/order/interLib', authController.authenticateJWT, ordersController.getInterlibraryOrders.bind(ordersController));

router.get('/popular', authController.authHook, bookController.getPopularBooks.bind(bookController));
router.get('/stats', authController.authenticateJWT, bookController.getBookStats.bind(bookController));

router.put('/', authController.authenticateJWT, bookController.find.bind(bookController));
router.get('/:id', authController.authenticateJWT, bookController.getById.bind(bookController));
router.post('/', authController.authenticateJWT, bookController.create.bind(bookController));
router.put('/:id', authController.authenticateJWT, bookController.update.bind(bookController));
router.patch('/:id/lost', authController.authenticateJWT, bookController.markAsLost.bind(bookController));
router.patch('/:id/found', authController.authenticateJWT, bookController.markAsFound.bind(bookController));
router.delete('/:id', authController.authenticateJWT, bookController.delete.bind(bookController));

export default router;