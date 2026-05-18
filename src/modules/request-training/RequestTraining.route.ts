import { Router } from 'express';
import { RequestTrainingController } from './RequestTraining.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();
const requestTrainingController = new RequestTrainingController();

// All routes require authentication and admin role
router.use(authMiddleware);

router.get('/', requestTrainingController.getRequestTrainings);
router.get('/information/approver', requestTrainingController.getInformationApprover);
router.get('/pending/my-approvals', requestTrainingController.getPendingRequestsForApprover);
router.get('/my-approvals', requestTrainingController.getAllRequestsForApprover);
router.get('/my-trainings', requestTrainingController.getMyTrainings);
router.get('/my-requests', requestTrainingController.getMyRequests);
router.get('/:id', requestTrainingController.getRequestTrainingById);
router.post('/', requestTrainingController.createRequestTraining);
router.post('/submit-with-training', requestTrainingController.submitTrainingRequest);
router.put('/:id', requestTrainingController.updateRequestTraining);
router.delete('/:id', requestTrainingController.deleteRequestTraining);
router.post('/:id/approve', requestTrainingController.approveRequest);
router.post('/:id/reject', requestTrainingController.rejectRequest);
router.post('/:id/admin-approve', requestTrainingController.adminApproveRequest);
router.post('/:id/admin-reject', requestTrainingController.adminRejectRequest);
router.post('/:id/send-notification', requestTrainingController.sendNotification);

export default router;
