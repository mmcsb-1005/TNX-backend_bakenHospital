import { DepartmentRepository } from './Department.repository';
import { CreateDepartmentInput, UpdateDepartmentInput } from './Department.model';
import { prisma } from '../../lib/prisma';

export class DepartmentService {
  private departmentRepository: DepartmentRepository;

  constructor() {
    this.departmentRepository = new DepartmentRepository();
  }

  async createDepartment(data: CreateDepartmentInput) {
    const name = data.name?.trim();
    if (!name) {
      throw new Error('Department name is required');
    }

    const existing = await this.departmentRepository.findByName(name);
    if (existing) {
      throw new Error('Department with this name already exists');
    }

    return this.departmentRepository.create({
      name,
      description: data.description ?? null,
    });
  }

  async getDepartments() {
    return this.departmentRepository.findAll();
  }

  async getDepartmentById(id: string) {
    const department = await this.departmentRepository.findById(id);
    if (!department) {
      throw new Error('Department not found');
    }
    return department;
  }

  async updateDepartment(id: string, data: UpdateDepartmentInput) {
    await this.getDepartmentById(id);

    if (data.name !== undefined) {
      const nextName = data.name?.trim();
      if (!nextName) {
        throw new Error('Department name is required');
      }

      const existing = await this.departmentRepository.findByName(nextName);
      if (existing && existing.id !== id) {
        throw new Error('Department with this name already exists');
      }

      return this.departmentRepository.update(id, {
        name: nextName,
        ...(data.description !== undefined ? { description: data.description } : {}),
      });
    }

    return this.departmentRepository.update(id, {
      ...(data.description !== undefined ? { description: data.description } : {}),
    });
  }

  async deleteDepartment(id: string) {
    await this.getDepartmentById(id);

    const userCount = await prisma.user.count({
      where: { departmentId: id },
    });

    if (userCount > 0) {
      throw new Error('Cannot delete department that is used by user(s)');
    }

    return this.departmentRepository.delete(id);
  }
}
