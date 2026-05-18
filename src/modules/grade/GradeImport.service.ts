import { prisma } from '../../lib/prisma'

type AnyRow = Record<string, any>

interface GradeImportRow {
  name: string
  description?: string
}

interface ImportResult {
  success: boolean
  successCount: number
  failedCount: number
  errors: Array<{
    row: number
    data: GradeImportRow
    error: string
  }>
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

const normalizeRow = (raw: AnyRow): GradeImportRow => {
  return {
    name: pickString(raw, ['name', 'Name']) || '',
    description: pickString(raw, ['description', 'Description']),
  }
}

export class GradeImportService {
  static async importGrades(data: AnyRow[]): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      successCount: 0,
      failedCount: 0,
      errors: [],
    }

    const existingByName = new Set<string>()
    const existing = await prisma.grade.findMany({ select: { name: true } })
    for (const g of existing) existingByName.add(g.name.toLowerCase())

    const namesInFile = new Set<string>()

    for (let i = 0; i < data.length; i++) {
      const row = normalizeRow(data[i])
      const rowNumber = i + 2

      try {
        if (!row.name) {
          throw new Error('Missing required field: name')
        }

        const name = row.name.trim()
        const nameKey = name.toLowerCase()

        if (namesInFile.has(nameKey)) {
          throw new Error(`Duplicate grade name "${name}" in CSV`)
        }
        namesInFile.add(nameKey)

        if (existingByName.has(nameKey)) {
          throw new Error(`Grade with name "${name}" already exists`)
        }

        await prisma.grade.create({
          data: {
            name,
            description: row.description?.trim() || null,
          },
        })

        result.successCount++
      } catch (error: any) {
        result.failedCount++
        result.errors.push({
          row: rowNumber,
          data: row,
          error: error?.message || 'Unknown error',
        })
      }
    }

    result.success = result.failedCount === 0
    return result
  }

  static getTemplateHeaders(): string[] {
    return ['name', 'description']
  }

  static getSampleData(): GradeImportRow[] {
    return [
      { name: 'G1', description: 'Entry level' },
      { name: 'G2', description: 'Mid level' },
      { name: 'G3', description: 'Senior level' },
    ]
  }
}

