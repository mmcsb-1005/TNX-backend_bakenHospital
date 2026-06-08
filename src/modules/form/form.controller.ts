import { Request, Response } from 'express'
import { prisma } from '../../lib/prisma'

const getRequester = (req: Request): { id?: string; role?: string } | undefined => (req as any).user

const normalizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  return value.filter((x): x is string => typeof x === 'string' && x.trim() !== '').map((x) => x.trim())
}

export class FormController {
  // Get all forms
  static async getAllForms(req: Request, res: Response) {
    try {
      const { formType } = req.query
      const scope = req.query.scope as string | undefined
      const requester = getRequester(req)

      const whereClause: any = {}
      if (formType && ['EVALUATION', 'PRE_POST', 'CUSTOM'].includes(formType as string)) {
        whereClause.formType = formType
      }

      if (scope === 'my' && requester?.role === 'USER' && requester?.id) {
        const requests = await prisma.requestTraining.findMany({
          where: {
            status: 'APPROVED',
            trainingId: { not: null },
            participants: { some: { id: requester.id } },
          },
          select: { trainingId: true },
        })
        const trainingIds = requests.map((r) => r.trainingId).filter((id): id is string => typeof id === 'string')

        const trainingFilter =
          trainingIds.length > 0
            ? {
                OR: [
                  { trainingLinks: { none: {} } },
                  { trainingLinks: { some: { trainingId: { in: trainingIds } } } },
                ],
              }
            : { trainingLinks: { none: {} } }

        whereClause.AND = [...(Array.isArray(whereClause.AND) ? whereClause.AND : []), trainingFilter]
      }

      const forms = await prisma.form.findMany({
        where: whereClause,
        include: {
          fields: {
            orderBy: {
              order: 'asc'
            }
          },
          trainingLinks: {
            include: {
              training: {
                select: {
                  id: true,
                  title: true,
                  organizer: true,
                  dateTimeStart: true,
                  dateTimeEnd: true,
                },
              },
            },
          },
          _count: {
            select: {
              submissions: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      return res.status(200).json({
        success: true,
        data: forms,
        message: 'Forms retrieved successfully'
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving forms',
        error: error.message
      })
    }
  }

  // Get evaluation forms only
  static async getEvaluationForms(req: Request, res: Response) {
    try {
      const forms = await prisma.form.findMany({
        where: { formType: 'EVALUATION' },
        include: {
          fields: {
            orderBy: {
              order: 'asc'
            }
          },
          trainingLinks: {
            include: {
              training: {
                select: {
                  id: true,
                  title: true,
                  organizer: true,
                  dateTimeStart: true,
                  dateTimeEnd: true,
                },
              },
            },
          },
          _count: {
            select: {
              submissions: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      return res.status(200).json({
        success: true,
        data: forms,
        message: 'Evaluation forms retrieved successfully'
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving evaluation forms',
        error: error.message
      })
    }
  }

  // Get pre-post forms only
  static async getPrePostForms(req: Request, res: Response) {
    try {
      const forms = await prisma.form.findMany({
        where: { formType: 'PRE_POST' },
        include: {
          fields: {
            orderBy: {
              order: 'asc'
            }
          },
          trainingLinks: {
            include: {
              training: {
                select: {
                  id: true,
                  title: true,
                  organizer: true,
                  dateTimeStart: true,
                  dateTimeEnd: true,
                },
              },
            },
          },
          _count: {
            select: {
              submissions: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      return res.status(200).json({
        success: true,
        data: forms,
        message: 'Pre-post forms retrieved successfully'
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving pre-post forms',
        error: error.message
      })
    }
  }

  // Get custom forms only
  static async getCustomForms(req: Request, res: Response) {
    try {
      const forms = await prisma.form.findMany({
        where: { formType: 'CUSTOM' },
        include: {
          fields: {
            orderBy: {
              order: 'asc'
            }
          },
          trainingLinks: {
            include: {
              training: {
                select: {
                  id: true,
                  title: true,
                  organizer: true,
                  dateTimeStart: true,
                  dateTimeEnd: true,
                },
              },
            },
          },
          _count: {
            select: {
              submissions: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      return res.status(200).json({
        success: true,
        data: forms,
        message: 'Custom forms retrieved successfully'
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving custom forms',
        error: error.message
      })
    }
  }

  // Get form by ID
  static async getFormById(req: Request, res: Response) {
    try {
      const { id } = req.params
      const requester = getRequester(req)
      const form = await prisma.form.findUnique({
        where: { id: id as string },
        include: {
          fields: {
            orderBy: {
              order: 'asc'
            }
          },
          trainingLinks: {
            include: {
              training: {
                select: {
                  id: true,
                  title: true,
                  organizer: true,
                  dateTimeStart: true,
                  dateTimeEnd: true,
                },
              },
            },
          },
          _count: {
            select: {
              submissions: true
            }
          }
        }
      })

      if (!form) {
        return res.status(404).json({
          success: false,
          message: 'Form not found'
        })
      }

      if (requester?.role === 'USER' && requester?.id && Array.isArray((form as any).trainingLinks) && (form as any).trainingLinks.length > 0) {
        const linkedTrainingIds = (form as any).trainingLinks
          .map((l: any) => l?.trainingId)
          .filter((x: any): x is string => typeof x === 'string')

        const canAccess = await prisma.requestTraining.count({
          where: {
            status: 'APPROVED',
            trainingId: { in: linkedTrainingIds },
            participants: { some: { id: requester.id } },
          },
        })

        if (canAccess === 0) {
          return res.status(403).json({
            success: false,
            message: 'You do not have access to this form',
          })
        }
      }

      return res.status(200).json({
        success: true,
        data: form,
        message: 'Form retrieved successfully'
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving form',
        error: error.message
      })
    }
  }

  // Create new form
  static async createForm(req: Request, res: Response) {
    try {
      const { title, description, formType, isActive } = req.body
      const trainingIds = normalizeStringArray((req.body as any).trainingIds)

      if (trainingIds.length > 0) {
        const existing = await prisma.training.findMany({
          where: { id: { in: trainingIds } },
          select: { id: true },
        })
        if (existing.length !== trainingIds.length) {
          return res.status(400).json({
            success: false,
            message: 'One or more selected trainings were not found',
          })
        }
      }

      const form = await prisma.form.create({
        data: {
          title,
          description,
          formType: formType || 'CUSTOM',
          isActive: isActive ?? true,
          trainingLinks:
            trainingIds.length > 0
              ? {
                  createMany: {
                    data: trainingIds.map((trainingId) => ({ trainingId })),
                  },
                }
              : undefined,
        },
        include: {
          trainingLinks: {
            include: {
              training: {
                select: {
                  id: true,
                  title: true,
                  organizer: true,
                  dateTimeStart: true,
                  dateTimeEnd: true,
                },
              },
            },
          },
        },
      })

      return res.status(201).json({
        success: true,
        data: form,
        message: 'Form created successfully'
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error creating form',
        error: error.message
      })
    }
  }

  // Update form
  static async updateForm(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { title, description, formType, isActive } = req.body
      const trainingIdsRaw = (req.body as any).trainingIds
      const trainingIds = trainingIdsRaw === undefined ? undefined : normalizeStringArray(trainingIdsRaw)

      if (Array.isArray(trainingIds) && trainingIds.length > 0) {
        const existing = await prisma.training.findMany({
          where: { id: { in: trainingIds } },
          select: { id: true },
        })
        if (existing.length !== trainingIds.length) {
          return res.status(400).json({
            success: false,
            message: 'One or more selected trainings were not found',
          })
        }
      }

      const form = await prisma.$transaction(async (tx) => {
        const updated = await tx.form.update({
          where: { id: id as string },
          data: {
            title,
            description,
            formType,
            isActive,
          },
        })

        if (Array.isArray(trainingIds)) {
          await tx.formTraining.deleteMany({ where: { formId: updated.id } })
          if (trainingIds.length > 0) {
            await tx.formTraining.createMany({
              data: trainingIds.map((trainingId) => ({ formId: updated.id, trainingId })),
              skipDuplicates: true,
            })
          }
        }

        return tx.form.findUnique({
          where: { id: updated.id },
          include: {
            trainingLinks: {
              include: {
                training: {
                  select: {
                    id: true,
                    title: true,
                    organizer: true,
                    dateTimeStart: true,
                    dateTimeEnd: true,
                  },
                },
              },
            },
            fields: {
              orderBy: { order: 'asc' },
            },
            _count: { select: { submissions: true } },
          },
        })
      })

      return res.status(200).json({
        success: true,
        data: form,
        message: 'Form updated successfully'
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error updating form',
        error: error.message
      })
    }
  }

  // Delete form
  static async deleteForm(req: Request, res: Response) {
    try {
      const { id } = req.params

      await prisma.form.delete({
        where: { id: id as string }
      })

      return res.status(200).json({
        success: true,
        message: 'Form deleted successfully'
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error deleting form',
        error: error.message
      })
    }
  }

  // Toggle form active status
  static async toggleFormStatus(req: Request, res: Response) {
    try {
      const { id } = req.params

      const form = await prisma.form.findUnique({
        where: { id: id as string }
      })

      if (!form) {
        return res.status(404).json({
          success: false,
          message: 'Form not found'
        })
      }

      const updated = await prisma.form.update({
        where: { id: id as string },
        data: {
          isActive: !form.isActive
        }
      })

      return res.status(200).json({
        success: true,
        data: updated,
        message: 'Form status updated successfully'
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error updating form status',
        error: error.message
      })
    }
  }

  // Duplicate form
  static async duplicateForm(req: Request, res: Response) {
    try {
      const { id } = req.params

      const originalForm = await prisma.form.findUnique({
        where: { id: id as string },
        include: {
          fields: true,
          trainingLinks: true,
        }
      })

      if (!originalForm) {
        return res.status(404).json({
          success: false,
          message: 'Form not found'
        })
      }

      const duplicatedForm = await prisma.form.create({
        data: {
          title: `${originalForm.title} (Copy)`,
          description: originalForm.description,
          formType: originalForm.formType,
          isActive: false,
          trainingLinks: originalForm.trainingLinks.length
            ? {
                createMany: {
                  data: originalForm.trainingLinks.map((link: any) => ({
                    trainingId: link.trainingId,
                  })),
                },
              }
            : undefined,
          fields: {
            create: originalForm.fields.map((field: any) => ({
              label: field.label,
              fieldType: field.fieldType,
              placeholder: field.placeholder,
              required: field.required,
              order: field.order,
              options: field.options,
              validation: field.validation
            }))
          }
        },
        include: {
          fields: true,
          trainingLinks: {
            include: {
              training: {
                select: {
                  id: true,
                  title: true,
                  organizer: true,
                  dateTimeStart: true,
                  dateTimeEnd: true,
                },
              },
            },
          },
        }
      })

      return res.status(201).json({
        success: true,
        data: duplicatedForm,
        message: 'Form duplicated successfully'
      })
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Error duplicating form',
        error: error.message
      })
    }
  }
}
