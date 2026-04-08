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
        _count: { select: { users: true } },
        parent: true,
        children: true,
      },
    });
  }

  async findAll() {
    return await this.prisma.designation.findMany({
      include: {
        _count: { select: { users: true } },
        parent: true,
        children: true,
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
        _count: { select: { users: true } },
        parent: true,
        children: true,
      },
    });
  }

  async update(id: string, data: UpdateDesignationInput) {
    return await this.prisma.designation.update({
      where: { id },
      data,
      include: {
        _count: { select: { users: true } },
        parent: true,
        children: true,
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