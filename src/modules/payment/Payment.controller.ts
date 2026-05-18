import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { PaymentClaimStatus, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { getPublicUrlForObject, uploadObject } from '../../lib/supabaseAdmin';

export class PaymentController {
  private getAuthenticatedUserId(req: Request) {
    return req.user?.id || null;
  }

  private isAdmin(req: Request) {
    return req.user?.role === 'ADMIN';
  }

  uploadReceipt = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'No file uploaded' });
        return;
      }

      const extension = req.file.originalname.includes('.')
        ? `.${req.file.originalname.split('.').pop()}`
        : '';

      const objectPath = `receipts/${uuidv4()}${extension}`;

      await uploadObject({
        objectPath,
        body: req.file.buffer,
        contentType: req.file.mimetype,
      });

      res.status(200).json({
        success: true,
        data: {
          receiptPath: getPublicUrlForObject(objectPath),
          receiptOriginalName: req.file.originalname,
          filename: objectPath,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getClaims = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isAdmin = this.isAdmin(req);
      const userId = this.getAuthenticatedUserId(req);
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const statusQuery = typeof req.query.status === 'string' ? req.query.status.trim().toUpperCase() : '';
      const statusFilter =
        statusQuery && statusQuery !== 'ALL' && Object.values(PaymentClaimStatus).includes(statusQuery as PaymentClaimStatus)
          ? (statusQuery as PaymentClaimStatus)
          : null;

      const claims = await prisma.paymentClaim.findMany({
        where: {
          ...(isAdmin ? {} : { userId }),
          ...(statusFilter ? { paymentStatus: statusFilter } : {}),
        },
        include: {
          user: { select: { id: true, name: true, email: true, userOrgId: true } },
          training: {
            select: {
              id: true,
              title: true,
              organizer: true,
              dateTimeStart: true,
              dateTimeEnd: true,
              venue: true,
              typeOfPayment: true,
              budgeted: true,
              sponsored: true,
              trainingCost: true,
              accommodationCost: true,
              travelCost: true,
              mealCost: true,
              trainingMethod: true,
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
      });

      res.status(200).json({ success: true, data: claims });
    } catch (error) {
      next(error);
    }
  };

  getSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!this.isAdmin(req)) {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
      }

      const grouped = await prisma.paymentClaim.groupBy({
        by: ['paymentStatus'],
        _count: { _all: true },
        _sum: { amountClaimed: true, amountApproved: true },
      });

      const find = (status: PaymentClaimStatus) => grouped.find((g) => g.paymentStatus === status);
      const totalClaims = grouped.reduce((sum, g) => sum + (g._count?._all || 0), 0);
      const pendingClaims = find(PaymentClaimStatus.PENDING)?._count?._all || 0;
      const verifiedClaims = find(PaymentClaimStatus.VERIFIED)?._count?._all || 0;
      const rejectedClaims = find(PaymentClaimStatus.REJECTED)?._count?._all || 0;
      const paidClaims = find(PaymentClaimStatus.PAID)?._count?._all || 0;

      const toNumber = (value: unknown) => {
        if (!value) return 0;
        if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
        if (typeof value === 'string') {
          const n = Number(value);
          return Number.isFinite(n) ? n : 0;
        }
        return 0;
      };

      const totalClaimedAmount = grouped.reduce((sum, g) => sum + toNumber(g._sum?.amountClaimed), 0);
      const totalApprovedAmount = grouped.reduce((sum, g) => sum + toNumber(g._sum?.amountApproved), 0);
      const totalPaidAmount = find(PaymentClaimStatus.PAID)?._sum?.amountApproved
        ? toNumber(find(PaymentClaimStatus.PAID)!._sum!.amountApproved)
        : 0;

      const outstandingAmount = totalApprovedAmount - totalPaidAmount;

      res.status(200).json({
        success: true,
        data: {
          totalClaims,
          pendingClaims,
          verifiedClaims,
          rejectedClaims,
          paidClaims,
          totalClaimedAmount,
          totalApprovedAmount,
          totalPaidAmount,
          outstandingAmount,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getMyClaims = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = this.getAuthenticatedUserId(req);
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const claims = await prisma.paymentClaim.findMany({
        where: { userId },
        include: {
          training: {
            select: {
              id: true,
              title: true,
              organizer: true,
              dateTimeStart: true,
              dateTimeEnd: true,
              venue: true,
              typeOfPayment: true,
              budgeted: true,
              sponsored: true,
              trainingCost: true,
              accommodationCost: true,
              travelCost: true,
              mealCost: true,
              trainingMethod: true,
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
      });

      res.status(200).json({ success: true, data: claims });
    } catch (error) {
      next(error);
    }
  };

  getMyClaimForTraining = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = this.getAuthenticatedUserId(req);
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const trainingIdParam = req.params.trainingId;
      const trainingId = Array.isArray(trainingIdParam) ? trainingIdParam[0] : trainingIdParam;
      if (!trainingId) {
        res.status(400).json({ success: false, message: 'Training ID is required' });
        return;
      }

      const training = await prisma.training.findUnique({
        where: { id: trainingId },
        select: { id: true, trainingMethod: true },
      });

      if (!training) {
        res.status(404).json({ success: false, message: 'Training not found' });
        return;
      }

      const claim = await prisma.paymentClaim.findUnique({
        where: { trainingId_userId: { trainingId, userId } },
        include: {
          user: { select: { id: true, name: true, email: true } },
          training: {
            select: {
              id: true,
              title: true,
              organizer: true,
              dateTimeStart: true,
              dateTimeEnd: true,
              venue: true,
              typeOfPayment: true,
              budgeted: true,
              sponsored: true,
              trainingCost: true,
              accommodationCost: true,
              travelCost: true,
              mealCost: true,
              trainingMethod: true,
            },
          },
        },
      });

      const eligible = training.trainingMethod === 'PAY_AND_CLAIM';

      res.status(200).json({
        success: true,
        data: {
          eligible,
          claim,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  createClaim = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authUserId = this.getAuthenticatedUserId(req);
      if (!authUserId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const isAdmin = this.isAdmin(req);
      const body = req.body as Record<string, unknown>;
      const trainingId = typeof body.trainingId === 'string' ? body.trainingId : '';
      const userId = isAdmin && typeof body.userId === 'string' ? body.userId : authUserId;

      if (!trainingId) {
        res.status(400).json({ success: false, message: 'Training ID is required' });
        return;
      }

      const amountClaimedRaw = body.amountClaimed;
      const amountClaimed = typeof amountClaimedRaw === 'number' ? amountClaimedRaw : Number(amountClaimedRaw);
      if (!Number.isFinite(amountClaimed) || amountClaimed < 0) {
        res.status(400).json({ success: false, message: 'Amount claimed must be a valid number' });
        return;
      }

      const training = await prisma.training.findUnique({ where: { id: trainingId }, select: { id: true } });
      if (!training) {
        res.status(404).json({ success: false, message: 'Training not found' });
        return;
      }

      const existing = await prisma.paymentClaim.findUnique({
        where: { trainingId_userId: { trainingId, userId } },
        select: { id: true, paymentStatus: true },
      });

      if (existing?.paymentStatus === PaymentClaimStatus.PAID) {
        res.status(400).json({ success: false, message: 'Claim is already marked as paid' });
        return;
      }

      const receiptPath = typeof body.receiptPath === 'string' ? body.receiptPath : null;
      const receiptOriginalName = typeof body.receiptOriginalName === 'string' ? body.receiptOriginalName : null;
      const notes = typeof body.notes === 'string' ? body.notes : null;

      const claim = await prisma.paymentClaim.upsert({
        where: { trainingId_userId: { trainingId, userId } },
        create: {
          trainingId,
          userId,
          amountClaimed: new Prisma.Decimal(String(amountClaimed)),
          amountApproved: null,
          paymentStatus: PaymentClaimStatus.PENDING,
          receiptPath,
          receiptOriginalName,
          notes,
          adminRemarks: null,
          verifiedById: null,
          submittedAt: new Date(),
          verifiedAt: null,
          paidAt: null,
        },
        update: {
          amountClaimed: new Prisma.Decimal(String(amountClaimed)),
          amountApproved: null,
          paymentStatus: PaymentClaimStatus.PENDING,
          receiptPath,
          receiptOriginalName,
          notes,
          adminRemarks: null,
          verifiedById: null,
          submittedAt: new Date(),
          verifiedAt: null,
          paidAt: null,
        },
        include: {
          user: { select: { id: true, name: true, email: true, userOrgId: true } },
          training: {
            select: {
              id: true,
              title: true,
              organizer: true,
              dateTimeStart: true,
              dateTimeEnd: true,
              venue: true,
              typeOfPayment: true,
              budgeted: true,
              sponsored: true,
              trainingCost: true,
              accommodationCost: true,
              travelCost: true,
              mealCost: true,
              trainingMethod: true,
            },
          },
        },
      });

      res.status(201).json({ success: true, data: claim });
    } catch (error) {
      next(error);
    }
  };

  updateClaimStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!this.isAdmin(req)) {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
      }

      const idParam = req.params.id;
      const id = Array.isArray(idParam) ? idParam[0] : idParam;
      const body = req.body as Record<string, unknown>;
      const status = typeof body.paymentStatus === 'string' ? body.paymentStatus.toUpperCase() : '';
      if (!Object.values(PaymentClaimStatus).includes(status as PaymentClaimStatus)) {
        res.status(400).json({ success: false, message: 'Invalid payment status' });
        return;
      }

      const claim = await prisma.paymentClaim.update({
        where: { id },
        data: { paymentStatus: status as PaymentClaimStatus },
        include: {
          user: { select: { id: true, name: true, email: true, userOrgId: true } },
          training: {
            select: {
              id: true,
              title: true,
              organizer: true,
              dateTimeStart: true,
              dateTimeEnd: true,
              venue: true,
              typeOfPayment: true,
              budgeted: true,
              sponsored: true,
              trainingCost: true,
              accommodationCost: true,
              travelCost: true,
              mealCost: true,
              trainingMethod: true,
            },
          },
        },
      });

      res.status(200).json({ success: true, data: claim });
    } catch (error) {
      next(error);
    }
  };

  verifyClaim = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!this.isAdmin(req)) {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
      }

      const idParam = req.params.id;
      const id = Array.isArray(idParam) ? idParam[0] : idParam;
      const body = req.body as Record<string, unknown>;
      const amountApprovedRaw = body.amountApproved;
      const amountApproved =
        amountApprovedRaw === undefined || amountApprovedRaw === null
          ? null
          : typeof amountApprovedRaw === 'number'
            ? amountApprovedRaw
            : Number(amountApprovedRaw);

      if (amountApproved !== null && (!Number.isFinite(amountApproved) || amountApproved < 0)) {
        res.status(400).json({ success: false, message: 'Amount approved must be a valid number' });
        return;
      }

      const adminRemarks = typeof body.adminRemarks === 'string' ? body.adminRemarks : null;
      const verifiedById = this.getAuthenticatedUserId(req);
      if (!verifiedById) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const claim = await prisma.paymentClaim.update({
        where: { id },
        data: {
          paymentStatus: PaymentClaimStatus.VERIFIED,
          amountApproved: amountApproved === null ? undefined : new Prisma.Decimal(String(amountApproved)),
          adminRemarks,
          verifiedById,
          verifiedAt: new Date(),
        },
        include: {
          user: { select: { id: true, name: true, email: true, userOrgId: true } },
          training: {
            select: {
              id: true,
              title: true,
              organizer: true,
              dateTimeStart: true,
              dateTimeEnd: true,
              venue: true,
              typeOfPayment: true,
              budgeted: true,
              sponsored: true,
              trainingCost: true,
              accommodationCost: true,
              travelCost: true,
              mealCost: true,
              trainingMethod: true,
            },
          },
        },
      });

      res.status(200).json({ success: true, data: claim });
    } catch (error) {
      next(error);
    }
  };

  rejectClaim = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!this.isAdmin(req)) {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
      }

      const idParam = req.params.id;
      const id = Array.isArray(idParam) ? idParam[0] : idParam;
      const body = req.body as Record<string, unknown>;
      const adminRemarks = typeof body.adminRemarks === 'string' ? body.adminRemarks : null;
      const verifiedById = this.getAuthenticatedUserId(req);
      if (!verifiedById) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const claim = await prisma.paymentClaim.update({
        where: { id },
        data: {
          paymentStatus: PaymentClaimStatus.REJECTED,
          adminRemarks,
          verifiedById,
          verifiedAt: new Date(),
        },
        include: {
          user: { select: { id: true, name: true, email: true, userOrgId: true } },
          training: {
            select: {
              id: true,
              title: true,
              organizer: true,
              dateTimeStart: true,
              dateTimeEnd: true,
              venue: true,
              typeOfPayment: true,
              budgeted: true,
              sponsored: true,
              trainingCost: true,
              accommodationCost: true,
              travelCost: true,
              mealCost: true,
              trainingMethod: true,
            },
          },
        },
      });

      res.status(200).json({ success: true, data: claim });
    } catch (error) {
      next(error);
    }
  };

  markPaid = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!this.isAdmin(req)) {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
      }

      const idParam = req.params.id;
      const id = Array.isArray(idParam) ? idParam[0] : idParam;

      const claim = await prisma.paymentClaim.update({
        where: { id },
        data: {
          paymentStatus: PaymentClaimStatus.PAID,
          paidAt: new Date(),
        },
        include: {
          user: { select: { id: true, name: true, email: true, userOrgId: true } },
          training: {
            select: {
              id: true,
              title: true,
              organizer: true,
              dateTimeStart: true,
              dateTimeEnd: true,
              venue: true,
              typeOfPayment: true,
              budgeted: true,
              sponsored: true,
              trainingCost: true,
              accommodationCost: true,
              travelCost: true,
              mealCost: true,
              trainingMethod: true,
            },
          },
        },
      });

      res.status(200).json({ success: true, data: claim });
    } catch (error) {
      next(error);
    }
  };
}
