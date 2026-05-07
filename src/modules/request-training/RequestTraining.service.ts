import { RequestTrainingRepository } from './RequestTraining.repository';
import {
  CreateRequestTrainingInput,
  UpdateRequestTrainingInput,
  ApproveRequestInput,
  RejectRequestInput,
  SubmitTrainingRequestInput,
  ProposedTrainingData,
  ApprovalTrailItem,
} from './RequestTraining.model';
import { prisma } from '../../lib/prisma';
import { MailService } from '../mail/Mail.service';
import { MailType, Prisma } from '@prisma/client';

export class RequestTrainingService {
  private requestTrainingRepository: RequestTrainingRepository;
  private prisma = prisma;

  constructor() {
    this.requestTrainingRepository = new RequestTrainingRepository();
  }

  async createRequestTraining(data: CreateRequestTrainingInput) {
    let resolvedApprovalUserId = data.approvalUserId;
    let currentApprovalLevel: number | null = null;
    let trainingCategoryId: string | undefined;

    // Validate training exists
    if (data.trainingId) {
      const training = await this.prisma.training.findUnique({
        where: { id: data.trainingId },
        select: {
          id: true,
          categoryId: true,
        },
      });
      if (!training) {
        throw new Error('Training not found');
      }

      if (training.categoryId) {
        trainingCategoryId = training.categoryId;
      }
    }

    if (data.proposedTrainingData) {
      await this.validateProposedTrainingData(data.proposedTrainingData);

      const resolvedApprovalContext = await this.resolveApprovalWorkflowContext({
        approvalUserId: data.approvalUserId,
        categoryId: data.proposedTrainingData.categoryId,
      });

      resolvedApprovalUserId = resolvedApprovalContext.approvalUser.id;
      currentApprovalLevel = resolvedApprovalContext.levels[0] || null;
    }

    if (!resolvedApprovalUserId) {
      const resolvedApprovalContext = await this.resolveApprovalWorkflowContext({
        approvalUserId: data.approvalUserId,
        categoryId: trainingCategoryId,
      });

      resolvedApprovalUserId = resolvedApprovalContext.approvalUser.id;
      currentApprovalLevel = resolvedApprovalContext.levels[0] || null;
    }

    if (resolvedApprovalUserId && currentApprovalLevel === null) {
      const resolvedApprovalContext = await this.resolveApprovalWorkflowContext({
        approvalUserId: resolvedApprovalUserId,
        categoryId: trainingCategoryId,
      });

      resolvedApprovalUserId = resolvedApprovalContext.approvalUser.id;
      currentApprovalLevel = resolvedApprovalContext.levels[0] || null;
    }

    // Validate approval user exists if provided
    if (resolvedApprovalUserId) {
      const approvalUser = await this.prisma.approvalUser.findUnique({
        where: { id: resolvedApprovalUserId },
      });
      if (!approvalUser) {
        throw new Error('Approval user not found');
      }
    }

    // Validate all participants exist
    const participants = await this.prisma.user.findMany({
      where: { id: { in: data.participantIds } },
    });
    if (participants.length !== data.participantIds.length) {
      throw new Error('Some participants not found');
    }

    const requestTraining = await this.requestTrainingRepository.create({
      ...data,
      approvalUserId: resolvedApprovalUserId,
      ...(currentApprovalLevel !== null ? { currentApprovalLevel } : {}),
    });

    await this.notifyApproversForRequest(requestTraining.id);

    return requestTraining;
  }

  async getRequestTrainings() {
    return await this.requestTrainingRepository.findAll();
  }

  async getRequestTrainingById(id: string) {
    const requestTraining = await this.requestTrainingRepository.findById(id);
    if (!requestTraining) {
      throw new Error('Request training not found');
    }
    return requestTraining;
  }

