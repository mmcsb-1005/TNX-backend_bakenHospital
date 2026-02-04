import { Request, Response } from 'express'
import { prisma } from '../../lib/prisma'

export class FormSubmissionController {
  // Submit form response
  static async submitForm(req: Request, res: Response) {
    try {
      const { id: formId } = req.params
      const { responses, userId } = req.body

      // Verify form exists and is active
      const form = await prisma.form.findUnique({
        where: { id: formId as string },
        include: { fields: true }
      })

      if (!form) {
        return res.status(404).json({
          success: false,
          message: 'Form not found'
        })
      }

      if (!form.isActive) {
        return res.status(400).json({
          success: false,
          message: 'This form is currently inactive'
        })
      }

      // Validate required fields
      const requiredFields = form.fields.filter((f: any) => f.required)
      const missingFields = requiredFields.filter(
        (field: any) => !responses[field.id] || responses[field.id] === ''
      )

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
          missingFields: missingFields.map((f: any) => f.label)
        })
      }

      const submission = await prisma.formSubmission.create({
        data: {
          formId: formId as string,
          userId,
          responses
        }
      })

      return res.status(201).json({
        success: true,
        data: submission,
        message: 'Form submitted successfully'
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error submitting form',
        error: error.message
      })
    }
  }

  // Get all submissions for a form
  static async getFormSubmissions(req: Request, res: Response) {
    try {
      const { id: formId } = req.params
      const { page = 1, limit = 10 } = req.query

      const pageNum = parseInt(page as string)
      const limitNum = parseInt(limit as string)
      const skip = (pageNum - 1) * limitNum

      const [submissions, total] = await Promise.all([
        prisma.formSubmission.findMany({
          where: { formId: formId as string },
          include: {
            form: {
              include: {
                fields: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: limitNum
        }),
        prisma.formSubmission.count({
          where: { formId: formId as string }
        })
      ])

      return res.status(200).json({
        success: true,
        data: submissions,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        },
        message: 'Submissions retrieved successfully'
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving submissions',
        error: error.message
      })
    }
  }

  // Get single submission
  static async getSubmissionById(req: Request, res: Response) {
    try {
      const { id } = req.params

      const submission = await prisma.formSubmission.findUnique({
        where: { id: id as string },
        include: {
          form: {
            include: {
              fields: true
            }
          }
        }
      })

      if (!submission) {
        return res.status(404).json({
          success: false,
          message: 'Submission not found'
        })
      }

      return res.status(200).json({
        success: true,
        data: submission,
        message: 'Submission retrieved successfully'
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving submission',
        error: error.message
      })
    }
  }

  // Delete submission
  static async deleteSubmission(req: Request, res: Response) {
    try {
      const { id } = req.params

      await prisma.formSubmission.delete({
        where: { id: id as string }
      })

      return res.status(200).json({
        success: true,
        message: 'Submission deleted successfully'
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error deleting submission',
        error: error.message
      })
    }
  }

  // Export submissions as CSV
  static async exportSubmissions(req: Request, res: Response) {
    try {
      const { id: formId } = req.params

      const form = await prisma.form.findUnique({
        where: { id: formId as string },
        include: {
          fields: {
            orderBy: { order: 'asc' }
          },
          submissions: {
            orderBy: { createdAt: 'desc' }
          }
        }
      })

      if (!form) {
        return res.status(404).json({
          success: false,
          message: 'Form not found'
        })
      }

      // Build CSV header
      const headers = ['Submission ID', 'Submitted At', 'User ID', ...form.fields.map((f: any) => f.label)]
      
      // Build CSV rows
      const rows = form.submissions.map((submission: any) => {
        const row = [
          submission.id,
          submission.createdAt.toISOString(),
          submission.userId || 'Anonymous'
        ]
        
        form.fields.forEach((field: any) => {
          const response = (submission.responses as any)[field.id] || ''
          row.push(response)
        })
        
        return row
      })

      // Convert to CSV string
      const csvContent = [
        headers.join(','),
        ...rows.map((row: any) => row.map((cell: any) => `"${cell}"`).join(','))
      ].join('\n')

      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="${form.title}_submissions.csv"`)
      
      return res.status(200).send(csvContent)
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error exporting submissions',
        error: error.message
      })
    }
  }
}
