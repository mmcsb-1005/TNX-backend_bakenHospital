import { Router } from 'express'
import { FormController } from './form.controller'
import { FormFieldController } from './form-field.controller'
import { FormSubmissionController } from './form-submission.controller'
import { FormValidation } from './form.validation'
import { authMiddleware } from '../../middleware/auth.middleware'

const router = Router()

// Form routes - General
router.get('/forms', authMiddleware, FormController.getAllForms)
router.get('/forms/:id', authMiddleware, FormController.getFormById)
router.post('/forms', authMiddleware, FormValidation.validateCreateForm, FormController.createForm)
router.put('/forms/:id', authMiddleware, FormValidation.validateUpdateForm, FormController.updateForm)
router.delete('/forms/:id', authMiddleware, FormController.deleteForm)
router.patch('/forms/:id/toggle', authMiddleware, FormController.toggleFormStatus)
router.post('/forms/:id/duplicate', authMiddleware, FormController.duplicateForm)

// Form routes - Type-specific (for better organization)
router.get('/forms/type/evaluation', authMiddleware, FormController.getEvaluationForms)
router.get('/forms/type/pre-post', authMiddleware, FormController.getPrePostForms)
router.get('/forms/type/custom', authMiddleware, FormController.getCustomForms)

// Form field routes
router.post('/forms/:id/fields', authMiddleware, FormValidation.validateAddField, FormFieldController.addField)
router.put('/forms/:id/fields/:fieldId', authMiddleware, FormFieldController.updateField)
router.delete('/forms/:id/fields/:fieldId', authMiddleware, FormFieldController.deleteField)
router.patch('/forms/:id/fields/reorder', authMiddleware, FormValidation.validateReorderFields, FormFieldController.reorderFields)

// Form submission routes
router.post('/forms/:id/submit', FormValidation.validateSubmitForm, FormSubmissionController.submitForm) // Public endpoint
router.get('/forms/:id/submissions', authMiddleware, FormSubmissionController.getFormSubmissions)
router.get('/submissions/:id', authMiddleware, FormSubmissionController.getSubmissionById)
router.delete('/submissions/:id', authMiddleware, FormSubmissionController.deleteSubmission)
router.get('/forms/:id/export', authMiddleware, FormSubmissionController.exportSubmissions)

export default router