  async updateRequestTraining(id: string, data: UpdateRequestTrainingInput) {
    // Check if request training exists
    const existingRequest = await this.getRequestTrainingById(id);

    if ((data.requestName || data.requestJustification || data.proposedTrainingData) && existingRequest.status !== 'PENDING') {
      throw new Error('Only pending requests can be updated');
    }

    // Validate training exists if updating
    if (data.trainingId) {
      const training = await this.prisma.training.findUnique({
        where: { id: data.trainingId },
      });
      if (!training) {
        throw new Error('Training not found');
      }
    }

    if (data.proposedTrainingData) {
      await this.validateProposedTrainingData(data.proposedTrainingData);
    }

    // Validate approval user exists if updating
    if (data.approvalUserId) {
      const approvalUser = await this.prisma.approvalUser.findUnique({
        where: { id: data.approvalUserId },
      });
      if (!approvalUser) {
        throw new Error('Approval user not found');
      }
    }

    // Validate all participants exist if updating
    if (data.participantIds) {
      const participants = await this.prisma.user.findMany({
        where: { id: { in: data.participantIds } },
      });
      if (participants.length !== data.participantIds.length) {
        throw new Error('Some participants not found');
      }
    }

    return await this.requestTrainingRepository.update(id, data);
  }

  async deleteRequestTraining(id: string) {
    // Check if request training exists
    await this.getRequestTrainingById(id);

    return await this.requestTrainingRepository.delete(id);
  }

