import { Router } from 'express'
import { TrainingController } from './Training.controller'
import { requireAuth } from '../../middleware/auth.middleware'
import { csvImportMiddleware } from '../../middleware/csvImport.middleware'

const router = Router()

// Apply authentication middleware to all routes
router.use(requireAuth)

// GET /api/training - Get all trainings
router.get('/', TrainingController.getAllTrainings)

// GET /api/training/:id - Get training by ID
router.get('/:id', TrainingController.getTrainingById)

// POST /api/training - Create new training
router.post('/', TrainingController.createTraining)

// PUT /api/training/:id - Update training
router.put('/:id', TrainingController.updateTraining)

// DELETE /api/training/:id - Delete training
router.delete('/:id', TrainingController.deleteTraining)

// POST /api/training/bulk-delete - Bulk delete trainings
router.post('/bulk-delete', TrainingController.bulkDeleteTrainings)

// GET /api/training/template/download - Download CSV template
router.get('/template/download', TrainingController.downloadTemplate)

// GET /api/training/export - Export all trainings to CSV
router.get('/export', TrainingController.exportTrainings)

// POST /api/training/import - Import trainings from CSV
router.post('/import', csvImportMiddleware, TrainingController.importTrainings)

export default router