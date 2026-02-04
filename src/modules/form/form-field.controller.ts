import { Request, Response } from 'express'
import { prisma } from '../../lib/prisma'

export class FormFieldController {
  // Add field to form
  static async addField(req: Request, res: Response) {
    try {
      const { id: formId } = req.params
      const { label, fieldType, placeholder, required, options, validation } = req.body

      // Get current max order
      const maxOrder = await prisma.formField.findFirst({
        where: { formId: formId as string },
        orderBy: { order: 'desc' },
        select: { order: true }
      })

      const field = await prisma.formField.create({
        data: {
          formId: formId as string,
          label,
          fieldType,
          placeholder,
          required: required ?? false,
          order: (maxOrder?.order ?? -1) + 1,
          options,
          validation
        }
      })

      return res.status(201).json({
        success: true,
        data: field,
        message: 'Field added successfully'
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error adding field',
        error: error.message
      })
    }
  }

  // Update field
  static async updateField(req: Request, res: Response) {
    try {
      const { id: formId, fieldId } = req.params
      const { label, fieldType, placeholder, required, options, validation } = req.body

      const field = await prisma.formField.update({
        where: { 
          id: fieldId as string,
          formId: formId as string
        },
        data: {
          label,
          fieldType,
          placeholder,
          required,
          options,
          validation
        }
      })

      return res.status(200).json({
        success: true,
        data: field,
        message: 'Field updated successfully'
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error updating field',
        error: error.message
      })
    }
  }

  // Delete field
  static async deleteField(req: Request, res: Response) {
    try {
      const { id: formId, fieldId } = req.params

      await prisma.formField.delete({
        where: { 
          id: fieldId as string,
          formId: formId as string
        }
      })

      return res.status(200).json({
        success: true,
        message: 'Field deleted successfully'
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error deleting field',
        error: error.message
      })
    }
  }

  // Reorder fields (for drag & drop)
  static async reorderFields(req: Request, res: Response) {
    try {
      const { id: formId } = req.params
      const { fieldOrders } = req.body // [{fieldId: "xxx", order: 0}, {fieldId: "yyy", order: 1}]

      if (!Array.isArray(fieldOrders)) {
        return res.status(400).json({
          success: false,
          message: 'fieldOrders must be an array'
        })
      }

      // Update all fields in a transaction
      await prisma.$transaction(
        fieldOrders.map((item) =>
          prisma.formField.update({
            where: { 
              id: item.fieldId,
              formId: formId as string
            },
            data: { order: item.order }
          })
        )
      )

      return res.status(200).json({
        success: true,
        message: 'Fields reordered successfully'
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error reordering fields',
        error: error.message
      })
    }
  }
}
