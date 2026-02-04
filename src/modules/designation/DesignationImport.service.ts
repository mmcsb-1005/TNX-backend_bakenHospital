import { prisma } from '../../lib/prisma'

interface DesignationImportRow {
  name: string
  description?: string
  level?: string
  parentId?: string
}

interface ImportResult {
  success: boolean
  successCount: number
  failedCount: number
  errors: Array<{
    row: number
    data: DesignationImportRow
    error: string
  }>
}

export class DesignationImportService {
  /**
   * Process CSV data and import designations
   */
  static async importDesignations(data: DesignationImportRow[]): Promise<ImportResult> {
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

        // Check if designation name already exists
        const existingDesignation = await prisma.designation.findUnique({
          where: { name: row.name }
        })

        if (existingDesignation) {
          throw new Error(`Designation with name "${row.name}" already exists`)
        }

        // Validate parent designation if provided
        if (row.parentId) {
          const parentDesignation = await prisma.designation.findUnique({
            where: { id: row.parentId }
          })
          
          if (!parentDesignation) {
            throw new Error(`Parent designation with ID ${row.parentId} not found`)
          }
        }

        // Parse level (default to 1 if not provided or invalid)
        const level = row.level ? parseInt(row.level) : 1
        if (isNaN(level) || level < 1) {
          throw new Error('Level must be a positive number')
        }

        // Create designation
        await prisma.designation.create({
          data: {
            name: row.name.trim(),
            description: row.description?.trim() || null,
            level,
            parentId: row.parentId?.trim() || null
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
      'description',
      'level',
      'parentId'
    ]
  }

  /**
   * Generate sample CSV data
   */
  static getSampleData(): DesignationImportRow[] {
    return [
      {
        name: 'Chief Executive Officer',
        description: 'Top executive responsible for overall operations',
        level: '1',
        parentId: ''
      },
      {
        name: 'Chief Technology Officer',
        description: 'Head of technology department',
        level: '2',
        parentId: ''
      },
      {
        name: 'Senior Software Engineer',
        description: 'Experienced software developer',
        level: '3',
        parentId: ''
      },
      {
        name: 'Software Engineer',
        description: 'Mid-level software developer',
        level: '4',
        parentId: ''
      }
    ]
  }
}
