import { Router } from 'express';
import { DepartmentController } from './Department.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { csvImportMiddleware } from '../../middleware/csvImport.middleware';

const router = Router();
const departmentController = new DepartmentController();

router.use(authMiddleware);

router.get('/', departmentController.getDepartments);
router.get('/template/download', departmentController.downloadTemplate);
router.post('/import', csvImportMiddleware, departmentController.importDepartments);
router.get('/:id', departmentController.getDepartmentById);
router.post('/', departmentController.createDepartment);
router.put('/:id', departmentController.updateDepartment);
router.delete('/:id', departmentController.deleteDepartment);

export default router;
