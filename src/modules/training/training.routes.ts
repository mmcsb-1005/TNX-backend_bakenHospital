import { Router } from 'express'
import { TrainingController } from './Training.controller'
import { requireAuth } from '../../middleware/auth.middleware'
import { csvImportMiddleware } from '../../middleware/csvImport.middleware'
import { paymentProofUploadMiddleware, trainingImageUploadMiddleware, handleUploadError } from '../../middleware/imageUpload.middleware'

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

// GET /api/training/payment-submissions - List trainings for payment submission tracking
router.get('/payment-submissions', TrainingController.getPaymentSubmissionTrainings)

// POST /api/training/:id/payment-proof - Upload payment proof and mark as paid
router.post('/:id/payment-proof', paymentProofUploadMiddleware, handleUploadError, TrainingController.uploadPaymentProof)

// POST /api/training/:id/generate-qr - Generate QR code for training
router.post('/:id/generate-qr', TrainingController.generateQRCode)

// POST /api/training/:id/generate-qr/bulk - Bulk generate QR codes for all training days
router.post('/:id/generate-qr/bulk', TrainingController.bulkGenerateQRCodes)

// GET /api/training/:id/qr-codes/all - Get all QR codes for a training
router.get('/:id/qr-codes/all', TrainingController.getAllQRCodes)

// GET /api/training/:id/qr-codes - Get QR codes for training by date
router.get('/:id/qr-codes', TrainingController.getQRCodesByDate)

// POST /api/training/:id/bookmark - Bookmark a training
router.post('/:id/bookmark', TrainingController.addBookmark)

// DELETE /api/training/:id/bookmark - Remove a bookmarked training
router.delete('/:id/bookmark', TrainingController.removeBookmark)

// GET /api/training/:id - Get training by ID (MUST BE AFTER SPECIFIC ROUTES)
router.get('/:id', TrainingController.getTrainingById)

// POST /api/training - Create new training
router.post('/', TrainingController.createTraining)

// PUT /api/training/:id - Update training
router.put('/:id', TrainingController.updateTraining)

// DELETE /api/training/:id - Delete training
router.delete('/:id', TrainingController.deleteTraining)

export default router
