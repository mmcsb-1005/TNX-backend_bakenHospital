import { UserRole } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { hashPasswordIfNeeded } from '../../utils/password'

type AnyRow = Record<string, any>

interface UserImportRow {
  name: string
  email: string
  designation?: string
  grade?: string
  contactNumber?: string
  employmentDate?: string
  role?: string
  userOrgId?: string
  password?: string
}

interface ImportResult {
  success: boolean
  successCount: number
  failedCount: number
  errors: Array<{
    row: number
    data: UserImportRow
    error: string
  }>
}

export class UserImportService {
  /**
   * Process CSV data and import users
   */
  static async importUsers(data: AnyRow[]): Promise<ImportResult> {
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

    const normalizeRow = (raw: AnyRow): UserImportRow => {
      return {
        name: pickString(raw, ['name', 'Name']) || '',
        email: pickString(raw, ['email', 'Email']) || '',
        designation: pickString(raw, ['designation', 'Designation', 'position', 'Position']),
        grade: pickString(raw, ['grade', 'Grade', 'gradeTitle', 'Grade Title', 'gradeName', 'Grade Name']),
        contactNumber: pickString(raw, ['contactNumber', 'Contact Number', 'contact', 'Contact']),
        employmentDate: pickString(raw, ['employmentDate', 'Employment Date']),
        role: pickString(raw, ['role', 'Role']),
        userOrgId: pickString(raw, ['userOrgId', 'User Org ID', 'Staff ID', 'staffId', 'StaffId']),
        password: pickString(raw, ['password', 'Password']),
      }
    }

    for (let i = 0; i < data.length; i++) {
      const row = normalizeRow(data[i])
      const rowNumber = i + 2 // +2 because row 1 is header, and array is 0-indexed

      try {
        // Validate required fields
        const requiredFields = ['name', 'email']

        const missingFields = requiredFields.filter(field => !row[field as keyof UserImportRow])
        
        if (missingFields.length > 0) {
          throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(row.email)) {
          throw new Error('Invalid email format')
        }

        // Validate role if provided
        const validRoles = ['ADMIN', 'USER']
        const role = row.role?.toUpperCase() || 'USER'
        if (!validRoles.includes(role)) {
          throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`)
        }

        // Find designation by name if provided
        let designationId: string | null = null
        const designationName = row.designation?.trim()
        if (designationName) {
          const designation = await prisma.designation.findUnique({
            where: { name: designationName }
          })
          
          if (!designation) {
            throw new Error(`Designation "${designationName}" not found`)
          }
          designationId = designation.id
        }

        // Resolve grade by name if provided
        let gradeId: string | null = null
        const gradeName = row.grade?.trim()
        if (gradeName) {
          const grade = await prisma.grade.upsert({
            where: { name: gradeName },
            create: { name: gradeName },
            update: {},
          })
          gradeId = grade.id
        }

        // Parse employment date if provided
        let employmentDate: Date | undefined
        if (row.employmentDate) {
          employmentDate = new Date(row.employmentDate)
          if (isNaN(employmentDate.getTime())) {
            throw new Error('Invalid employment date format. Use YYYY-MM-DD format')
          }
        }

        // Hash password if provided, otherwise use default
        const password = row.password ? await hashPasswordIfNeeded(row.password) : await hashPasswordIfNeeded('password123')

        // Create user
        await prisma.user.create({
          data: {
            name: row.name.trim(),
            email: row.email.trim().toLowerCase(),
            position: designationName || null,
            designationId: designationId,
            gradeId,
            contactNumber: row.contactNumber?.trim() || null,
            employmentDate: employmentDate || null,
            role: role as UserRole,
            userOrgId: row.userOrgId?.trim() || null,
            password
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
      'email',
      'designation',
      'grade',
      'contactNumber',
      'employmentDate',
      'role',
      'userOrgId',
      'password'
    ]
  }

  /**
   * Generate sample CSV data
   */
  static getSampleData(): UserImportRow[] {
    return [
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        designation: 'Software Engineer',
        grade: 'G6',
        contactNumber: '0123456789',
        employmentDate: '2026-01-15',
        role: 'USER',
        userOrgId: 'EMP001',
        password: 'password123'
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        designation: 'HR Manager',
        grade: 'G7',
        contactNumber: '0129876543',
        employmentDate: '2025-12-01',
        role: 'USER',
        userOrgId: 'EMP002',
        password: 'password123'
      }
    ]
  }
}
