import type { Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'
import prisma from '../../lib/prisma'

export class DashboardController {
  getAdminStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const role = req.user?.role
      if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        return res.status(403).json({ success: false, message: 'Forbidden' })
      }

      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

      const [
        totalUsers,
        totalTrainings,
        totalDesignations,
        pendingApprovals,
        upcomingTrainings,
        recentRequests,
        userTrainingTotal,
        userTrainingByStatus,
        recentUserTrainings,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.training.count(),
        prisma.designation.count(),
        prisma.requestTraining.count({ where: { status: 'PENDING' } }),
        prisma.training.count({
          where: {
            dateTimeStart: { gte: startOfMonth, lte: endOfMonth },
          },
        }),
        prisma.requestTraining.findMany({
          orderBy: { createdAt: 'desc' },
          take: 4,
          include: {
            submittedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            training: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        }),
        prisma.requestTraining.count({
          where: {
            submittedById: { not: null },
            proposedTrainingData: { not: Prisma.DbNull },
          },
        }),
        prisma.requestTraining.groupBy({
          by: ['status'],
          where: {
            submittedById: { not: null },
            proposedTrainingData: { not: Prisma.DbNull },
          },
          _count: { _all: true },
        }),
        prisma.requestTraining.findMany({
          where: {
            submittedById: { not: null },
            proposedTrainingData: { not: Prisma.DbNull },
          },
          orderBy: { createdAt: 'desc' },
          take: 6,
          include: {
            submittedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            training: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        }),
      ])

      const statusCounts = {
        PENDING: 0,
        APPROVED: 0,
        REJECTED: 0,
      }

      for (const row of userTrainingByStatus) {
        const status = row.status as keyof typeof statusCounts
        if (status in statusCounts) {
          statusCounts[status] = Number((row as any)?._count?._all || 0)
        }
      }

      return res.status(200).json({
        success: true,
        data: {
          totalUsers,
          totalTrainings,
          totalDesignations,
          pendingApprovals,
          upcomingTrainings,
          recentRequests: recentRequests.map((r) => ({
            id: r.id,
            status: r.status,
            createdAt: r.createdAt,
            requestName: r.requestName,
            title: (r.proposedTrainingData as any)?.title || r.training?.title || r.requestName,
            requester: r.submittedBy
              ? {
                  id: r.submittedBy.id,
                  name: r.submittedBy.name,
                  email: r.submittedBy.email,
                }
              : null,
          })),
          userTrainingSubmissions: {
            total: userTrainingTotal,
            byStatus: statusCounts,
            recent: recentUserTrainings.map((r) => ({
              id: r.id,
              status: r.status,
              createdAt: r.createdAt,
              requestName: r.requestName,
              title: (r.proposedTrainingData as any)?.title || r.training?.title || r.requestName,
              requester: r.submittedBy
                ? {
                    id: r.submittedBy.id,
                    name: r.submittedBy.name,
                    email: r.submittedBy.email,
                  }
                : null,
            })),
          },
        },
        message: 'Dashboard stats retrieved successfully',
      })
    } catch (error) {
      next(error)
    }
  }
}
