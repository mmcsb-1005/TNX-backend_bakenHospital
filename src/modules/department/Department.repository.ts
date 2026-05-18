import { prisma } from '../../lib/prisma';
import { CreateDepartmentInput, UpdateDepartmentInput } from './Department.model';

export class DepartmentRepository {
  private prisma = prisma;

  async create(data: CreateDepartmentInput) {
    return this.prisma.department.create({
      data: {
        name: data.name,
        description: data.description ?? null,
      },
      include: {
        _count: { select: { users: true } },
      },
    });
  }

  async findAll() {
    return this.prisma.department.findMany({
      include: {
        _count: { select: { users: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.department.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true } },
      },
    });
  }

  async findByName(name: string) {
    return this.prisma.department.findUnique({
      where: { name },
    });
  }

  async update(id: string, data: UpdateDepartmentInput) {
    return this.prisma.department.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
      },
      include: {
        _count: { select: { users: true } },
      },
    });
  }

  async delete(id: string) {
    return this.prisma.department.delete({
      where: { id },
    });
  }
}
