import { TrainingType, BondType, PaymentType, TrainingMethod } from '@prisma/client'
import { prisma } from '../../lib/prisma'

type AnyRow = Record<string, any>

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
  sponsored?: string
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
  static async importTrainings(data: AnyRow[]): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      successCount: 0,
      failedCount: 0,
      errors: []
    }

    const pickString = (row: AnyRow, keys: string[]): string | undefined => {
      for (const key of keys) {
        const value = row?.[key]
        if (value === undefined || value === null) continue
        const str = String(value).trim()
        if (str.length > 0) return str
      }
      return undefined
    }

    const normalizeRow = (raw: AnyRow): TrainingImportRow => {
      return {
        title: pickString(raw, ['title', 'Title']) || '',
        description: pickString(raw, ['description', 'Description']),
        organizer: pickString(raw, ['organizer', 'Organizer']) || '',
        trainingType: pickString(raw, ['trainingType', 'Training Type', 'training_type']) || '',
        dateTimeStart: pickString(raw, ['dateTimeStart', 'Start Date', 'date_time_start']) || '',
        dateTimeEnd: pickString(raw, ['dateTimeEnd', 'End Date', 'date_time_end']) || '',
        venue: pickString(raw, ['venue', 'Venue']) || '',
        bond: pickString(raw, ['bond', 'Bond Type', 'bondType']) || '',
        typeOfPayment: pickString(raw, ['typeOfPayment', 'Payment Type', 'paymentType']) || '',
        budgeted: pickString(raw, ['budgeted', 'Budgeted']) || '',
        sponsored: pickString(raw, ['sponsored', 'Sponsored']),
        accommodationCost: pickString(raw, ['accommodationCost', 'Accommodation Cost']),
        travelCost: pickString(raw, ['travelCost', 'Travel Cost']),
        mealCost: pickString(raw, ['mealCost', 'Meal Cost']),
        trainingMethod: pickString(raw, ['trainingMethod', 'Training Method']) || '',
        comment: pickString(raw, ['comment', 'Comment']),
        objectives: pickString(raw, ['objectives', 'Objectives']),
        courseCurriculum: pickString(raw, ['courseCurriculum', 'Course Curriculum']),
        faqs: pickString(raw, ['faqs', 'FAQs']),
      }
    }

    const parseBoolean = (value: string | undefined): boolean | null => {
      if (!value) return null
      const v = value.trim().toLowerCase()
      if (['true', 'yes', 'y', '1'].includes(v)) return true
      if (['false', 'no', 'n', '0'].includes(v)) return false
      return null
    }

    const parseDateTime = (raw: string): Date => {
      const value = raw.trim()
      const ymdHm = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/
      const ymdHms = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/

      let normalized = value
      if (ymdHm.test(value)) {
        normalized = value.replace(' ', 'T') + ':00'
      } else if (ymdHms.test(value)) {
        normalized = value.replace(' ', 'T')
      }

      const date = new Date(normalized)
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date format. Use YYYY-MM-DD HH:MM (e.g., 2026-03-01 09:00)')
      }
      return date
    }

    const calculateDuration = (startDate: Date, endDate: Date): string => {
      const diffMs = endDate.getTime() - startDate.getTime()
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

    for (let i = 0; i < data.length; i++) {
      const row = normalizeRow(data[i])
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
        const startDate = parseDateTime(row.dateTimeStart)
        const endDate = parseDateTime(row.dateTimeEnd)

        if (startDate >= endDate) {
          throw new Error('End date must be after start date')
        }

        // Calculate duration
        const duration = calculateDuration(startDate, endDate)

        // Parse boolean for budgeted
        const budgeted = parseBoolean(row.budgeted)
        if (budgeted === null) {
          throw new Error('Invalid budgeted value. Use Yes/No or True/False')
        }

        const sponsored = row.sponsored?.trim() || null

        const parseNumberOrNull = (value?: string): number | null => {
          if (!value) return null
          const n = Number(value)
          if (!Number.isFinite(n)) {
            throw new Error(`Invalid number: "${value}"`)
          }
          return n
        }

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
            sponsored,
            accommodationCost: parseNumberOrNull(row.accommodationCost),
            travelCost: parseNumberOrNull(row.travelCost),
            mealCost: parseNumberOrNull(row.mealCost),
            trainingMethod: row.trainingMethod.trim() as TrainingMethod,
            comment: row.comment?.trim() || null,
            objectives: row.objectives?.trim() || null,
            courseCurriculum: row.courseCurriculum?.trim() || null,
            faqs: row.faqs?.trim() || null,
            source: 'ADMIN'
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
        budgeted: 'true',
        sponsored: '',
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
        budgeted: 'false',
        sponsored: 'External Sponsor Ltd',
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
