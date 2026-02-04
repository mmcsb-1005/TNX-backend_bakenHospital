import { Router } from 'express';
import { DesignationController } from './Designation.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { csvImportMiddleware } from '../../middleware/csvImport.middleware';

const router = Router();
const designationController = new DesignationController();

// All routes require authentication and admin role
router.use(authMiddleware);

router.get('/', designationController.getDesignations);
router.get('/export', designationController.exportDesignations);
router.get('/template/download', designationController.downloadTemplate);
router.post('/import', csvImportMiddleware, designationController.importDesignations);
router.get('/:id', designationController.getDesignationById);
router.post('/', designationController.createDesignation);
router.put('/:id', designationController.updateDesignation);
router.delete('/:id', designationController.deleteDesignation);

export default router;