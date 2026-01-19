import { prisma } from '../../lib/prisma';
import { CreateTrainingCategoryInput, UpdateTrainingCategoryInput } from './TrainingCategory.model';

export class TrainingCategoryRepository {
  private prisma = prisma;

  constructor() {
  }

  async create(data: CreateTrainingCategoryInput) {
    return await this.prisma.trainingCategory.create({
      data,
      include: {
        trainings: true,
        approvals: true,
      },
    });
  }

  async findAll() {
    return await this.prisma.trainingCategory.findMany({
      include: {
        trainings: true,
        approvals: true,
        _count: {
          select: {
            trainings: true,
            approvals: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findById(id: string) {
    return await this.prisma.trainingCategory.findUnique({
      where: { id },
      include: {
        trainings: true,
        approvals: true,
      },
    });
  }

  async update(id: string, data: UpdateTrainingCategoryInput) {
    return await this.prisma.trainingCategory.update({
      where: { id },
      data,
      include: {
        trainings: true,
        approvals: true,
      },
    });
  }

  async delete(id: string) {
    return await this.prisma.trainingCategory.delete({
      where: { id },
    });
  }

  async findByName(name: string) {
    return await this.prisma.trainingCategory.findUnique({
      where: { name },
    });
  }
}