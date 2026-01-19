import { TrainingCategoryRepository } from './TrainingCategory.repository';
import { CreateTrainingCategoryInput, UpdateTrainingCategoryInput } from './TrainingCategory.model';

export class TrainingCategoryService {
  private trainingCategoryRepository: TrainingCategoryRepository;

  constructor() {
    this.trainingCategoryRepository = new TrainingCategoryRepository();
  }

  async createTrainingCategory(data: CreateTrainingCategoryInput) {
    // Check if category name already exists
    const existing = await this.trainingCategoryRepository.findByName(data.name);
    if (existing) {
      throw new Error('Training category with this name already exists');
    }

    return await this.trainingCategoryRepository.create(data);
  }

  async getTrainingCategories() {
    return await this.trainingCategoryRepository.findAll();
  }

  async getTrainingCategoryById(id: string) {
    const category = await this.trainingCategoryRepository.findById(id);
    if (!category) {
      throw new Error('Training category not found');
    }
    return category;
  }

  async updateTrainingCategory(id: string, data: UpdateTrainingCategoryInput) {
    // Check if category exists
    await this.getTrainingCategoryById(id);

    // Check if new name already exists (if name is being updated)
    if (data.name) {
      const existing = await this.trainingCategoryRepository.findByName(data.name);
      if (existing && existing.id !== id) {
        throw new Error('Training category with this name already exists');
      }
    }

    return await this.trainingCategoryRepository.update(id, data);
  }

  async deleteTrainingCategory(id: string) {
    // Check if category exists
    await this.getTrainingCategoryById(id);

    return await this.trainingCategoryRepository.delete(id);
  }
}