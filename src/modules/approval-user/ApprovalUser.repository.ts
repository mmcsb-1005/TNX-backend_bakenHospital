import { prisma } from '../../lib/prisma';
import { CreateApprovalUserInput, UpdateApprovalUserInput } from './ApprovalUser.model';

export class ApprovalUserRepository {
  private prisma = prisma;

  constructor() {
  }

  async create(data: CreateApprovalUserInput) {
    const { approvers, ...approvalData } = data;
    
    return await this.prisma.approvalUser.create({
      data: {
        ...approvalData,
        approvers: {
          create: approvers.map((approver) => ({
            level: approver.level,
            user: { connect: { id: approver.userId } },
          })),
        },
      },
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
          orderBy: [{ level: 'asc' }],
        },
      },
    });
  }

  async findAll() {
    return await this.prisma.approvalUser.findMany({
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
          orderBy: [{ level: 'asc' }],
        },
        _count: {
          select: {
            approvers: true,
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
    });
  }

  async update(id: string, data: UpdateApprovalUserInput) {
    const { approvers, ...updateData } = data;

    return await this.prisma.$transaction(async (tx) => {
      const updated = await tx.approvalUser.update({
        where: { id },
        data: updateData,
      });

      if (approvers) {
        await tx.approvalUserApprover.deleteMany({
          where: { approvalUserId: id },
        });

        if (approvers.length > 0) {
          await tx.approvalUserApprover.createMany({
            data: approvers.map((a) => ({
              approvalUserId: id,
              userId: a.userId,
              level: a.level,
            })),
          });
        }
      }

      return tx.approvalUser.findUnique({
        where: { id: updated.id },
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
            orderBy: [{ level: 'asc' }],
          },
        },
      });
    });
  }

  async delete(id: string) {
    return await this.prisma.approvalUser.delete({
      where: { id },
    });
  }
}
