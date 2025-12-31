import { Router } from 'express'
import { TrainingController } from './Training.controller'
import { requireAuth } from '../../middleware/auth.middleware'

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

export default router