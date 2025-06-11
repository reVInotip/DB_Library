import express from 'express';
import { authController, AuthController } from '../controller/auth/auth.controller';
import { roleController, RoleController } from '../controller/user/role.controller';
import { departmentController, DepartmentController } from '../controller/user/department.controller';
import { scientificDegreeController, ScientificDegreeController } from '../controller/user/degree.controller';
import { titleController, TitleController } from '../controller/user/title.controller';
import { facultyController, FacultyController } from '../controller/user/faculty.controller';
import { userController } from '../controller/user/user.contorller';

const router = express.Router();

router.post('/auth', authController.authenticatePassword);
router.post('/register', authController.registerUser);

router.post('/roles', authController.authenticateJWT, roleController.createRole.bind(roleController));
router.get('/roles', authController.authenticateJWT, roleController.getAllRoles.bind(roleController));
router.get('/roles/:roleName', authController.authenticateJWT, roleController.getRole.bind(roleController));
router.delete('/roles/:roleId', authController.authenticateJWT, roleController.deleteRole.bind(roleController));
router.put('/roles/:roleId', authController.authenticateJWT, roleController.updateRole.bind(roleController));

router.post('/departments', authController.authenticateJWT, departmentController.create.bind(departmentController));
router.get('/departments', authController.authenticateJWT, departmentController.getAll.bind(departmentController));
router.get('/departments/:departmentName', authController.authenticateJWT, departmentController.getByName.bind(departmentController));
router.put('/departments/:id', authController.authenticateJWT, departmentController.update.bind(departmentController));
router.delete('/departments/:id', authController.authenticateJWT, departmentController.delete.bind(departmentController));

router.post('/degree', authController.authenticateJWT, scientificDegreeController.create.bind(scientificDegreeController));
router.get('/degree', authController.authenticateJWT, scientificDegreeController.getAll.bind(scientificDegreeController));
router.get('/degree/:degreeName', authController.authenticateJWT, scientificDegreeController.getByName.bind(scientificDegreeController));
router.put('/degree/:id', authController.authenticateJWT, scientificDegreeController.update.bind(scientificDegreeController));
router.delete('/degree/:id', authController.authenticateJWT, scientificDegreeController.delete.bind(scientificDegreeController));

router.post('/title', authController.authenticateJWT, titleController.create.bind(scientificDegreeController));
router.get('/title', authController.authenticateJWT, titleController.getAll.bind(scientificDegreeController));
router.get('/title/:titleName', authController.authenticateJWT, titleController.getByName.bind(scientificDegreeController));
router.put('/title/:id', authController.authenticateJWT, titleController.update.bind(scientificDegreeController));
router.delete('/title/:id', authController.authenticateJWT, titleController.delete.bind(scientificDegreeController));

router.post('/faculty', authController.authenticateJWT, facultyController.create.bind(facultyController));
router.get('/faculty', authController.authenticateJWT, facultyController.getAll.bind(facultyController));
router.get('/faculty/:facultyName', authController.authenticateJWT, facultyController.getByName.bind(facultyController));
router.put('/faculty/:id', authController.authenticateJWT, facultyController.update.bind(facultyController));
router.delete('/faculty/:id', authController.authenticateJWT, facultyController.delete.bind(facultyController));

router.put('/debtors', authController.authenticateJWT, userController.getDebtors.bind(userController));

router.post('/', authController.authenticateJWT, userController.create.bind(userController));
router.get('/', authController.authenticateJWT, userController.getAll.bind(userController));
router.put('/', authController.authenticateJWT, userController.getBySomething.bind(userController));
router.put('/:id', authController.authenticateJWT, userController.update.bind(userController));
router.delete('/:id', authController.authenticateJWT, userController.delete.bind(userController));

export default router;