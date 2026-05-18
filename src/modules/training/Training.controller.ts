import { Request, Response } from 'express'
import { prisma } from '../../lib/prisma'
import { PaymentClaimStatus, Prisma } from '@prisma/client'
import { TrainingImportService } from './TrainingImport.service'
import { TrainingExportService } from './TrainingExport.service'
import QRCode from 'qrcode'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import path from 'path'
import { getPublicUrlForObject, uploadObject, removeObject, tryExtractObjectPathFromPublicUrl } from '../../lib/supabaseAdmin'

const getAuthenticatedUserId = (req: Request) => req.user?.id

const mapTrainingWithBookmarkState = <T extends { bookmarks?: { id: string }[] }>(training: T) => {
  const { bookmarks, ...trainingData } = training

  return {
    ...trainingData,
    isBookmarked: Boolean(bookmarks?.length)
  }
}

export class TrainingController {
  static async uploadImage(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        })
      }

      const extractedExt = path.extname(req.file.originalname || '').toLowerCase()
      const extension = extractedExt && extractedExt.length <= 12 ? extractedExt : ''

      const objectPath = `training-image/${uuidv4()}${extension}`
      await uploadObject({
        objectPath,
        body: req.file.buffer,
        contentType: req.file.mimetype,
      })

      const imagePath = getPublicUrlForObject(objectPath)

      return res.status(200).json({
        success: true,
        data: {
          imagePath,
          publicId: objectPath
        },
        message: 'Training image uploaded successfully'
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error uploading training image',
        error: error.message
      })
    }
  }

  static async getPaymentSubmissionTrainings(req: Request, res: Response) {
    try {
      const userId = getAuthenticatedUserId(req)
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' })
      }

      const trainings = await prisma.training.findMany({
        select: {
          id: true,
          title: true,
          organizer: true,
          dateTimeStart: true,
          dateTimeEnd: true,
          venue: true,
          updatedAt: true,
          paymentClaims: {
            where: { userId },
            select: {
              paymentStatus: true,
              receiptPath: true,
              receiptOriginalName: true,
              updatedAt: true,
            },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      const data = trainings.map(t => {
        const claim = t.paymentClaims?.[0]
        const isPaid = claim?.paymentStatus === PaymentClaimStatus.PAID && Boolean(claim.receiptPath)
        return {
          id: t.id,
          title: t.title,
          organizer: t.organizer,
          dateTimeStart: t.dateTimeStart,
          dateTimeEnd: t.dateTimeEnd,
          venue: t.venue,
          paymentStatus: isPaid ? 'PAYMENT_SUCCESS' : 'UNPAID',
          paymentProofPath: claim?.receiptPath ?? null,
          paymentProofOriginalName: claim?.receiptOriginalName ?? null,
          updatedAt: claim?.updatedAt ?? t.updatedAt,
        }
      })

      return res.status(200).json({
        success: true,
        data,
        message: 'Payment submission trainings retrieved successfully',
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving payment submission trainings',
        error: error?.message,
      })
    }
  }

  static async uploadPaymentProof(req: Request, res: Response) {
    try {
      const trainingId = req.params.id as string
      const userId = getAuthenticatedUserId(req)

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' })
      }

      if (!trainingId) {
        return res.status(400).json({ success: false, message: 'Training ID is required' })
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' })
      }

      const training = await prisma.training.findUnique({ where: { id: trainingId }, select: { id: true } })

      if (!training) {
        return res.status(404).json({ success: false, message: 'Training not found' })
      }

      const extractedExt = path.extname(req.file.originalname || '').toLowerCase()
      const extension = extractedExt && extractedExt.length <= 12 ? extractedExt : ''

      const objectPath = `payment-submissions/${trainingId}/${userId}/${uuidv4()}${extension}`
      await uploadObject({
        objectPath,
        body: req.file.buffer,
        contentType: req.file.mimetype,
      })

      const receiptPath = getPublicUrlForObject(objectPath)
      const receiptOriginalName = req.file.originalname

      const existingClaim = await prisma.paymentClaim.findUnique({
        where: { trainingId_userId: { trainingId, userId } },
        select: { id: true, receiptPath: true },
      })

      const oldObjectPath = existingClaim?.receiptPath ? tryExtractObjectPathFromPublicUrl(existingClaim.receiptPath) : null
      if (oldObjectPath) {
        try {
          await removeObject(oldObjectPath)
        } catch (removeError) {
          const message = removeError instanceof Error ? removeError.message : String(removeError || '')
          const isNotFound =
            /not\s*found/i.test(message) || /no\s*such\s*key/i.test(message) || /\b404\b/.test(message)
          if (!isNotFound) {
            throw removeError
          }
        }
      }

      const claim = await prisma.paymentClaim.upsert({
        where: { trainingId_userId: { trainingId, userId } },
        create: {
          trainingId,
          userId,
          amountClaimed: new Prisma.Decimal(0),
          paymentStatus: PaymentClaimStatus.PAID,
          receiptPath,
          receiptOriginalName,
          paidAt: new Date(),
        },
        update: {
          paymentStatus: PaymentClaimStatus.PAID,
          receiptPath,
          receiptOriginalName,
          paidAt: new Date(),
        },
        select: {
          id: true,
          paymentStatus: true,
          receiptPath: true,
          receiptOriginalName: true,
          updatedAt: true,
        },
      })

      return res.status(200).json({
        success: true,
        data: {
          id: trainingId,
          paymentStatus: 'PAYMENT_SUCCESS',
          paymentProofPath: claim.receiptPath,
          paymentProofOriginalName: claim.receiptOriginalName,
          updatedAt: claim.updatedAt,
        },
        message: 'Payment proof uploaded successfully',
      })
    } catch (error: any) {
      const status =
        typeof error?.status === 'number' && error.status >= 400 && error.status < 600 ? error.status : 500
      return res.status(status).json({
        success: false,
        message: 'Error uploading payment proof',
        error: error?.message,
      })
    }
  }

  // Get all trainings
  static async getAllTrainings(req: Request, res: Response) {
    try {
      const userId = getAuthenticatedUserId(req)
      const sourceParam = req.query.source as string | undefined

      // By default only show admin-created trainings; pass ?source=USER_REQUEST or ?source=all to override
      const sourceFilter =
        sourceParam === 'all'
          ? undefined
          : sourceParam === 'USER_REQUEST'
          ? 'USER_REQUEST'
          : 'ADMIN'

      const trainings = await prisma.training.findMany({
        where: sourceFilter ? { source: sourceFilter as any } : undefined,
        include: {
          bookmarks: userId
            ? {
                where: { userId },
                select: { id: true }
              }
            : false
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      return res.status(200).json({
        success: true,
        data: trainings.map(mapTrainingWithBookmarkState),
        message: 'Trainings retrieved successfully'
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving trainings',
        error: error.message
      })
    }
  }

  // Get training by ID
  static async getTrainingById(req: Request, res: Response) {
    try {
      const { id } = req.params
      const userId = getAuthenticatedUserId(req)
      const training = await prisma.training.findUnique({
        where: { id: id as string },
        include: {
          bookmarks: userId
            ? {
                where: { userId },
                select: { id: true }
              }
            : false
        }
      })

      if (!training) {
        return res.status(404).json({
          success: false,
          message: 'Training not found'
        })
      }

      return res.status(200).json({
        success: true,
        data: mapTrainingWithBookmarkState(training),
        message: 'Training retrieved successfully'
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving training',
        error: error.message
      })
    }
  }

  static async addBookmark(req: Request, res: Response) {
    try {
      const userId = getAuthenticatedUserId(req)
      const { id } = req.params

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        })
      }

      const training = await prisma.training.findUnique({
        where: { id: id as string }
      })

      if (!training) {
        return res.status(404).json({
          success: false,
          message: 'Training not found'
        })
      }

      await prisma.trainingBookmark.upsert({
        where: {
          userId_trainingId: {
            userId,
            trainingId: id as string
          }
        },
        update: {},
        create: {
          userId,
          trainingId: id as string
        }
      })

      return res.status(200).json({
        success: true,
        data: {
          trainingId: id,
          isBookmarked: true
        },
        message: 'Training bookmarked successfully'
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error bookmarking training',
        error: error.message
      })
    }
  }

  static async removeBookmark(req: Request, res: Response) {
    try {
      const userId = getAuthenticatedUserId(req)
      const { id } = req.params

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        })
      }

      const training = await prisma.training.findUnique({
        where: { id: id as string }
      })

      if (!training) {
        return res.status(404).json({
          success: false,
          message: 'Training not found'
        })
      }

      await prisma.trainingBookmark.deleteMany({
        where: {
          userId,
          trainingId: id as string
        }
      })

      return res.status(200).json({
        success: true,
        data: {
          trainingId: id,
          isBookmarked: false
        },
        message: 'Training bookmark removed successfully'
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error removing training bookmark',
        error: error.message
      })
    }
  }

  // Helper function to calculate duration
  static calculateDuration(startDate: Date, endDate: Date): string {
    const diffMs = endDate.getTime() - startDate.getTime()
    // Add 1 to include both start and end date
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (diffDays > 0) {
      if (diffHours > 0) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ${diffHours} hour${diffHours > 1 ? 's' : ''}`
      }
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`
    } else if (diffHours > 0) {
      if (diffMinutes > 0) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`
      }
      return `${diffHours} hour${diffHours > 1 ? 's' : ''}`
    } else {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`
    }
  }

  // Create new training
  static async createTraining(req: Request, res: Response) {
    try {
      console.log('Request body:', JSON.stringify(req.body, null, 2))
      
      const {
        title,
        description,
        organizer,
        trainingType,
        dateTimeStart,
        dateTimeEnd,
        venue,
        bond,
        typeOfPayment,
        budgeted,
        sponsored,
        trainingCost,
        accommodationCost,
        travelCost,
        mealCost,
        trainingMethod,
        comment,
        objectives,
        courseCurriculum,
        faqs,
        imagePath
      } = req.body

      // Validate required fields
      if (!title || !organizer || !trainingType || !dateTimeStart || !dateTimeEnd || !venue || !bond || !typeOfPayment || budgeted === undefined || !trainingMethod) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        })
      }

      // Validate date order
      const startDate = new Date(dateTimeStart)
      const endDate = new Date(dateTimeEnd)
      
      if (startDate >= endDate) {
        return res.status(400).json({
          success: false,
          message: 'End date must be after start date'
        })
      }

      // Calculate duration
      const duration = TrainingController.calculateDuration(startDate, endDate)

      const training = await prisma.training.create({
        data: {
          title,
          description,
          organizer,
          trainingType,
          dateTimeStart: startDate,
          dateTimeEnd: endDate,
          duration,
          venue,
          bond,
          typeOfPayment,
          budgeted,
          sponsored,
          trainingCost: trainingCost ? Number(trainingCost) : null,
          accommodationCost: accommodationCost ? Number(accommodationCost) : null,
          travelCost: travelCost ? Number(travelCost) : null,
          mealCost: mealCost ? Number(mealCost) : null,
          trainingMethod,
          comment,
          objectives,
          courseCurriculum,
          faqs,
          imagePath: imagePath || null,
          source: 'ADMIN'
        }
      })

      return res.status(201).json({
        success: true,
        data: training,
        message: 'Training created successfully'
      })
    } catch (error: any) {
      console.error('Error creating training:', error)
      return res.status(500).json({
        success: false,
        message: 'Error creating training',
        error: error.message
      })
    }
  }

  // Update training
  static async updateTraining(req: Request, res: Response) {
    try {
      const { id } = req.params
      const {
        title,
        description,
        organizer,
        trainingType,
        dateTimeStart,
        dateTimeEnd,
        venue,
        bond,
        typeOfPayment,
        budgeted,
        sponsored,
        trainingCost,
        accommodationCost,
        travelCost,
        mealCost,
        trainingMethod,
        comment,
        objectives,
        courseCurriculum,
        faqs,
        imagePath
      } = req.body

      // Check if training exists
      const existingTraining = await prisma.training.findUnique({
        where: { id: id as string }
      })

      if (!existingTraining) {
        return res.status(404).json({
          success: false,
          message: 'Training not found'
        })
      }

      // Calculate duration if dates are provided
      let duration = existingTraining.duration
      if (dateTimeStart && dateTimeEnd) {
        const startDate = new Date(dateTimeStart)
        const endDate = new Date(dateTimeEnd)
        
        if (startDate >= endDate) {
          return res.status(400).json({
            success: false,
            message: 'End date must be after start date'
          })
        }
        
        duration = TrainingController.calculateDuration(startDate, endDate)
      }

      if (imagePath && existingTraining.imagePath && existingTraining.imagePath !== imagePath) {
        const oldObjectPath = tryExtractObjectPathFromPublicUrl(existingTraining.imagePath)
        if (oldObjectPath) {
          await removeObject(oldObjectPath)
        }
      }

      const training = await prisma.training.update({
        where: { id: id as string },
        data: {
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(organizer && { organizer }),
          ...(trainingType && { trainingType }),
          ...(dateTimeStart && { dateTimeStart: new Date(dateTimeStart) }),
          ...(dateTimeEnd && { dateTimeEnd: new Date(dateTimeEnd) }),
          ...(duration && { duration }),
          ...(venue && { venue }),
          ...(bond && { bond }),
          ...(typeOfPayment && { typeOfPayment }),
          ...(budgeted !== undefined && { budgeted }),
          ...(sponsored !== undefined && { sponsored }),
          ...(trainingCost !== undefined && { trainingCost: trainingCost ? Number(trainingCost) : null }),
          ...(accommodationCost !== undefined && { accommodationCost: accommodationCost ? parseFloat(accommodationCost) : null }),
          ...(travelCost !== undefined && { travelCost: travelCost ? parseFloat(travelCost) : null }),
          ...(mealCost !== undefined && { mealCost: mealCost ? parseFloat(mealCost) : null }),
          ...(trainingMethod && { trainingMethod }),
          ...(comment !== undefined && { comment }),
          ...(objectives !== undefined && { objectives }),
          ...(courseCurriculum !== undefined && { courseCurriculum }),
          ...(faqs !== undefined && { faqs }),
          ...(imagePath !== undefined && { imagePath: imagePath || null })
        }
      })

      return res.status(200).json({
        success: true,
        data: training,
        message: 'Training updated successfully'
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error updating training',
        error: error.message
      })
    }
  }

  // Delete training
  static async deleteTraining(req: Request, res: Response) {
    try {
      const { id } = req.params

      const existingTraining = await prisma.training.findUnique({
        where: { id: id as string }
      })

      if (!existingTraining) {
        return res.status(404).json({
          success: false,
          message: 'Training not found'
        })
      }

      if (existingTraining.imagePath) {
        const oldObjectPath = tryExtractObjectPathFromPublicUrl(existingTraining.imagePath)
        if (oldObjectPath) {
          await removeObject(oldObjectPath)
        }
      }

      await prisma.training.delete({
        where: { id: id as string }
      })

      return res.status(200).json({
        success: true,
        message: 'Training deleted successfully'
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error deleting training',
        error: error.message
      })
    }
  }

  // Bulk delete trainings
  static async bulkDeleteTrainings(req: Request, res: Response) {
    try {
      const { ids } = req.body

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please provide an array of training IDs'
        })
      }

      const deletedCount = await prisma.training.deleteMany({
        where: {
          id: {
            in: ids
          }
        }
      })

      return res.status(200).json({
        success: true,
        data: { deletedCount: deletedCount.count },
        message: `${deletedCount.count} training(s) deleted successfully`
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error deleting trainings',
        error: error.message
      })
    }
  }

  // Import trainings from CSV
  static async importTrainings(req: Request, res: Response) {
    try {
      const { data } = req.body

      if (!data || !Array.isArray(data) || data.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No data provided for import'
        })
      }

      const result = await TrainingImportService.importTrainings(data)

      const statusCode = result.success ? 200 : 207 // 207 Multi-Status for partial success

      return res.status(statusCode).json({
        success: result.success,
        data: result,
        message: result.success 
          ? `Successfully imported ${result.successCount} training(s)`
          : `Imported ${result.successCount} training(s) with ${result.failedCount} failure(s)`
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error importing trainings',
        error: error.message
      })
    }
  }

  // Download CSV template
  static async downloadTemplate(req: Request, res: Response) {
    try {
      const headers = TrainingImportService.getTemplateHeaders()
      const sampleData = TrainingImportService.getSampleData()

      // Create CSV manually for more control
      const csvHeaders = headers.join(',')
      const csvRows = sampleData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row] || ''
          // Escape values that contain commas or quotes
          if (String(value).includes(',') || String(value).includes('"')) {
            return `"${String(value).replace(/"/g, '""')}"`
          }
          return value
        }).join(',')
      )
      
      const csvContent = [csvHeaders, ...csvRows].join('\n')

      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', 'attachment; filename=training-import-template.csv')
      res.send(csvContent)
    } catch (error: any) {
      console.error('Error downloading template:', error)
      return res.status(500).json({
        success: false,
        message: 'Error downloading template',
        error: error.message
      })
    }
  }

  // Export all trainings to CSV
  static async exportTrainings(req: Request, res: Response) {
    try {
      const csvData = await TrainingExportService.exportToCsv()

      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename=trainings_export_${new Date().toISOString().slice(0, 10)}.csv`)
      res.send(csvData)
    } catch (error: any) {
      console.error('Training Export Error:', error)
      return res.status(500).json({
        success: false,
        message: 'Error exporting trainings',
        error: error.message
      })
    }
  }

  // Generate QR code for training attendance
  static async generateQRCode(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { date } = req.body // Optional date parameter for daily QR codes
      
      // Check if training exists
      const training = await prisma.training.findUnique({
        where: { id: id as string }
      })

      if (!training) {
        return res.status(404).json({
          success: false,
          message: 'Training not found'
        })
      }

      const generatedAt = new Date()
      const defaultExpiresAt = new Date(generatedAt.getTime() + 7 * 24 * 60 * 60 * 1000) // 1 week
      const qrDate = date ? new Date(date) : generatedAt

      // Reuse existing QR code if it already exists for that date and is still valid
      let qrCode = await prisma.qrCode.findFirst({
        where: {
          trainingId: id as string,
          date: qrDate
        }
      })

      let token: string
      let expiresAt: Date

      if (qrCode && qrCode.expiresAt > new Date()) {
        token = qrCode.token
        expiresAt = qrCode.expiresAt
      } else {
        token = uuidv4()
        expiresAt = defaultExpiresAt

        if (qrCode) {
          qrCode = await prisma.qrCode.update({
            where: { id: qrCode.id },
            data: {
              token,
              expiresAt
            }
          })
        } else {
          qrCode = await prisma.qrCode.create({
            data: {
              trainingId: id as string,
              token: token,
              date: qrDate,
              expiresAt: expiresAt
            }
          })
        }
      }

      // Generate QR code data URL with date-specific information
      const qrData = JSON.stringify({
        trainingId: id,
        token: token,
        date: qrCode.date.toISOString().split('T')[0], // Date in YYYY-MM-DD format
        timestamp: generatedAt.toISOString()
      })

      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'H',
        width: 400,
        margin: 2
      })

      // Save QR code as file in frontend/public/qr-generate
      const fileName = `qr_${id}_${qrCode.date.toISOString().split('T')[0]}_${token.slice(0, 8)}.png`
      const qrDirPath = path.join(__dirname, '../../../../frontend/public/qr-generate')
      
      if (!fs.existsSync(qrDirPath)) {
        fs.mkdirSync(qrDirPath, { recursive: true })
      }

      const filePath = path.join(qrDirPath, fileName)
      const base64Data = qrCodeDataURL.replace(/^data:image\/png;base64,/, '')
      fs.writeFileSync(filePath, base64Data, 'base64')
      
      const qrFilePath = `/qr-generate/${fileName}`

      return res.status(200).json({
        success: true,
        data: {
          training: training,
          qrCodeDataURL,
          qrFilePath,
          expiresAt
        },
        message: 'QR code generated and saved successfully'
      })
    } catch (error: any) {
      console.error('Error generating QR code:', error)
      return res.status(500).json({
        success: false,
        message: 'Error generating QR code',
        error: error.message
      })
    }
  }

  // Get QR code for training
  static async getQRCode(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { date } = req.query // Optional date parameter
      
      const training = await prisma.training.findUnique({
        where: { id: id as string }
      })

      if (!training) {
        return res.status(404).json({
          success: false,
          message: 'Training not found'
        })
      }

      if (!training.qrCodeToken || !training.qrCodeExpiresAt) {
        return res.status(404).json({
          success: false,
          message: 'QR code not generated for this training'
        })
      }

      // Check if QR code is expired
      if (new Date() > training.qrCodeExpiresAt) {
        return res.status(410).json({
          success: false,
          message: 'QR code has expired. Please generate a new one.'
        })
      }

      // Regenerate QR code data URL from stored token (include date if provided)
      const qrData = JSON.stringify({
        trainingId: id,
        token: training.qrCodeToken,
        date: date || null,
        timestamp: training.qrCodeGeneratedAt?.toISOString()
      })

      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'H',
        width: 400,
        margin: 2
      })

      return res.status(200).json({
        success: true,
        data: {
          training,
          qrCodeDataURL,
          expiresAt: training.qrCodeExpiresAt
        },
        message: 'QR code retrieved successfully'
      })
    } catch (error: any) {
      console.error('Error retrieving QR code:', error)
      return res.status(500).json({
        success: false,
        message: 'Error retrieving QR code',
        error: error.message
      })
    }
  }

  // Get QR codes for training by date
  static async getQRCodesByDate(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { date } = req.query

      const training = await prisma.training.findUnique({
        where: { id: id as string }
      })

      if (!training) {
        return res.status(404).json({
          success: false,
          message: 'Training not found'
        })
      }

      if (!date) {
        return res.status(400).json({
          success: false,
          message: 'Date parameter is required'
        })
      }

      // Find QR code for the specific date
      const qrCode = await prisma.qrCode.findFirst({
        where: {
          trainingId: id as string,
          date: new Date(date as string),
          expiresAt: {
            gt: new Date() // Not expired
          }
        }
      })

      if (!qrCode) {
        return res.status(404).json({
          success: false,
          message: 'QR code not found for this date'
        })
      }

      // Regenerate QR code data URL from stored token
      const qrData = JSON.stringify({
        trainingId: id,
        token: qrCode.token,
        date: qrCode.date.toISOString().split('T')[0],
        timestamp: qrCode.createdAt.toISOString()
      })

      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'H',
        width: 400,
        margin: 2
      })

      // Save QR code as file in frontend/public/qr-generate
      const fileName = `qr_${id}_${qrCode.date.toISOString().split('T')[0]}_${qrCode.token.slice(0, 8)}.png`
      const qrDirPath = path.join(__dirname, '../../../../frontend/public/qr-generate')
      
      if (!fs.existsSync(qrDirPath)) {
        fs.mkdirSync(qrDirPath, { recursive: true })
      }

      const filePath = path.join(qrDirPath, fileName)
      const base64Data = qrCodeDataURL.replace(/^data:image\/png;base64,/, '')
      fs.writeFileSync(filePath, base64Data, 'base64')
      
      const qrFilePath = `/qr-generate/${fileName}`

      return res.status(200).json({
        success: true,
        data: {
          training,
          qrCodeDataURL,
          qrFilePath,
          expiresAt: qrCode.expiresAt
        },
        message: 'QR code retrieved and saved successfully'
      })
    } catch (error: any) {
      console.error('Error retrieving QR code:', error)
      return res.status(500).json({
        success: false,
        message: 'Error retrieving QR code',
        error: error.message
      })
    }
  }

  // Get all QR codes for a training
  static async getAllQRCodes(req: Request, res: Response) {
    try {
      const { id } = req.params

      const training = await prisma.training.findUnique({
        where: { id: id as string }
      })

      if (!training) {
        return res.status(404).json({
          success: false,
          message: 'Training not found'
        })
      }

      const qrCodes = await prisma.qrCode.findMany({
        where: {
          trainingId: id as string,
          expiresAt: {
            gt: new Date()
          }
        },
        orderBy: {
          date: 'asc'
        }
      })

      const qrCodesWithData = await Promise.all(qrCodes.map(async (qrCode) => {
        const qrData = JSON.stringify({
          trainingId: id,
          token: qrCode.token,
          date: qrCode.date.toISOString().split('T')[0],
          timestamp: qrCode.createdAt.toISOString()
        })

        const qrCodeDataURL = await QRCode.toDataURL(qrData, {
          errorCorrectionLevel: 'H',
          width: 400,
          margin: 2
        })

        const fileName = `qr_${id}_${qrCode.date.toISOString().split('T')[0]}_${qrCode.token.slice(0, 8)}.png`
        const qrDirPath = path.join(__dirname, '../../../../frontend/public/qr-generate')
        
        if (!fs.existsSync(qrDirPath)) {
          fs.mkdirSync(qrDirPath, { recursive: true })
        }

        const filePath = path.join(qrDirPath, fileName)
        const base64Data = qrCodeDataURL.replace(/^data:image\/png;base64,/, '')
        fs.writeFileSync(filePath, base64Data, 'base64')
        
        return {
          date: qrCode.date.toISOString().split('T')[0],
          token: qrCode.token,
          qrCodeDataURL,
          qrFilePath: `/qr-generate/${fileName}`,
          expiresAt: qrCode.expiresAt
        }
      }))

      return res.status(200).json({
        success: true,
        data: qrCodesWithData,
        message: 'All QR codes retrieved successfully'
      })
    } catch (error: any) {
      console.error('Error retrieving all QR codes:', error)
      return res.status(500).json({
        success: false,
        message: 'Error retrieving all QR codes',
        error: error.message
      })
    }
  }

  // Bulk generate QR codes for all training days
  static async bulkGenerateQRCodes(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { dates } = req.body // Array of date strings

      if (!dates || !Array.isArray(dates) || dates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Dates array is required'
        })
      }

      const training = await prisma.training.findUnique({
        where: { id: id as string }
      })

      if (!training) {
        return res.status(404).json({
          success: false,
          message: 'Training not found'
        })
      }

      const results = await Promise.all(dates.map(async (dateStr) => {
        const qrDate = new Date(dateStr)
        const generatedAt = new Date()
        const expiresAt = new Date(generatedAt.getTime() + 7 * 24 * 60 * 60 * 1000)
        
        // Find existing or create new
        let qrCode = await prisma.qrCode.findFirst({
          where: {
            trainingId: id as string,
            date: qrDate
          }
        })

        let token: string = uuidv4()
        if (qrCode) {
          qrCode = await prisma.qrCode.update({
            where: { id: qrCode.id },
            data: { token, expiresAt }
          })
        } else {
          qrCode = await prisma.qrCode.create({
            data: {
              trainingId: id as string,
              token: token,
              date: qrDate,
              expiresAt: expiresAt
            }
          })
        }

        const qrData = JSON.stringify({
          trainingId: id,
          token: token,
          date: qrCode.date.toISOString().split('T')[0],
          timestamp: generatedAt.toISOString()
        })

        const qrCodeDataURL = await QRCode.toDataURL(qrData, {
          errorCorrectionLevel: 'H',
          width: 400,
          margin: 2
        })

        const fileName = `qr_${id}_${qrCode.date.toISOString().split('T')[0]}_${token.slice(0, 8)}.png`
        const qrDirPath = path.join(__dirname, '../../../../frontend/public/qr-generate')
        
        if (!fs.existsSync(qrDirPath)) {
          fs.mkdirSync(qrDirPath, { recursive: true })
        }

        const filePath = path.join(qrDirPath, fileName)
        const base64Data = qrCodeDataURL.replace(/^data:image\/png;base64,/, '')
        fs.writeFileSync(filePath, base64Data, 'base64')
        
        return {
          date: dateStr,
          token: token,
          qrCodeDataURL,
          qrFilePath: `/qr-generate/${fileName}`,
          expiresAt
        }
      }))

      return res.status(200).json({
        success: true,
        data: results,
        message: 'All QR codes generated successfully'
      })
    } catch (error: any) {
      console.error('Error bulk generating QR codes:', error)
      return res.status(500).json({
        success: false,
        message: 'Error bulk generating QR codes',
        error: error.message
      })
    }
  }
}
