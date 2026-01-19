import { Router } from 'express';
import { DesignationController } from './Designation.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();
const designationController = new DesignationController();

// All routes require authentication and admin role
router.use(authMiddleware);

router.get('/', designationController.getDesignations);
router.get('/:id', designationController.getDesignationById);
router.post('/', designationController.createDesignation);
router.put('/:id', designationController.updateDesignation);
router.delete('/:id', designationController.deleteDesignation);

export default router;