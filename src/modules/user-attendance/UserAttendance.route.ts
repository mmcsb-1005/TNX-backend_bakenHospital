import { Router } from 'express';
import { UserAttendanceController } from './UserAttendance.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();
const userAttendanceController = new UserAttendanceController();

// All routes require authentication and admin role
router.use(authMiddleware);

// Overview routes
router.get('/trainings/overview', userAttendanceController.getTrainingsWithAttendanceOverview);
router.get('/training/:trainingId', userAttendanceController.getTrainingWithDatesAndParticipants);
router.get('/training/:trainingId/date/:date', userAttendanceController.getUserAttendancesByTrainingAndDate);
router.put('/training/:trainingId/date/:date/bulk', userAttendanceController.bulkUpdateAttendance);

// Standard CRUD routes
router.get('/', userAttendanceController.getUserAttendances);
router.get('/:id', userAttendanceController.getUserAttendanceById);
router.post('/', userAttendanceController.createUserAttendance);
router.put('/:id', userAttendanceController.updateUserAttendance);
router.delete('/:id', userAttendanceController.deleteUserAttendance);

export default router;