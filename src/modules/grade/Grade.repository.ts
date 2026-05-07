import { prisma } from '../../lib/prisma';
import { CreateGradeInput, UpdateGradeInput } from './Grade.model';

export class GradeRepository {
  private prisma = prisma;

  async create(data: CreateGradeInput) {
    return await this.prisma.grade.create({
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
    return await this.prisma.grade.findMany({
      include: {
        _count: { select: { users: true } },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findById(id: string) {
    return await this.prisma.grade.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true } },
      },
    });
  }

  async update(id: string, data: UpdateGradeInput) {
    return await this.prisma.grade.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description ?? null } : {}),
      },
      include: {
        _count: { select: { users: true } },
      },
    });
  }

  async delete(id: string) {
    return await this.prisma.grade.delete({
      where: { id },
    });
  }

  async findByName(name: string) {
    return await this.prisma.grade.findUnique({
      where: { name },
    });
  }
}
