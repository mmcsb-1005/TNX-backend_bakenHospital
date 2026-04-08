import { RequestTrainingRepository } from './RequestTraining.repository';
import { CreateRequestTrainingInput, UpdateRequestTrainingInput, ApproveRequestInput, RejectRequestInput, SubmitTrainingRequestInput } from './RequestTraining.model';
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
    // Validate training exists
    const training = await this.prisma.training.findUnique({
      where: { id: data.trainingId },
    });
    if (!training) {
      throw new Error('Training not found');
    }

    // Validate approval user exists if provided
    if (data.approvalUserId) {
      const approvalUser = await this.prisma.approvalUser.findUnique({
        where: { id: data.approvalUserId },
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

    const requestTraining = await this.requestTrainingRepository.create(data);

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
    await this.getRequestTrainingById(id);

    // Validate training exists if updating
    if (data.trainingId) {
      const training = await this.prisma.training.findUnique({
        where: { id: data.trainingId },
      });
      if (!training) {
        throw new Error('Training not found');
      }
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

    return await this.prisma.requestTraining.update({
      where: { id: data.requestId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvalNotes: data.notes || null,
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
            approvedBy: {
              include: {
                designation: true,
              },
            },
          },
        },
      },
    });
  }

  async rejectRequest(data: RejectRequestInput) {
    // Check if request training exists
    const requestTraining = await this.getRequestTrainingById(data.requestId);

    // Check if already approved or rejected
    if (requestTraining.status !== 'PENDING') {
      throw new Error(`Request is already ${requestTraining.status.toLowerCase()}`);
    }

    return await this.prisma.requestTraining.update({
      where: { id: data.requestId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        approvalNotes: data.notes || null,
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
            approvedBy: {
              include: {
                designation: true,
              },
            },
          },
        },
      },
    });
  }

  async getPendingRequestsForApprover(userId: string) {
    // Find all approval users where the user is an approver
    const approvalUsers = await this.prisma.approvalUser.findMany({
      where: {
        approvedBy: {
          some: {
            id: userId,
          },
        },
      },
    });

    if (approvalUsers.length === 0) {
      return [];
    }

    const approvalUserIds = approvalUsers.map(au => au.id);

    // Find all pending requests assigned to these approval users
    return await this.prisma.requestTraining.findMany({
      where: {
        approvalUserId: {
          in: approvalUserIds,
        },
        status: 'PENDING',
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
            approvedBy: {
              include: {
                designation: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getAllRequestsForApprover(userId: string) {
    // Find all approval users where the user is an approver
    const approvalUsers = await this.prisma.approvalUser.findMany({
      where: {
        approvedBy: {
          some: {
            id: userId,
          },
        },
      },
    });

    if (approvalUsers.length === 0) {
      return [];
    }

    const approvalUserIds = approvalUsers.map(au => au.id);

    // Find all requests assigned to these approval users (regardless of status)
    return await this.prisma.requestTraining.findMany({
      where: {
        approvalUserId: {
          in: approvalUserIds,
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
            approvedBy: {
              include: {
                designation: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
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
    return requestTrainings.sort((a, b) => {
      return new Date(b.training.dateTimeStart).getTime() - new Date(a.training.dateTimeStart).getTime();
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

    // Validate category exists if provided
    if (data.trainingData.categoryId) {
      const category = await this.prisma.trainingCategory.findUnique({
        where: { id: data.trainingData.categoryId },
      });
      if (!category) {
        throw new Error('Training category not found');
      }
    }

    // Validate approval user exists if provided
    if (data.approvalUserId) {
      const approvalUser = await this.prisma.approvalUser.findUnique({
        where: { id: data.approvalUserId },
      });
      if (!approvalUser) {
        throw new Error('Approval user not found');
      }
    }

    // Calculate duration
    const startDate = new Date(data.trainingData.dateTimeStart);
    const endDate = new Date(data.trainingData.dateTimeEnd);
    const duration = this.calculateDuration(startDate, endDate);

    // Create both Training and RequestTraining in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create Training
      const training = await tx.training.create({
        data: {
          title: data.trainingData.title,
          description: data.trainingData.description || null,
          organizer: data.trainingData.organizer,
          trainingType: data.trainingData.trainingType,
          dateTimeStart: new Date(data.trainingData.dateTimeStart),
          dateTimeEnd: new Date(data.trainingData.dateTimeEnd),
          duration: duration,
          venue: data.trainingData.venue,
          bond: data.trainingData.bond,
          typeOfPayment: data.trainingData.typeOfPayment,
          budgeted: data.trainingData.budgeted,
          trainingMethod: data.trainingData.trainingMethod,
          sponsored: data.trainingData.sponsored || null,
          accommodationCost: data.trainingData.accommodationCost || null,
          travelCost: data.trainingData.travelCost || null,
          mealCost: data.trainingData.mealCost || null,
          comment: data.trainingData.comment || null,
          categoryId: data.trainingData.categoryId || null,
        },
      });

      // Create RequestTraining
      const requestTraining = await tx.requestTraining.create({
        data: {
          requestName: data.requestName,
          trainingId: training.id,
          approvalUserId: data.approvalUserId || null,
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
    const requestApprovalType = 'REQUEST_APPROVAL' as MailType;

    const existingTemplate = await this.prisma.mail.findFirst({
      where: { mailType: requestApprovalType },
    });

    if (existingTemplate) {
      return;
    }

    await this.prisma.mail.create({
      data: {
        name: 'Request Approval Dummy Template',
        mailType: requestApprovalType,
        sendTrigger: 'MANUAL',
        subject: 'Approval Required: {{requestName}}',
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
            <h2 style="margin: 0 0 14px; color: #111827;">Training Request Needs Your Approval</h2>
            <p style="margin: 0 0 16px; color: #374151;">Hi {{approverName}}, there is a new training request waiting for your review.</p>
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; margin-bottom: 16px;">
              <p style="margin: 0 0 8px;"><strong>Request:</strong> {{requestName}}</p>
              <p style="margin: 0 0 8px;"><strong>Training:</strong> {{trainingTitle}}</p>
              <p style="margin: 0 0 8px;"><strong>Submitted By:</strong> {{submittedBy}}</p>
              <p style="margin: 0;"><strong>Submitted At:</strong> {{submittedAt}}</p>
            </div>
            <a href="{{approvalUrl}}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 14px; border-radius: 8px; font-weight: 600;">Review Request</a>
            <p style="margin-top: 18px; color: #6b7280; font-size: 12px;">This is a dummy template for delivery testing.</p>
          </div>
        `,
        templateVariables: {
          approverName: 'Name of approver',
          requestName: 'Request title',
          trainingTitle: 'Training title',
          submittedBy: 'Requester name',
          submittedAt: 'Submission datetime',
          approvalUrl: 'Approval page URL',
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
              approvedBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
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

      const approvers = request.approvalUser.approvedBy.filter((user) => !!user.email);
      if (approvers.length === 0) {
        if (options.failOnError) {
          throw new Error('No approver email found in selected approval user.');
        }
        return;
      }

      const requesterName = request.participants[0]?.name || 'Staff';
      const frontendBaseUrl = process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
      const approvalUrl = `${frontendBaseUrl.replace(/\/$/, '')}/users/approvel/view/${request.id}`;

      const formattedSubmittedAt = new Date(request.createdAt).toLocaleString('en-MY', {
        timeZone: 'Asia/Kuala_Lumpur',
      });

      const sendResults = await Promise.allSettled(
        approvers.map((approver) =>
          MailService.sendTemplateMail('REQUEST_APPROVAL' as MailType, approver.email as string, {
            approverName: approver.name || 'Approver',
            requestName: request.requestName,
            trainingTitle: request.training.title,
            submittedBy: requesterName,
            submittedAt: formattedSubmittedAt,
            approvalUrl,
          })
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
}
