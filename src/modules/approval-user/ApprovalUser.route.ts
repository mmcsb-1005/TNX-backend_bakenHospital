import { Router } from 'express';
import { ApprovalUserController } from './ApprovalUser.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();
const approvalUserController = new ApprovalUserController();

// All routes require authentication and admin role
router.use(authMiddleware);

router.get('/', approvalUserController.getApprovalUsers);
router.get('/:id', approvalUserController.getApprovalUserById);
router.post('/', approvalUserController.createApprovalUser);
router.put('/:id', approvalUserController.updateApprovalUser);
router.delete('/:id', approvalUserController.deleteApprovalUser);

export default router;