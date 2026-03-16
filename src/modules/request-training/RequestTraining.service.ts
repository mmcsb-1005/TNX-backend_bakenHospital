import { RequestTrainingRepository } from './RequestTraining.repository';
import { CreateRequestTrainingInput, UpdateRequestTrainingInput, ApproveRequestInput, RejectRequestInput, SubmitTrainingRequestInput } from './RequestTraining.model';
import { prisma } from '../../lib/prisma';

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

    return await this.requestTrainingRepository.create(data);
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

    return result;
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
