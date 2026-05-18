import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { CreateRequestTrainingInput, UpdateRequestTrainingInput } from './RequestTraining.model';

// Shared include labels so response shape stays consistent across repository methods.
const requestTrainingInclude = {
  training: true,
  submittedBy: {
    include: {
      designation: true,
      department: true,
    },
  },
  participants: {
    include: {
      designation: true,
    },
  },
  approvalUser: {
    include: {
      department: true,
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
};

export class RequestTrainingRepository {
  private prisma = prisma;

  constructor() {
  }

  async create(data: CreateRequestTrainingInput) {
    const {
      participantIds,
      trainingId,
      proposedTrainingData,
      approvalTrail,
      approvalUserId,
      submittedById,
      ...requestData
    } = data;

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
      ...(submittedById
        ? {
            submittedBy: {
              connect: { id: submittedById },
            },
          }
        : {}),
      participants: {
        connect: participantIds.map(id => ({ id })),
      },
    };
    
    return await this.prisma.requestTraining.create({
      data: createPayload,
      include: requestTrainingInclude,
    });
  }

  async findAll() {
    return await this.prisma.requestTraining.findMany({
      include: requestTrainingInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: string) {
    return await this.prisma.requestTraining.findUnique({
      where: { id },
      include: requestTrainingInclude,
    });
  }

  async update(id: string, data: UpdateRequestTrainingInput) {
    const {
      participantIds,
      approvalUserId,
      proposedTrainingData,
      approvalTrail,
      trainingId,
      ...updateData
    } = data;

    const updatePayload: Prisma.RequestTrainingUpdateInput = {
      ...updateData,
      ...(approvalTrail !== undefined
        ? {
            approvalTrail:
              approvalTrail === null
                ? Prisma.JsonNull
                : (approvalTrail as unknown as Prisma.InputJsonValue),
          }
        : {}),
      ...(proposedTrainingData !== undefined
        ? {
            proposedTrainingData:
              proposedTrainingData === null
                ? Prisma.JsonNull
                : (proposedTrainingData as unknown as Prisma.InputJsonValue),
          }
        : {}),
      ...(trainingId !== undefined
        ? {
            training: trainingId
              ? { connect: { id: trainingId } }
              : { disconnect: true },
          }
        : {}),
    };
    
    if (participantIds) {
      updatePayload.participants = {
        set: participantIds.map(id => ({ id })),
      };
    }

    if (approvalUserId !== undefined) {
      updatePayload.approvalUser = approvalUserId
        ? { connect: { id: approvalUserId } }
        : { disconnect: true };
    }

    return await this.prisma.requestTraining.update({
      where: { id },
      data: updatePayload,
      include: requestTrainingInclude,
    });
  }

  async delete(id: string) {
    return await this.prisma.requestTraining.delete({
      where: { id },
    });
  }
}
