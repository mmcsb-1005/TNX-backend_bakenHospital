import { Request, Response, NextFunction } from 'express'

// Validation schemas using simple validation functions
export class FormValidation {
  static validateCreateForm(req: Request, res: Response, next: NextFunction) {
    const { title } = req.body

    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      })
    }

    if (req.body.formType && !['EVALUATION', 'PRE_POST', 'CUSTOM'].includes(req.body.formType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid form type. Must be EVALUATION, PRE_POST, or CUSTOM'
      })
    }

    next()
  }

  static validateEvaluationForm(req: Request, res: Response, next: NextFunction) {
    const { title, formType } = req.body

    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      })
    }

    // Auto-set formType to EVALUATION
    req.body.formType = 'EVALUATION'

    next()
  }

  static validatePrePostForm(req: Request, res: Response, next: NextFunction) {
    const { title, formType } = req.body

    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      })
    }

    // Auto-set formType to PRE_POST
    req.body.formType = 'PRE_POST'

    next()
  }

  static validateCustomForm(req: Request, res: Response, next: NextFunction) {
    const { title, formType } = req.body

    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      })
    }

    // Auto-set formType to CUSTOM
    req.body.formType = 'CUSTOM'

    next()
  }

  static validateUpdateForm(req: Request, res: Response, next: NextFunction) {
    const { title, formType } = req.body

    if (title !== undefined && title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Title cannot be empty'
      })
    }

    if (formType && !['EVALUATION', 'PRE_POST', 'CUSTOM'].includes(formType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid form type. Must be EVALUATION, PRE_POST, or CUSTOM'
      })
    }

    next()
  }

  static validateAddField(req: Request, res: Response, next: NextFunction) {
    const { label, fieldType } = req.body

    if (!label || label.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Field label is required'
      })
    }

    const validFieldTypes = [
      'TEXT',
      'TEXTAREA',
      'NUMBER',
      'EMAIL',
      'DATE',
      'SELECT',
      'RADIO',
      'CHECKBOX',
      'FILE',
      'RATING',
      'HEADER',
      'PARAGRAPH'
    ]

    if (!fieldType || !validFieldTypes.includes(fieldType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid field type. Must be one of: ${validFieldTypes.join(', ')}`
      })
    }

    // Validate options for SELECT, RADIO, CHECKBOX
    if (['SELECT', 'RADIO', 'CHECKBOX'].includes(fieldType)) {
      if (!req.body.options || !Array.isArray(req.body.options) || req.body.options.length === 0) {
        return res.status(400).json({
          success: false,
          message: `Options array is required for ${fieldType} field type`
        })
      }
    }

    next()
  }

  static validateReorderFields(req: Request, res: Response, next: NextFunction) {
    const { fieldOrders } = req.body

    if (!fieldOrders || !Array.isArray(fieldOrders)) {
      return res.status(400).json({
        success: false,
        message: 'fieldOrders must be an array'
      })
    }

    for (const item of fieldOrders) {
      if (!item.fieldId || typeof item.order !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'Each item must have fieldId and order properties'
        })
      }
    }

    next()
  }

  static validateSubmitForm(req: Request, res: Response, next: NextFunction) {
    const { responses } = req.body

    if (!responses || typeof responses !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'responses object is required'
      })
    }

    next()
  }
}
