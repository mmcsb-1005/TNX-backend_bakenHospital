import { Router } from 'express';
import { RequestTrainingController } from './RequestTraining.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();
const requestTrainingController = new RequestTrainingController();

// All routes require authentication and admin role
router.use(authMiddleware);

router.get('/', requestTrainingController.getRequestTrainings);
router.get('/:id', requestTrainingController.getRequestTrainingById);
router.post('/', requestTrainingController.createRequestTraining);
router.put('/:id', requestTrainingController.updateRequestTraining);
router.delete('/:id', requestTrainingController.deleteRequestTraining);

export default router;