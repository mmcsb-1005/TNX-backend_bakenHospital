import { prisma } from '../../lib/prisma';
import { CreateApprovalUserInput, UpdateApprovalUserInput } from './ApprovalUser.model';

export class ApprovalUserRepository {
  private prisma = prisma;

  constructor() {
  }

  async create(data: CreateApprovalUserInput) {
    const { approvers, departmentIds, departmentId, ...approvalData } = data;
    const resolvedDepartmentIds =
      Array.isArray(departmentIds) && departmentIds.length > 0
        ? departmentIds
        : departmentId
          ? [departmentId]
          : [];
    
    return await this.prisma.approvalUser.create({
      data: {
        ...approvalData,
        ...(resolvedDepartmentIds[0] ? { departmentId: resolvedDepartmentIds[0] } : {}),
        ...(resolvedDepartmentIds.length > 0
          ? {
              approvalUserDepartments: {
                create: resolvedDepartmentIds.map((id) => ({
                  departmentId: id,
                })),
              },
            }
          : {}),
        approvers: {
          create: approvers.map((approver) => ({
            level: approver.level,
            user: { connect: { id: approver.userId } },
          })),
        },
      },
      include: {
        department: true,
        approvalUserDepartments: {
          include: {
            department: true,
          },
          orderBy: [{ departmentId: 'asc' }],
        },
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
        department: true,
        approvalUserDepartments: {
          include: {
            department: true,
          },
          orderBy: [{ departmentId: 'asc' }],
        },
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
        department: true,
        approvalUserDepartments: {
          include: {
            department: true,
          },
          orderBy: [{ departmentId: 'asc' }],
        },
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
    const { approvers, departmentIds, departmentId, ...updateData } = data;
    const resolvedDepartmentIds =
      Array.isArray(departmentIds) && departmentIds.length > 0
        ? departmentIds
        : departmentId
          ? [departmentId]
          : undefined;

    return await this.prisma.$transaction(async (tx) => {
      const updated = await tx.approvalUser.update({
        where: { id },
        data: {
          ...updateData,
          ...(resolvedDepartmentIds ? { departmentId: resolvedDepartmentIds[0] } : {}),
        },
      });

      if (resolvedDepartmentIds) {
        await tx.approvalUserDepartment.deleteMany({
          where: { approvalUserId: id },
        });

        if (resolvedDepartmentIds.length > 0) {
          await tx.approvalUserDepartment.createMany({
            data: resolvedDepartmentIds.map((dId) => ({
              approvalUserId: id,
              departmentId: dId,
            })),
          });
        }
      }

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
          department: true,
          approvalUserDepartments: {
            include: {
              department: true,
            },
            orderBy: [{ departmentId: 'asc' }],
          },
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