  async approveRequest(data: ApproveRequestInput) {
    // Check if request training exists
    const requestTraining = await this.getRequestTrainingById(data.requestId);

    // Check if already approved or rejected
    if (requestTraining.status !== 'PENDING') {
      throw new Error(`Request is already ${requestTraining.status.toLowerCase()}`);
    }

    const approvalContext = await this.getApprovalContextForRequest(requestTraining.id);
    const approverUser = approvalContext.currentApprovers.find((approver) => approver.id === data.actorUserId);

    if (!approverUser) {
      throw new Error('You are not authorized to approve this request at the current level');
    }

    const updatedRequest = await this.prisma.$transaction(async (tx) => {
      let trainingId = requestTraining.trainingId || null;

      const existingTrail = this.normalizeApprovalTrail(requestTraining.approvalTrail);
      const hasAlreadyActedAtLevel = existingTrail.some(
        (item) =>
          item.level === approvalContext.currentLevel &&
          item.actorUserId === approverUser.id &&
          (item.action === 'APPROVED' || item.action === 'REJECTED')
      );

      if (hasAlreadyActedAtLevel) {
        throw new Error('You have already taken action for this approval level');
      }

      const nextTrail: ApprovalTrailItem[] = [
        ...existingTrail,
        {
          level: approvalContext.currentLevel,
          actorUserId: approverUser.id,
          actorName: approverUser.name || 'Approver',
          action: 'APPROVED',
          notes: data.notes || null,
          actedAt: new Date().toISOString(),
        },
      ];

      const approvedIdsAtCurrentLevel = new Set(
        nextTrail
          .filter((item) => item.level === approvalContext.currentLevel && item.action === 'APPROVED')
          .map((item) => item.actorUserId)
      );

      const allApproversApprovedAtCurrentLevel = approvalContext.currentApprovers.every((approver) =>
        approvedIdsAtCurrentLevel.has(approver.id)
      );

      if (!allApproversApprovedAtCurrentLevel) {
        return tx.requestTraining.update({
          where: { id: data.requestId },
          data: {
            currentApprovalLevel: approvalContext.currentLevel,
            approvalNotes: data.notes || null,
            approvalTrail: nextTrail as unknown as Prisma.InputJsonValue,
          },
          include: {
            training: {
              include: {
                category: true,
              },
            },
            participants: {
              include: {
                designation: true,
              },
            },
            approvalUser: {
              include: {
                trainingCategory: true,
                approvers: {
                  include: {
                    user: {
                      include: {
                        designation: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });
      }

      const nextLevel = approvalContext.remainingLevels.find((level) => level > approvalContext.currentLevel) || null;

      if (nextLevel !== null) {
        const stagedRequest = await tx.requestTraining.update({
          where: { id: data.requestId },
          data: {
            currentApprovalLevel: nextLevel,
            approvalNotes: data.notes || null,
            approvalTrail: nextTrail as unknown as Prisma.InputJsonValue,
          },
          include: {
            training: {
              include: {
                category: true,
              },
            },
            participants: {
              include: {
                designation: true,
              },
            },
            approvalUser: {
              include: {
                trainingCategory: true,
                approvers: {
                  include: {
                    user: {
                      include: {
                        designation: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });
        return stagedRequest;
      }

      if (!trainingId) {
        const proposedTrainingData = this.normalizeProposedTrainingData(requestTraining.proposedTrainingData);

        if (!proposedTrainingData) {
          throw new Error('Proposed training data not found for this request');
        }

        await this.validateProposedTrainingData(proposedTrainingData, tx);

        const createdTraining = await tx.training.create({
          data: this.buildTrainingCreateInput(proposedTrainingData, 'ADMIN'),
        });

        trainingId = createdTraining.id;
      }

      return tx.requestTraining.update({
        where: { id: data.requestId },
        data: {
          trainingId,
          status: 'APPROVED',
          approvedAt: new Date(),
          rejectedAt: null,
          currentApprovalLevel: null,
          approvalNotes: data.notes || null,
          approvalTrail: nextTrail as unknown as Prisma.InputJsonValue,
        },
        include: {
          training: {
            include: {
              category: true,
            },
          },
          participants: {
            include: {
              designation: true,
            },
          },
          approvalUser: {
            include: {
              trainingCategory: true,
              approvers: {
                include: {
                  user: {
                    include: {
                      designation: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    });

    if (updatedRequest.status === 'PENDING' && updatedRequest.currentApprovalLevel !== approvalContext.currentLevel) {
      await this.notifyApproversForRequest(updatedRequest.id);
    }

    return updatedRequest;
  }

  async rejectRequest(data: RejectRequestInput) {
    // Check if request training exists
    const requestTraining = await this.getRequestTrainingById(data.requestId);

    // Check if already approved or rejected
    if (requestTraining.status !== 'PENDING') {
      throw new Error(`Request is already ${requestTraining.status.toLowerCase()}`);
    }

    const approvalContext = await this.getApprovalContextForRequest(requestTraining.id);
    const approverUser = approvalContext.currentApprovers.find((approver) => approver.id === data.actorUserId);

    if (!approverUser) {
      throw new Error('You are not authorized to reject this request at the current level');
    }

    const existingTrail = this.normalizeApprovalTrail(requestTraining.approvalTrail);
    const nextTrail: ApprovalTrailItem[] = [
      ...existingTrail,
      {
        level: approvalContext.currentLevel,
        actorUserId: approverUser.id,
        actorName: approverUser.name || 'Approver',
        action: 'REJECTED',
        notes: data.notes || null,
        actedAt: new Date().toISOString(),
      },
    ];

    return await this.prisma.requestTraining.update({
      where: { id: data.requestId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        currentApprovalLevel: null,
        approvalNotes: data.notes || null,
        approvalTrail: nextTrail as unknown as Prisma.InputJsonValue,
      },
      include: {
        training: {
          include: {
            category: true,
          },
        },
        participants: {
          include: {
            designation: true,
          },
        },
        approvalUser: {
          include: {
            trainingCategory: true,
            approvers: {
              include: {
                user: {
                  include: {
                    designation: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async getPendingRequestsForApprover(userId: string) {
    const assignments = await this.prisma.approvalUserApprover.findMany({
      where: { userId },
      select: { approvalUserId: true, level: true },
    });

    if (assignments.length === 0) {
      return [];
    }

    const pendingRequests = await this.prisma.requestTraining.findMany({
      where: {
        status: 'PENDING',
        OR: assignments.map((a) => ({
          approvalUserId: a.approvalUserId,
          currentApprovalLevel: a.level,
        })),
      },
      include: {
        training: {
          include: {
            category: true,
          },
        },
        participants: {
          include: {
            designation: true,
          },
        },
        approvalUser: {
          include: {
            trainingCategory: true,
            approvers: {
              include: {
                user: {
                  include: {
                    designation: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return pendingRequests.filter((request) => {
      const currentLevel = request.currentApprovalLevel;
      if (typeof currentLevel !== 'number') return true;
      const trail = this.normalizeApprovalTrail(request.approvalTrail as unknown as Prisma.JsonValue);
      return !trail.some(
        (item) =>
          item.level === currentLevel &&
          item.actorUserId === userId &&
          (item.action === 'APPROVED' || item.action === 'REJECTED')
      );
    });
  }

  async getAllRequestsForApprover(userId: string) {
    const assignments = await this.prisma.approvalUserApprover.findMany({
      where: { userId },
      select: { approvalUserId: true, level: true },
    });

    if (assignments.length === 0) {
      return [];
    }

    const assignedApprovalUserIds = Array.from(new Set(assignments.map((a) => a.approvalUserId)));

    // Find all requests assigned to these approval users (regardless of status)
    const allRequests = await this.prisma.requestTraining.findMany({
      where: {
        approvalUserId: {
          in: assignedApprovalUserIds,
        },
      },
      include: {
        training: {
          include: {
            category: true,
          },
        },
        participants: {
          include: {
            designation: true,
          },
        },
        approvalUser: {
          include: {
            trainingCategory: true,
            approvers: {
              include: {
                user: {
                  include: {
                    designation: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return allRequests.filter((request) => {
      if (request.status !== 'PENDING') {
        return true;
      }

      const currentLevel = request.currentApprovalLevel;
      if (typeof currentLevel !== 'number') {
        return true;
      }

      const isAssignedAtLevel = assignments.some(
        (a) => a.approvalUserId === request.approvalUserId && a.level === currentLevel
      );
      if (!isAssignedAtLevel) {
        return false;
      }

      const trail = this.normalizeApprovalTrail(request.approvalTrail as unknown as Prisma.JsonValue);
      return !trail.some(
        (item) =>
          item.level === currentLevel &&
          item.actorUserId === userId &&
          (item.action === 'APPROVED' || item.action === 'REJECTED')
      );
    });
  }

  async getMyTrainings(userId: string) {
    // Get all approved request trainings where user is a participant
    const requestTrainings = await this.prisma.requestTraining.findMany({
      where: {
        participants: {
          some: {
            id: userId,
          },
        },
        status: 'APPROVED', // Only show approved trainings
        trainingId: {
          not: null,
        },
      },
      include: {
        training: {
          include: {
            category: true,
          },
        },
        participants: {
          include: {
            designation: true,
          },
        },
        approvalUser: {
          include: {
            trainingCategory: true,
          },
        },
      },
    });

    // Sort by training date in memory instead of in database
    return requestTrainings
      .filter((requestTraining) => !!requestTraining.training)
      .sort((a, b) => {
      return new Date(b.training!.dateTimeStart).getTime() - new Date(a.training!.dateTimeStart).getTime();
      });
  }

  async getMyRequests(userId: string) {
    return await this.prisma.requestTraining.findMany({
      where: {
        participants: {
          some: {
            id: userId,
          },
        },
      },
      include: {
        training: {
          include: {
            category: true,
          },
        },
        participants: {
          include: {
            designation: true,
          },
        },
        approvalUser: {
          include: {
            trainingCategory: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Information Approver - Get combined data of approval user and request training
  async getInformationApprover() {
    return await this.prisma.requestTraining.findMany({
      select: {
        id: true,
        requestName: true,
        status: true,
        createdAt: true,
        approvalUser: {
          select: {
            id: true,
            title: true,
          },
        },
        training: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async submitTrainingRequest(data: SubmitTrainingRequestInput) {
    // Validate user exists
    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
    });
    if (!user) {
      throw new Error('User not found');
    }

    await this.validateProposedTrainingData(data.trainingData);

    const resolvedApprovalContext = await this.resolveApprovalWorkflowContext({
      approvalUserId: data.approvalUserId,
      categoryId: data.trainingData.categoryId,
    });

    const result = await this.prisma.$transaction(async (tx) => {
      const requestTraining = await tx.requestTraining.create({
        data: {
          requestName: data.requestName,
          requestJustification: data.trainingData.comment || null,
          proposedTrainingData: data.trainingData as unknown as Prisma.InputJsonValue,
          approvalUserId: resolvedApprovalContext.approvalUser.id,
          currentApprovalLevel: resolvedApprovalContext.levels[0] || null,
          status: 'PENDING',
          participants: {
            connect: [{ id: data.userId }],
          },
        },
        include: {
          training: {
            include: {
              category: true,
            },
          },
          participants: {
            include: {
              designation: true,
            },
          },
          approvalUser: {
            include: {
              trainingCategory: true,
            },
          },
        },
      });

      return requestTraining;
    });

    await this.notifyApproversForRequest(result.id);

    return result;
  }

  async sendNotification(requestId: string) {
    await this.getRequestTrainingById(requestId);
    await this.notifyApproversForRequest(requestId, { failOnError: true });
  }

  private async ensureRequestApprovalTemplate(): Promise<void> {
    const requestApprovalType = MailType.REQUEST_APPROVAL;

    const existingTemplate = await this.prisma.mail.findFirst({
      where: { mailType: requestApprovalType },
    });

    if (existingTemplate) {
      return;
    }

    await this.prisma.mail.create({
      data: {
        name: 'Request Approval Notification Template',
        mailType: requestApprovalType,
        sendTrigger: 'MANUAL',
        subject: '{{emailTitle}}',
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
            <h2 style="margin: 0 0 14px; color: #111827;">Training Request Needs Your Approval</h2>
            <p style="margin: 0 0 16px; color: #374151;">{{intro}}</p>
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; margin-bottom: 16px;">
              <p style="margin: 0 0 8px;"><strong>Approval Stage:</strong> {{levelLabel}}</p>
              <p style="margin: 0 0 8px;"><strong>Request:</strong> {{requestName}}</p>
              <p style="margin: 0 0 8px;"><strong>Training:</strong> {{trainingTitle}}</p>
              <p style="margin: 0 0 8px;"><strong>Submitted By:</strong> {{submittedBy}}</p>
              <p style="margin: 0;"><strong>Submitted At:</strong> {{submittedAt}}</p>
            </div>
            <a href="{{approvalUrl}}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 14px; border-radius: 8px; font-weight: 600;">{{ctaText}}</a>
            <p style="margin-top: 18px; color: #6b7280; font-size: 12px;">This is an automated notification from the training system.</p>
          </div>
        `,
        templateVariables: {
          approverName: 'Name of approver',
          requestName: 'Request title',
          trainingTitle: 'Training title',
          submittedBy: 'Requester name',
          submittedAt: 'Submission datetime',
          approvalUrl: 'Approval page URL',
          levelLabel: 'Approval level label',
          mailKind: 'NOTIFICATION or ACTION_REQUIRED',
          emailTitle: 'Email subject/title',
          intro: 'Intro message',
          ctaText: 'CTA button label',
        } as Prisma.InputJsonValue,
        isActive: true,
      },
    });
  }

  private async notifyApproversForRequest(
    requestId: string,
    options: { failOnError?: boolean } = {}
  ): Promise<void> {
    try {
      await this.ensureRequestApprovalTemplate();

      const request = await this.prisma.requestTraining.findUnique({
        where: { id: requestId },
        include: {
          training: true,
          participants: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          approvalUser: {
            include: {
              approvers: {
                select: {
                  level: true,
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
                orderBy: [{ level: 'asc' }],
              },
            },
          },
        },
      });

      if (!request || !request.approvalUser) {
        if (options.failOnError) {
          throw new Error('No approval user configured for this request.');
        }
        return;
      }

      const approverAssignments = request.approvalUser.approvers.filter((a) => !!a.user.email);
      const levels = Array.from(new Set(approverAssignments.map((a) => a.level))).sort((a, b) => a - b);
      const currentLevel = request.currentApprovalLevel ?? levels[0] ?? null;
      const approversAtCurrentLevel = approverAssignments
        .filter((a) => a.level === currentLevel)
        .map((a) => a.user);

      const trail = this.normalizeApprovalTrail(request.approvalTrail as unknown as Prisma.JsonValue);
      const actedIdsAtCurrentLevel = new Set(
        trail
          .filter(
            (item) =>
              item.level === currentLevel &&
              (item.action === 'APPROVED' || item.action === 'REJECTED')
          )
          .map((item) => item.actorUserId)
      );

      const approversToNotify = approversAtCurrentLevel.filter(
        (user) => !actedIdsAtCurrentLevel.has(user.id)
      );

      if (approversToNotify.length === 0) {
        if (options.failOnError) {
          throw new Error('No approver email found for the current approval level.');
        }
        return;
      }

      const requesterName = request.participants[0]?.name || 'Staff';
      const frontendBaseUrl = process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
      const approvalUrl = `${frontendBaseUrl.replace(/\/$/, '')}/users/approvel/view/${request.id}`;
      const proposedTrainingData = this.normalizeProposedTrainingData(request.proposedTrainingData);
      const trainingTitle = request.training?.title || proposedTrainingData?.title || request.requestName;
      const levelLabel = currentLevel ? `Level ${currentLevel}` : 'Current level';

      const formattedSubmittedAt = new Date(request.createdAt).toLocaleString('en-MY', {
        timeZone: 'Asia/Kuala_Lumpur',
      });

      const sendResults = await Promise.allSettled(
        approversToNotify.map(async (approver) => {
          const basePayload = {
            approverName: approver.name || 'Approver',
            requestName: request.requestName,
            trainingTitle,
            submittedBy: requesterName,
            submittedAt: formattedSubmittedAt,
            approvalUrl,
            levelLabel,
          };

          const notificationTitle = `New Request Notification (${levelLabel}): ${request.requestName}`;
          const notificationIntro = `Hi ${basePayload.approverName}, a new training request has entered ${levelLabel.toLowerCase()} for your visibility.`;

          await MailService.sendTemplateMail(MailType.REQUEST_APPROVAL, approver.email as string, {
            ...basePayload,
            mailKind: 'NOTIFICATION',
            emailTitle: notificationTitle,
            intro: notificationIntro,
            ctaText: 'View Request Details',
          });

          const actionTitle = `Action Required (${levelLabel}): ${request.requestName}`;
          const actionIntro = `Hi ${basePayload.approverName}, please review and ${levelLabel.toLowerCase()} approve or reject this training request.`;

          return MailService.sendTemplateMail(MailType.REQUEST_APPROVAL, approver.email as string, {
            ...basePayload,
            mailKind: 'ACTION_REQUIRED',
            emailTitle: actionTitle,
            intro: actionIntro,
            ctaText: 'Approve / Reject Request',
          });
        }
        )
      );

      if (options.failOnError) {
        const failedCount = sendResults.filter((result) => result.status === 'rejected').length;
        if (failedCount === sendResults.length) {
          throw new Error('Failed to send approval notification emails. Please check SMTP settings and recipient addresses.');
        }
      }
    } catch (error) {
      if (options.failOnError) {
        throw error;
      }

      // Do not block request creation when email delivery fails.
      console.error('Failed to send training approval notifications:', error);
    }
  }

  private calculateDuration(startDate: Date, endDate: Date): string {
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffDays > 0) {
      if (diffHours > 0) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
      }
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      if (diffMinutes > 0) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
      }
      return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    }
  }

  private normalizeProposedTrainingData(value: Prisma.JsonValue | null | undefined): ProposedTrainingData | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    return value as unknown as ProposedTrainingData;
  }

  private normalizeApprovalTrail(value: Prisma.JsonValue | null | undefined): ApprovalTrailItem[] {
    if (!value || !Array.isArray(value)) {
      return [];
    }

    return value as unknown as ApprovalTrailItem[];
  }

  private extractApprovalLevels(approvers: Array<{ level: number }>): number[] {
    return Array.from(
      new Set(
        approvers
          .map((approver) => approver.level)
          .filter((level): level is number => typeof level === 'number')
      )
    ).sort((a, b) => a - b);
  }

  private async resolveApprovalWorkflowContext(params: { approvalUserId?: string; categoryId?: string }) {
    const approvalUser = await this.prisma.approvalUser.findFirst({
      where: params.approvalUserId
        ? { id: params.approvalUserId }
        : params.categoryId
          ? { trainingCategoryId: params.categoryId }
          : undefined,
      include: {
        approvers: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })
      ?? await this.prisma.approvalUser.findFirst({
        include: {
          approvers: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

    if (!approvalUser) {
      throw new Error('No approval workflow is configured. Please configure approval users first.');
    }

    const levels = this.extractApprovalLevels(approvalUser.approvers);
    if (levels.length === 0) {
      throw new Error('No approver levels configured for the selected approval workflow.');
    }

    return {
      approvalUser,
      levels,
    };
  }

  private async getApprovalContextForRequest(requestId: string) {
    const request = await this.prisma.requestTraining.findUnique({
      where: { id: requestId },
      include: {
        approvalUser: {
          include: {
            approvers: {
              include: {
                user: {
                  include: {
                    designation: true,
                  },
                },
              },
              orderBy: [{ level: 'asc' }],
            },
          },
        },
      },
    });

    if (!request || !request.approvalUser) {
      throw new Error('No approval workflow configured for this request');
    }

    const levels = this.extractApprovalLevels(request.approvalUser.approvers);
    const currentLevel = request.currentApprovalLevel ?? levels[0];

    if (!currentLevel) {
      throw new Error('No current approval level found for this request');
    }

    const currentApprovers = request.approvalUser.approvers
      .filter((a) => a.level === currentLevel)
      .map((a) => a.user);

    return {
      currentLevel,
      currentApprovers,
      remainingLevels: levels,
    };
  }

  private async validateProposedTrainingData(data: ProposedTrainingData, tx: Prisma.TransactionClient | typeof prisma = this.prisma) {
    const startDate = new Date(data.dateTimeStart);
    const endDate = new Date(data.dateTimeEnd);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new Error('Invalid training schedule provided');
    }

    if (endDate <= startDate) {
      throw new Error('Training end date must be after the start date');
    }

    if (data.categoryId) {
      const category = await tx.trainingCategory.findUnique({
        where: { id: data.categoryId },
      });

      if (!category) {
        throw new Error('Training category not found');
      }
    }
  }

  private buildTrainingCreateInput(data: ProposedTrainingData, source: 'ADMIN' | 'USER_REQUEST'): Prisma.TrainingUncheckedCreateInput {
    const startDate = new Date(data.dateTimeStart);
    const endDate = new Date(data.dateTimeEnd);

    return {
      title: data.title,
      description: data.description || null,
      organizer: data.organizer,
      trainingType: data.trainingType,
      dateTimeStart: startDate,
      dateTimeEnd: endDate,
      duration: this.calculateDuration(startDate, endDate),
      venue: data.venue,
      bond: data.bond,
      typeOfPayment: data.typeOfPayment,
      budgeted: data.budgeted,
      trainingMethod: data.trainingMethod,
      sponsored: data.sponsored || null,
      accommodationCost: data.accommodationCost || null,
      travelCost: data.travelCost || null,
      mealCost: data.mealCost || null,
      comment: data.comment || null,
      categoryId: data.categoryId || null,
      source,
    };
  }
}
