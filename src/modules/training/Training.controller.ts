import { Request, Response } from 'express'
import { prisma } from '../../lib/prisma'
import { TrainingImportService } from './TrainingImport.service'
import { TrainingExportService } from './TrainingExport.service'
import QRCode from 'qrcode'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import path from 'path'

export class TrainingController {
  static async uploadImage(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        })
      }

      const imagePath = `/training/${req.file.filename}`

      return res.status(200).json({
        success: true,
        data: {
          imagePath,
          filename: req.file.filename
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

  // Get all trainings
  static async getAllTrainings(req: Request, res: Response) {
    try {
      const trainings = await prisma.training.findMany({
        orderBy: {
          createdAt: 'desc'
        }
      })

      return res.status(200).json({
        success: true,
        data: trainings,
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
      const training = await prisma.training.findUnique({
        where: { id: id as string }
      })

      if (!training) {
        return res.status(404).json({
          success: false,
          message: 'Training not found'
        })
      }

      return res.status(200).json({
        success: true,
        data: training,
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
        organizer,
        trainingType,
        dateTimeStart,
        dateTimeEnd,
        venue,
        bond,
        typeOfPayment,
        budgeted,
        sponsored,
        accommodationCost,
        travelCost,
        mealCost,
        trainingMethod,
        comment,
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
          accommodationCost: accommodationCost ? Number(accommodationCost) : null,
          travelCost: travelCost ? Number(travelCost) : null,
          mealCost: mealCost ? Number(mealCost) : null,
          trainingMethod,
          comment,
          imagePath: imagePath || null
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
        organizer,
        trainingType,
        dateTimeStart,
        dateTimeEnd,
        venue,
        bond,
        typeOfPayment,
        budgeted,
        sponsored,
        accommodationCost,
        travelCost,
        mealCost,
        trainingMethod,
        comment,
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

      // If uploading a new image, remove old image from frontend/public/training
      if (imagePath && existingTraining.imagePath && existingTraining.imagePath !== imagePath) {
        const oldFilename = existingTraining.imagePath.split('/').pop()
        if (oldFilename) {
          const oldFilePath = path.join(__dirname, '../../../frontend/public/training', oldFilename)
          if (fs.existsSync(oldFilePath)) {
            try {
              fs.unlinkSync(oldFilePath)
            } catch (_deleteErr) {
              // Do not fail update if cleanup fails
            }
          }
        }
      }

      const training = await prisma.training.update({
        where: { id: id as string },
        data: {
          ...(title && { title }),
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
          ...(accommodationCost !== undefined && { accommodationCost: accommodationCost ? parseFloat(accommodationCost) : null }),
          ...(travelCost !== undefined && { travelCost: travelCost ? parseFloat(travelCost) : null }),
          ...(mealCost !== undefined && { mealCost: mealCost ? parseFloat(mealCost) : null }),
          ...(trainingMethod && { trainingMethod }),
          ...(comment !== undefined && { comment }),
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
        const oldFilename = existingTraining.imagePath.split('/').pop()
        if (oldFilename) {
          const oldFilePath = path.join(__dirname, '../../../frontend/public/training', oldFilename)
          if (fs.existsSync(oldFilePath)) {
            try {
              fs.unlinkSync(oldFilePath)
            } catch (_deleteErr) {
              // Ignore cleanup errors during delete flow
            }
          }
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

      // Generate unique token
      const token = uuidv4()
      const generatedAt = new Date()
      const expiresAt = new Date(generatedAt.getTime() + 24 * 60 * 60 * 1000) // 24 hours

      // Update training with QR code token
      const updatedTraining = await prisma.training.update({
        where: { id: id as string },
        data: {
          qrCodeToken: token,
          qrCodeGeneratedAt: generatedAt,
          qrCodeExpiresAt: expiresAt
        }
      })

      // Generate QR code data URL
      const qrData = JSON.stringify({
        trainingId: id,
        token: token,
        timestamp: generatedAt.toISOString()
      })

      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'H',
        width: 400,
        margin: 2
      })

      return res.status(200).json({
        success: true,
        data: {
          training: updatedTraining,
          qrCodeDataURL,
          expiresAt
        },
        message: 'QR code generated successfully'
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

      // Regenerate QR code data URL from stored token
      const qrData = JSON.stringify({
        trainingId: id,
        token: training.qrCodeToken,
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
}