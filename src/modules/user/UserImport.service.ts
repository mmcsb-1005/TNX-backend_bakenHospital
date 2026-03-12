import { UserRole } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { hashPasswordIfNeeded } from '../../utils/password'

interface UserImportRow {
  name: string
  email: string
  position?: string
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
  static async importUsers(data: UserImportRow[]): Promise<ImportResult> {
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

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: row.email }
        })

        if (existingUser) {
          throw new Error(`Email ${row.email} already exists`)
        }

        // Validate role if provided
        const validRoles = ['ADMIN', 'USER']
        const role = row.role?.toUpperCase() || 'USER'
        if (!validRoles.includes(role)) {
          throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`)
        }

        // Find designation by position name if provided
        let designationId: string | null = null
        if (row.position) {
          const designation = await prisma.designation.findUnique({
            where: { name: row.position.trim() }
          })
          
          if (designation) {
            designationId = designation.id
          }
          // Note: If designation not found, we still create the user with position but no designationId
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
            position: row.position?.trim() || null,
            designationId: designationId,
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
      'position',
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
        position: 'Software Engineer',
        contactNumber: '0123456789',
        employmentDate: '2026-01-15',
        role: 'USER',
        userOrgId: 'EMP001',
        password: 'password123'
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        position: 'HR Manager',
        contactNumber: '0129876543',
        employmentDate: '2025-12-01',
        role: 'USER',
        userOrgId: 'EMP002',
        password: 'password123'
      }
    ]
  }
}
