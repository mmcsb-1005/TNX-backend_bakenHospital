import { prisma } from '../../lib/prisma';
import { CreateApprovalUserInput, UpdateApprovalUserInput } from './ApprovalUser.model';

export class ApprovalUserRepository {
  private prisma = prisma;

  constructor() {
  }

  async create(data: CreateApprovalUserInput) {
    const { approvalUserIds, ...approvalData } = data;
    
    return await this.prisma.approvalUser.create({
      data: {
        ...approvalData,
        approvalUsers: {
          connect: approvalUserIds.map(id => ({ id })),
        },
      },
      include: {
        trainingCategory: true,
        approvalUsers: {
          include: {
            designation: true,
          },
        },
      },
    });
  }

  async findAll() {
    return await this.prisma.approvalUser.findMany({
      include: {
        trainingCategory: true,
        approvalUsers: {
          include: {
            designation: true,
          },
        },
        _count: {
          select: {
            approvalUsers: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: string) {
    return await this.prisma.approvalUser.findUnique({
      where: { id },
      include: {
        trainingCategory: true,
        approvalUsers: {
          include: {
            designation: true,
          },
        },
      },
    });
  }

  async update(id: string, data: UpdateApprovalUserInput) {
    const { approvalUserIds, ...updateData } = data;
    
    const updatePayload: any = { ...updateData };
    
    if (approvalUserIds) {
      updatePayload.approvalUsers = {
        set: approvalUserIds.map(id => ({ id })),
      };
    }

    return await this.prisma.approvalUser.update({
      where: { id },
      data: updatePayload,
      include: {
        trainingCategory: true,
        approvalUsers: {
          include: {
            designation: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    return await this.prisma.approvalUser.delete({
      where: { id },
    });
  }
}