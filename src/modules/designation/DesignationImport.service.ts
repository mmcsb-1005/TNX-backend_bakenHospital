import { prisma } from '../../lib/prisma'

type AnyRow = Record<string, any>

interface DesignationImportRow {
  name: string
  description?: string
  parentId?: string
  parentName?: string
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

const pickString = (row: AnyRow, keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = row?.[key]
    if (value === undefined || value === null) continue
    const str = String(value).trim()
    if (str.length > 0) return str
  }
  return undefined
}

const normalizeRow = (raw: AnyRow): DesignationImportRow => {
  return {
    name: pickString(raw, ['name', 'Name']) || '',
    description: pickString(raw, ['description', 'Description']),
    parentId: pickString(raw, ['parentId', 'Parent ID', 'Parent Id', 'ParentID']),
    parentName: pickString(raw, ['parentName', 'Parent Designation', 'Parent Name', 'parent', 'Parent']),
  }
}

export class DesignationImportService {
  /**
   * Process CSV data and import designations
   */
  static async importDesignations(data: AnyRow[]): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      successCount: 0,
      failedCount: 0,
      errors: []
    }

    const existingByName = new Map<string, string>()
    const existing = await prisma.designation.findMany({
      select: { id: true, name: true },
    })
    for (const d of existing) {
      existingByName.set(d.name.toLowerCase(), d.id)
    }

    const createdByName = new Map<string, string>()
    const rowState: Array<{
      rowNumber: number
      row: DesignationImportRow
      createdId?: string
      error?: string
    }> = []

    const namesInFile = new Set<string>()

    for (let i = 0; i < data.length; i++) {
      const row = normalizeRow(data[i])
      const rowNumber = i + 2
      const state = { rowNumber, row } as (typeof rowState)[number]
      rowState.push(state)

      try {
        // Validate required fields
        if (!row.name) {
          throw new Error('Missing required field: name')
        }

        const name = row.name.trim()
        const nameKey = name.toLowerCase()
        if (namesInFile.has(nameKey)) {
          throw new Error(`Duplicate designation name "${name}" in CSV`)
        }
        namesInFile.add(nameKey)

        if (existingByName.has(nameKey)) {
          throw new Error(`Designation with name "${row.name}" already exists`)
        }

        const created = await prisma.designation.create({
          data: {
            name,
            description: row.description?.trim() || null,
            parentId: null
          }
        })

        state.createdId = created.id
        createdByName.set(nameKey, created.id)
      } catch (error: any) {
        state.error = error.message || 'Unknown error'
      }
    }

    for (const state of rowState) {
      if (!state.createdId || state.error) continue

      const row = state.row
      const nameKey = row.name.trim().toLowerCase()
      const createdId = state.createdId

      const parentIdRaw = row.parentId?.trim()
      const parentNameRaw = row.parentName?.trim()

      if (!parentIdRaw && !parentNameRaw) continue

      try {
        if (parentIdRaw && parentIdRaw === createdId) {
          throw new Error('Parent designation cannot be itself')
        }

        let resolvedParentId: string | null = null

        if (parentIdRaw) {
          resolvedParentId = createdByName.get(parentIdRaw.toLowerCase()) || parentIdRaw
          const parentExists = await prisma.designation.findUnique({ where: { id: resolvedParentId } })
          if (!parentExists) {
            throw new Error(`Parent designation with ID ${parentIdRaw} not found`)
          }
        } else if (parentNameRaw) {
          const key = parentNameRaw.toLowerCase()
          resolvedParentId = createdByName.get(key) || existingByName.get(key) || null
          if (!resolvedParentId) {
            throw new Error(`Parent designation with name "${parentNameRaw}" not found`)
          }
          if (resolvedParentId === createdId) {
            throw new Error('Parent designation cannot be itself')
          }
        }

        await prisma.designation.update({
          where: { id: createdId },
          data: { parentId: resolvedParentId },
        })
      } catch (error: any) {
        try {
          await prisma.designation.delete({ where: { id: createdId } })
          createdByName.delete(nameKey)
        } catch {
        }
        state.createdId = undefined
        state.error = error.message || 'Unknown error'
      }
    }

    for (const state of rowState) {
      if (state.createdId && !state.error) {
        result.successCount++
      } else if (state.error) {
        result.failedCount++
        result.errors.push({
          row: state.rowNumber,
          data: state.row,
          error: state.error,
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
      'parentName'
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
        parentName: ''
      },
      {
        name: 'Chief Technology Officer',
        description: 'Head of technology department',
        parentName: 'Chief Executive Officer'
      },
      {
        name: 'Senior Software Engineer',
        description: 'Experienced software developer',
        parentName: 'Chief Technology Officer'
      },
      {
        name: 'Software Engineer',
        description: 'Mid-level software developer',
        parentName: 'Senior Software Engineer'
      }
    ]
  }
}
