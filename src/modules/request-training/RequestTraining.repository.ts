import { prisma } from '../../lib/prisma';
import { CreateRequestTrainingInput, UpdateRequestTrainingInput } from './RequestTraining.model';

export class RequestTrainingRepository {
  private prisma = prisma;

  constructor() {
  }

  async create(data: CreateRequestTrainingInput) {
    const { participantIds, ...requestData } = data;
    
    return await this.prisma.requestTraining.create({
      data: {
        ...requestData,
        participants: {
          connect: participantIds.map(id => ({ id })),
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