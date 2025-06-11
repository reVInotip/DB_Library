import express from 'express';
import { authController } from '../controller/auth/auth.controller';
import { bookController } from '../controller/book/book.controller';

const router = express.Router();

router.get('/', authController.authenticateJWT, bookController.find.bind(bookController));
router.get('/:id', authController.authenticateJWT, bookController.getById.bind(bookController));
router.post('/', authController.authenticateJWT, bookController.create.bind(bookController));
router.put('/:id', authController.authenticateJWT, bookController.update.bind(bookController));
router.patch('/:id/lost', authController.authenticateJWT, bookController.markAsLost.bind(bookController));
router.patch('/:id/found', authController.authenticateJWT, bookController.markAsFound.bind(bookController));
router.delete('/:id', authController.authenticateJWT, bookController.delete.bind(bookController));