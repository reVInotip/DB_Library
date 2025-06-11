import express from 'express';
import { authController } from '../controller/auth/auth.controller';
import { pointTypeController } from '../controller/point/point_type.contolroller';
import { statusController } from '../controller/book/status.controller';
import { readingPointController } from '../controller/point/reading_points.controller';

const router = express.Router();

router.post('/pointType', authController.authenticateJWT, pointTypeController.create.bind(pointTypeController));
router.get('/pointType', authController.authenticateJWT, pointTypeController.getAll.bind(pointTypeController));
router.get('/pointType/:typeName', authController.authenticateJWT, pointTypeController.getByName.bind(pointTypeController));
router.delete('/pointType/:id', authController.authenticateJWT, pointTypeController.delete.bind(pointTypeController));
router.put('/pointType/:id', authController.authenticateJWT, pointTypeController.update.bind(pointTypeController));

router.post('/status', authController.authenticateJWT, statusController.create.bind(statusController));
router.get('/status', authController.authenticateJWT, statusController.getAll.bind(statusController));
router.get('/status/:typeName', authController.authenticateJWT, statusController.getByName.bind(statusController));
router.delete('/status/:id', authController.authenticateJWT, statusController.delete.bind(statusController));
router.put('/status/:id', authController.authenticateJWT, statusController.update.bind(statusController));

router.post('/', authController.authenticateJWT, readingPointController.create.bind(readingPointController));
router.get('/', authController.authHook, readingPointController.getAll.bind(readingPointController));
router.get('/:typeId', authController.authHook, readingPointController.getById.bind(readingPointController));
router.get('/:id', authController.authHook, readingPointController.getById.bind(readingPointController));
router.put('/:id', authController.authHook, readingPointController.update.bind(readingPointController));
router.delete('/:id', authController.authenticateJWT, readingPointController.delete.bind(readingPointController));

export default router;