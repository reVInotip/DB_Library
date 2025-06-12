import express from 'express';
import { authController } from '../controller/auth/auth.controller';
import { pointTypeController } from '../controller/point/point_type.contolroller';
import { statusController } from '../controller/book/status.controller';
import { readingPointController } from '../controller/point/reading_points.controller';
import { pointUserController } from '../controller/point/point_user.controller';

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

router.put('/pointUsers', authController.authenticateJWT, pointUserController.find.bind(pointUserController));
router.get('/pointUsers/:userId/:pointId', authController.authenticateJWT, pointUserController.getById.bind(pointUserController));
router.post('/pointUsers', authController.authenticateJWT, pointUserController.create.bind(pointUserController));
router.put('/pointUsers/:userId/:pointId', authController.authenticateJWT, pointUserController.update.bind(pointUserController));
router.patch('/pointUsers/:userId/:pointId/deactivate', authController.authenticateJWT, pointUserController.deactivate.bind(pointUserController));
router.patch('/pointUsers/:userId/:pointId/activate', authController.authenticateJWT, pointUserController.activate.bind(pointUserController));
router.delete('/pointUsers/:userId/:pointId', authController.authenticateJWT, pointUserController.delete.bind(pointUserController));

router.get('/stats', authController.authenticateJWT, readingPointController.getReadingPointsStats.bind(readingPointController));
router.post('/', authController.authenticateJWT, readingPointController.create.bind(readingPointController));
router.get('/', authController.authHook, readingPointController.getAll.bind(readingPointController));
router.get('/byType/:typeId', authController.authHook, readingPointController.getByType.bind(readingPointController));
router.get('/:id', authController.authHook, readingPointController.getById.bind(readingPointController));
router.put('/:id', authController.authHook, readingPointController.update.bind(readingPointController));
router.put('/readers/:id', authController.authenticateJWT, readingPointController.getReadersByReadingPoint.bind(readingPointController));
router.delete('/:id', authController.authenticateJWT, readingPointController.delete.bind(readingPointController));

export default router;