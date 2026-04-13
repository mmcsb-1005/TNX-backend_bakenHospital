import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { CreateRequestTrainingInput, UpdateRequestTrainingInput } from './RequestTraining.model';

export class RequestTrainingRepository {
  private prisma = prisma;

  constructor() {
  }

  async create(data: CreateRequestTrainingInput) {
    const { participantIds, trainingId, proposedTrainingData, approvalTrail, approvalUserId, ...requestData } = data;

    const createPayload: Prisma.RequestTrainingCreateInput = {
      ...requestData,
      ...(approvalTrail !== undefined
        ? {
            approvalTrail:
              approvalTrail === null
                ? Prisma.JsonNull
                : (approvalTrail as unknown as Prisma.InputJsonValue),
          }
        : {}),
      ...(proposedTrainingData
        ? { proposedTrainingData: proposedTrainingData as unknown as Prisma.InputJsonValue }
        : {}),
      ...(approvalUserId
        ? {
            approvalUser: {
              connect: { id: approvalUserId },
            },
          }
        : {}),
      ...(trainingId
        ? {
            training: {
              connect: { id: trainingId },
            },
          }
        : {}),
      participants: {
        connect: participantIds.map(id => ({ id })),
      },
    };
    
    return await this.prisma.requestTraining.create({
      data: createPayload,
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

  async findAll() {
    return await this.prisma.requestTraining.findMany({
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

  async findById(id: string) {
    return await this.prisma.requestTraining.findUnique({
      where: { id },
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

  async update(id: string, data: UpdateRequestTrainingInput) {
    const { participantIds, ...updateData } = data;
    
    const updatePayload: any = { ...updateData };
    
    if (participantIds) {
      updatePayload.participants = {
        set: participantIds.map(id => ({ id })),
      };
    }

    if (Object.prototype.hasOwnProperty.call(updateData, 'approvalUserId')) {
      const approvalUserId = updateData.approvalUserId;
      delete updatePayload.approvalUserId;
      updatePayload.approvalUser = approvalUserId
        ? { connect: { id: approvalUserId } }
        : { disconnect: true };
    }

    return await this.prisma.requestTraining.update({
      where: { id },
      data: updatePayload,
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

  async delete(id: string) {
    return await this.prisma.requestTraining.delete({
      where: { id },
    });
  }
}