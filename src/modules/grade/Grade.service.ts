import { GradeRepository } from './Grade.repository';
import { CreateGradeInput, UpdateGradeInput } from './Grade.model';
import { prisma } from '../../lib/prisma';

export class GradeService {
  private gradeRepository: GradeRepository;

  constructor() {
    this.gradeRepository = new GradeRepository();
  }

  async createGrade(data: CreateGradeInput) {
    const existing = await this.gradeRepository.findByName(data.name);
    if (existing) {
      throw new Error('Grade with this name already exists');
    }

    return await this.gradeRepository.create(data);
  }

  async getGrades() {
    return await this.gradeRepository.findAll();
  }

  async getGradeById(id: string) {
    const grade = await this.gradeRepository.findById(id);
    if (!grade) {
      throw new Error('Grade not found');
    }
    return grade;
  }

  async updateGrade(id: string, data: UpdateGradeInput) {
    await this.getGradeById(id);

    if (data.name) {
      const existing = await this.gradeRepository.findByName(data.name);
      if (existing && existing.id !== id) {
        throw new Error('Grade with this name already exists');
      }
    }

    return await this.gradeRepository.update(id, data);
  }

  async deleteGrade(id: string) {
    await this.getGradeById(id);

    const userCount = await prisma.user.count({
      where: { gradeId: id },
    });

    if (userCount > 0) {
      throw new Error('Cannot delete grade that is used by user(s)');
    }

    return await this.gradeRepository.delete(id);
  }
}
