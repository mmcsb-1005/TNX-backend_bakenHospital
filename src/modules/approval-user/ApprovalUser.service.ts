import { ApprovalUserRepository } from './ApprovalUser.repository';
import { CreateApprovalUserInput, UpdateApprovalUserInput } from './ApprovalUser.model';
import { prisma } from '../../lib/prisma';

export class ApprovalUserService {
  private approvalUserRepository: ApprovalUserRepository;
  private prisma = prisma;

  constructor() {
    this.approvalUserRepository = new ApprovalUserRepository();
  }

  private withDepartments<T extends Record<string, any>>(approvalUser: T) {
    const rows = Array.isArray((approvalUser as any)?.approvalUserDepartments)
      ? ((approvalUser as any).approvalUserDepartments as Array<{ department?: any }>)
      : []
    const departments = rows.map((r) => r.department).filter(Boolean)
    const primaryDepartment = (approvalUser as any)?.department || departments[0] || null
    const primaryDepartmentId = (approvalUser as any)?.departmentId || primaryDepartment?.id || null

    return {
      ...approvalUser,
      department: primaryDepartment,
      departmentId: primaryDepartmentId,
      departments,
    }
  }

  async createApprovalUser(data: CreateApprovalUserInput) {
    const departmentIds =
      Array.isArray(data.departmentIds) && data.departmentIds.length > 0
        ? data.departmentIds
        : data.departmentId
          ? [data.departmentId]
          : []

    if (departmentIds.length === 0) {
      throw new Error('Department is required')
    }

    const departments = await this.prisma.department.findMany({
      where: { id: { in: departmentIds } },
      select: { id: true },
    })
    if (departments.length !== departmentIds.length) {
      throw new Error('Department not found')
    }

    const levels = data.approvers.map((a) => a.level)
    const invalidLevels = levels.filter((l) => !Number.isInteger(l) || l < 1 || l > 4)
    if (invalidLevels.length > 0) {
      throw new Error('Approver level must be an integer between 1 and 4')
    }

    const seen = new Set<string>()
    for (const approver of data.approvers) {
      if (seen.has(approver.userId)) {
        throw new Error('Duplicate approver user is not allowed')
      }
      seen.add(approver.userId)
    }

    const created = await this.approvalUserRepository.create({
      ...data,
      departmentIds,
      departmentId: departmentIds[0],
    });
    return this.withDepartments(created as any)
  }

  async getApprovalUsers() {
    const list = await this.approvalUserRepository.findAll();
    return list.map((row) => this.withDepartments(row as any));
  }

  async getApprovalUserById(id: string) {
    const approvalUser = await this.approvalUserRepository.findById(id);
    if (!approvalUser) {
      throw new Error('Approval user not found');
    }
    return this.withDepartments(approvalUser as any);
  }

  async updateApprovalUser(id: string, data: UpdateApprovalUserInput) {
    // Check if approval user exists
    await this.getApprovalUserById(id);

    const departmentIds =
      Array.isArray(data.departmentIds) && data.departmentIds.length > 0
        ? data.departmentIds
        : data.departmentId
          ? [data.departmentId]
          : undefined

    if (departmentIds) {
      const departments = await this.prisma.department.findMany({
        where: { id: { in: departmentIds } },
        select: { id: true },
      })
      if (departments.length !== departmentIds.length) {
        throw new Error('Department not found')
      }
    }

    if (data.approvers) {
      const levels = data.approvers.map((a) => a.level)
      const invalidLevels = levels.filter((l) => !Number.isInteger(l) || l < 1 || l > 4)
      if (invalidLevels.length > 0) {
        throw new Error('Approver level must be an integer between 1 and 4')
      }

      const seen = new Set<string>()
      for (const approver of data.approvers) {
        if (seen.has(approver.userId)) {
          throw new Error('Duplicate approver user is not allowed')
        }
        seen.add(approver.userId)
      }
    }

    const updated = await this.approvalUserRepository.update(id, {
      ...data,
      ...(departmentIds ? { departmentIds, departmentId: departmentIds[0] } : {}),
    });
    return updated ? this.withDepartments(updated as any) : updated
  }

  async deleteApprovalUser(id: string) {
    // Check if approval user exists
    await this.getApprovalUserById(id);

    return await this.approvalUserRepository.delete(id);
  }
}
