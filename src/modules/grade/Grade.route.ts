import { Router } from 'express';
import { GradeController } from './Grade.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { csvImportMiddleware } from '../../middleware/csvImport.middleware';

const router = Router();
const gradeController = new GradeController();

router.use(authMiddleware);

router.get('/', gradeController.getGrades);
router.get('/template/download', gradeController.downloadTemplate);
router.post('/import', csvImportMiddleware, gradeController.importGrades);
router.get('/:id', gradeController.getGradeById);
router.post('/', gradeController.createGrade);
router.put('/:id', gradeController.updateGrade);
router.delete('/:id', gradeController.deleteGrade);

export default router;
