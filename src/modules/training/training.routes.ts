import { Router } from 'express'
import { TrainingController } from './Training.controller'
import { requireAuth } from '../../middleware/auth.middleware'
import { csvImportMiddleware } from '../../middleware/csvImport.middleware'
import { trainingImageUploadMiddleware, handleUploadError } from '../../middleware/imageUpload.middleware'

const router = Router()

// Apply authentication middleware to all routes
router.use(requireAuth)

// GET /api/training - Get all trainings
router.get('/', TrainingController.getAllTrainings)

// POST /api/training/bulk-delete - Bulk delete trainings
router.post('/bulk-delete', TrainingController.bulkDeleteTrainings)

// GET /api/training/template/download - Download CSV template
router.get('/template/download', TrainingController.downloadTemplate)

// GET /api/training/export - Export all trainings to CSV
router.get('/export', TrainingController.exportTrainings)

// POST /api/training/import - Import trainings from CSV
router.post('/import', csvImportMiddleware, TrainingController.importTrainings)

// POST /api/training/upload-image - Upload training image
router.post('/upload-image', trainingImageUploadMiddleware, handleUploadError, TrainingController.uploadImage)

// POST /api/training/:id/generate-qr - Generate QR code for training
router.post('/:id/generate-qr', TrainingController.generateQRCode)

// GET /api/training/:id/qr-code - Get QR code for training
router.get('/:id/qr-code', TrainingController.getQRCode)

// GET /api/training/:id - Get training by ID (MUST BE AFTER SPECIFIC ROUTES)
router.get('/:id', TrainingController.getTrainingById)

// POST /api/training - Create new training
router.post('/', TrainingController.createTraining)

// PUT /api/training/:id - Update training
router.put('/:id', TrainingController.updateTraining)

// DELETE /api/training/:id - Delete training
router.delete('/:id', TrainingController.deleteTraining)

export default router