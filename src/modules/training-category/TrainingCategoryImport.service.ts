import { prisma } from '../../lib/prisma'

interface TrainingCategoryImportRow {
  name: string
  description?: string
}

interface ImportResult {
  success: boolean
  successCount: number
  failedCount: number
  errors: Array<{
    row: number
    data: TrainingCategoryImportRow
    error: string
  }>
}

export class TrainingCategoryImportService {
  /**
   * Process CSV data and import training categories
   */
  static async importTrainingCategories(data: TrainingCategoryImportRow[]): Promise<ImportResult> {
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
        if (!row.name) {
          throw new Error('Missing required field: name')
        }

        // Check if category name already exists
        const existingCategory = await prisma.trainingCategory.findUnique({
          where: { name: row.name }
        })

        if (existingCategory) {
          throw new Error(`Training category with name "${row.name}" already exists`)
        }

        // Create training category
        await prisma.trainingCategory.create({
          data: {
            name: row.name.trim(),
            description: row.description?.trim() || null
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
      'name',
      'description'
    ]
  }

  /**
   * Generate sample CSV data
   */
  static getSampleData(): TrainingCategoryImportRow[] {
    return [
      {
        name: 'Technical Skills',
        description: 'Training programs focused on technical competencies and tools'
      },
      {
        name: 'Leadership Development',
        description: 'Programs designed to enhance leadership and management skills'
      },
      {
        name: 'Communication',
        description: 'Training on effective communication and presentation skills'
      },
      {
        name: 'Compliance & Safety',
        description: 'Mandatory compliance, safety, and regulatory training'
      }
    ]
  }
}
