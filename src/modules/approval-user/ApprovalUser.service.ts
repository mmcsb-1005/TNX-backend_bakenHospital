import { ApprovalUserRepository } from './ApprovalUser.repository';
import { CreateApprovalUserInput, UpdateApprovalUserInput } from './ApprovalUser.model';
import { prisma } from '../../lib/prisma';

export class ApprovalUserService {
  private approvalUserRepository: ApprovalUserRepository;
  private prisma = prisma;

  constructor() {
    this.approvalUserRepository = new ApprovalUserRepository();
  }

  async createApprovalUser(data: CreateApprovalUserInput) {
    // Validate training category exists
    const trainingCategory = await this.prisma.trainingCategory.findUnique({
      where: { id: data.trainingCategoryId },
    });
    if (!trainingCategory) {
      throw new Error('Training category not found');
    }

    // Validate all approval users exist
    const users = await this.prisma.user.findMany({
      where: { id: { in: data.approvalUserIds } },
    });
    if (users.length !== data.approvalUserIds.length) {
      throw new Error('Some approval users not found');
    }

    return await this.approvalUserRepository.create(data);
  }

  async getApprovalUsers() {
    return await this.approvalUserRepository.findAll();
  }

  async getApprovalUserById(id: string) {
    const approvalUser = await this.approvalUserRepository.findById(id);
    if (!approvalUser) {
      throw new Error('Approval user not found');
    }
    return approvalUser;
  }

  async updateApprovalUser(id: string, data: UpdateApprovalUserInput) {
    // Check if approval user exists
    await this.getApprovalUserById(id);

    // Validate training category exists if updating
    if (data.trainingCategoryId) {
      const trainingCategory = await this.prisma.trainingCategory.findUnique({
        where: { id: data.trainingCategoryId },
      });
      if (!trainingCategory) {
        throw new Error('Training category not found');
      }
    }

    // Validate all approval users exist if updating
    if (data.approvalUserIds) {
      const users = await this.prisma.user.findMany({
        where: { id: { in: data.approvalUserIds } },
      });
      if (users.length !== data.approvalUserIds.length) {
        throw new Error('Some approval users not found');
      }
    }

    return await this.approvalUserRepository.update(id, data);
  }

  async deleteApprovalUser(id: string) {
    // Check if approval user exists
    await this.getApprovalUserById(id);

    return await this.approvalUserRepository.delete(id);
  }
}