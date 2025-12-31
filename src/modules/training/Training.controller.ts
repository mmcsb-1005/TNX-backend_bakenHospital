import { Request, Response } from 'express'
import { prisma } from '../../lib/prisma'

export class TrainingController {
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
        where: { id }
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
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
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
        comment
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
          comment
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
        comment
      } = req.body

      // Check if training exists
      const existingTraining = await prisma.training.findUnique({
        where: { id }
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
        
        duration = this.calculateDuration(startDate, endDate)
      }

      const training = await prisma.training.update({
        where: { id },
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
          ...(comment !== undefined && { comment })
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
        where: { id }
      })

      if (!existingTraining) {
        return res.status(404).json({
          success: false,
          message: 'Training not found'
        })
      }

      await prisma.training.delete({
        where: { id }
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
}