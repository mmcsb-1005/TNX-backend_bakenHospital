import { prisma } from '../../lib/prisma';
import { CreateDesignationInput, UpdateDesignationInput } from './Designation.model';

export class DesignationRepository {
  private prisma = prisma;

  constructor() {
  }

  async create(data: CreateDesignationInput) {
    return await this.prisma.designation.create({
      data: {
        ...data,
        level: data.level || 1,
      },
      include: {
        users: true,
      },
    });
  }

  async findAll() {
    return await this.prisma.designation.findMany({
      include: {
        users: true,
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: {
        level: 'asc',
      },
    });
  }

  async findById(id: string) {
    return await this.prisma.designation.findUnique({
      where: { id },
      include: {
        users: true,
      },
    });
  }

  async update(id: string, data: UpdateDesignationInput) {
    return await this.prisma.designation.update({
      where: { id },
      data,
      include: {
        users: true,
      },
    });
  }

  async delete(id: string) {
    return await this.prisma.designation.delete({
      where: { id },
    });
  }

  async findByName(name: string) {
    return await this.prisma.designation.findUnique({
      where: { name },
    });
  }
}