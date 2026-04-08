import { TrainingType, BondType, PaymentType, TrainingMethod } from '@prisma/client'
import { prisma } from '../../lib/prisma'

interface TrainingImportRow {
  title: string
  description?: string
  organizer: string
  trainingType: string
  dateTimeStart: string
  dateTimeEnd: string
  venue: string
  bond: string
  typeOfPayment: string
  budgeted: string
  sponsored: string
  accommodationCost?: string
  travelCost?: string
  mealCost?: string
  trainingMethod: string
  comment?: string
  objectives?: string
  courseCurriculum?: string
  faqs?: string
}

interface ImportResult {
  success: boolean
  successCount: number
  failedCount: number
  errors: Array<{
    row: number
    data: TrainingImportRow
    error: string
  }>
}

export class TrainingImportService {
  /**
   * Process CSV data and import trainings
   */
  static async importTrainings(data: TrainingImportRow[]): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      successCount: 0,
      failedCount: 0,
      errors: []
    }

    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNumber = i + 2 // +2 because row 1 is header, and array is 0-indexed

      try {
        // Validate required fields
        const requiredFields = [
          'title',
          'organizer',
          'trainingType',
          'dateTimeStart',
          'dateTimeEnd',
          'venue',
          'bond',
          'typeOfPayment',
          'budgeted',
          'trainingMethod'
        ]

        const missingFields = requiredFields.filter(field => !row[field as keyof TrainingImportRow])
        
        if (missingFields.length > 0) {
          throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
        }

        // Validate trainingType
        const validTrainingTypes = ['IN_HOUSE', 'EXTERNAL', 'ONLINE']
        if (!validTrainingTypes.includes(row.trainingType)) {
          throw new Error(`Invalid training type. Must be one of: ${validTrainingTypes.join(', ')}`)
        }

        // Validate bond type
        const validBondTypes = ['BONDED', 'NON_BONDED']
        if (!validBondTypes.includes(row.bond)) {
          throw new Error(`Invalid bond type. Must be one of: ${validBondTypes.join(', ')}`)
        }

        // Validate payment type
        const validPaymentTypes = ['HRDCORP', 'NONE']
        if (!validPaymentTypes.includes(row.typeOfPayment)) {
          throw new Error(`Invalid payment type. Must be one of: ${validPaymentTypes.join(', ')}`)
        }

        // Validate training method
        const validTrainingMethods = ['CASH_IN_ADVANCE', 'PAY_AND_CLAIM']
        if (!validTrainingMethods.includes(row.trainingMethod)) {
          throw new Error(`Invalid training method. Must be one of: ${validTrainingMethods.join(', ')}`)
        }

        // Validate dates
        const startDate = new Date(row.dateTimeStart)
        const endDate = new Date(row.dateTimeEnd)

        if (isNaN(startDate.getTime())) {
          throw new Error('Invalid start date format. Use YYYY-MM-DD HH:MM format')
        }

        if (isNaN(endDate.getTime())) {
          throw new Error('Invalid end date format. Use YYYY-MM-DD HH:MM format')
        }

        if (startDate >= endDate) {
          throw new Error('End date must be after start date')
        }

        // Calculate duration
        const diffMs = endDate.getTime() - startDate.getTime()
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        
        let duration: string
        if (diffDays > 0) {
          if (diffHours > 0) {
            duration = `${diffDays} day${diffDays > 1 ? 's' : ''} ${diffHours} hour${diffHours > 1 ? 's' : ''}`
          } else {
            duration = `${diffDays} day${diffDays > 1 ? 's' : ''}`
          }
        } else {
          duration = `${diffHours} hour${diffHours > 1 ? 's' : ''}`
        }

        // Parse boolean for budgeted
        const budgeted = row.budgeted?.toLowerCase() === 'yes' || row.budgeted?.toLowerCase() === 'true'
        
        // Parse boolean for sponsored
        const sponsored = row.sponsored?.toLowerCase() === 'yes' || row.sponsored?.toLowerCase() === 'true'

        // Create training
        await prisma.training.create({
          data: {
            title: row.title.trim(),
            description: row.description?.trim() || null,
            organizer: row.organizer.trim(),
            trainingType: row.trainingType.trim() as TrainingType,
            dateTimeStart: startDate,
            dateTimeEnd: endDate,
            duration,
            venue: row.venue.trim(),
            bond: row.bond.trim() as BondType,
            typeOfPayment: row.typeOfPayment.trim() as PaymentType,
            budgeted,
            sponsored: sponsored ? 'Yes' : 'No',
            accommodationCost: row.accommodationCost ? Number(row.accommodationCost) : null,
            travelCost: row.travelCost ? Number(row.travelCost) : null,
            mealCost: row.mealCost ? Number(row.mealCost) : null,
            trainingMethod: row.trainingMethod.trim() as TrainingMethod,
            comment: row.comment?.trim() || null,
            objectives: row.objectives?.trim() || null,
            courseCurriculum: row.courseCurriculum?.trim() || null,
            faqs: row.faqs?.trim() || null
          }
        })

        result.successCount++
      } catch (error: any) {
        result.failedCount++
        result.errors.push({
          row: rowNumber,
          data: row,
          error: error.message || 'Unknown error'
        })
      }
    }

    result.success = result.failedCount === 0

    return result
  }

  /**
   * Generate CSV template headers
   */
  static getTemplateHeaders(): string[] {
    return [
      'title',
      'description',
      'organizer',
      'trainingType',
      'dateTimeStart',
      'dateTimeEnd',
      'venue',
      'bond',
      'typeOfPayment',
      'budgeted',
      'sponsored',
      'accommodationCost',
      'travelCost',
      'mealCost',
      'trainingMethod',
      'comment',
      'objectives',
      'courseCurriculum',
      'faqs'
    ]
  }

  /**
   * Generate sample CSV data
   */
  static getSampleData(): TrainingImportRow[] {
    return [
      {
        title: 'Leadership Training',
        description: 'A practical leadership programme focused on team management, communication, and decision-making skills.',
        organizer: 'HR Department',
        trainingType: 'IN_HOUSE',
        dateTimeStart: '2026-03-01 09:00',
        dateTimeEnd: '2026-03-03 17:00',
        venue: 'Conference Room A',
        bond: 'BONDED',
        typeOfPayment: 'HRDCORP',
        budgeted: 'Yes',
        sponsored: 'No',
        accommodationCost: '500',
        travelCost: '200',
        mealCost: '150',
        trainingMethod: 'CASH_IN_ADVANCE',
        comment: 'Mandatory for all managers',
        objectives: 'Develop leadership capability for team management and communication.',
        courseCurriculum: 'Module 1: Leadership Fundamentals; Module 2: Communication Skills; Module 3: Decision-Making Practice.',
        faqs: 'Prerequisite: Minimum 1 year supervisory experience. FAQ: Is certification provided? Yes.'
      },
      {
        title: 'Technical Workshop',
        description: 'Hands-on workshop for improving technical problem-solving and tool usage in daily operations.',
        organizer: 'IT Department',
        trainingType: 'EXTERNAL',
        dateTimeStart: '2026-03-15 10:00',
        dateTimeEnd: '2026-03-15 16:00',
        venue: 'Tech Hub Building',
        bond: 'NON_BONDED',
        typeOfPayment: 'NONE',
        budgeted: 'No',
        sponsored: 'Yes',
        accommodationCost: '',
        travelCost: '100',
        mealCost: '50',
        trainingMethod: 'PAY_AND_CLAIM',
        comment: '',
        objectives: 'Improve practical troubleshooting and tooling efficiency.',
        courseCurriculum: 'Session 1: Tool Setup; Session 2: Guided Exercises; Session 3: Real-Case Scenarios.',
        faqs: 'Prerequisite: Basic system operations knowledge. FAQ: Can beginners join? Yes.'
      }
    ]
  }
}
