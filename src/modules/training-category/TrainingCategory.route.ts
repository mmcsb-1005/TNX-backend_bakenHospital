import { Router } from 'express';
import { TrainingCategoryController } from './TrainingCategory.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { csvImportMiddleware } from '../../middleware/csvImport.middleware';

const router = Router();
const trainingCategoryController = new TrainingCategoryController();

// All routes require authentication and admin role
router.use(authMiddleware);

router.get('/', trainingCategoryController.getTrainingCategories);
router.get('/export', trainingCategoryController.exportTrainingCategories);
router.get('/template/download', trainingCategoryController.downloadTemplate);
router.post('/import', csvImportMiddleware, trainingCategoryController.importTrainingCategories);
router.get('/:id', trainingCategoryController.getTrainingCategoryById);
router.post('/', trainingCategoryController.createTrainingCategory);
router.put('/:id', trainingCategoryController.updateTrainingCategory);
router.delete('/:id', trainingCategoryController.deleteTrainingCategory);

export default router;