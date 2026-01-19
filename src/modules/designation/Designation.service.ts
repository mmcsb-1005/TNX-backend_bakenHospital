import { DesignationRepository } from './Designation.repository';
import { CreateDesignationInput, UpdateDesignationInput } from './Designation.model';

export class DesignationService {
  private designationRepository: DesignationRepository;

  constructor() {
    this.designationRepository = new DesignationRepository();
  }

  async createDesignation(data: CreateDesignationInput) {
    // Check if designation name already exists
    const existing = await this.designationRepository.findByName(data.name);
    if (existing) {
      throw new Error('Designation with this name already exists');
    }

    return await this.designationRepository.create(data);
  }

  async getDesignations() {
    return await this.designationRepository.findAll();
  }

  async getDesignationById(id: string) {
    const designation = await this.designationRepository.findById(id);
    if (!designation) {
      throw new Error('Designation not found');
    }
    return designation;
  }

  async updateDesignation(id: string, data: UpdateDesignationInput) {
    // Check if designation exists
    await this.getDesignationById(id);

    // Check if new name already exists (if name is being updated)
    if (data.name) {
      const existing = await this.designationRepository.findByName(data.name);
      if (existing && existing.id !== id) {
        throw new Error('Designation with this name already exists');
      }
    }

    return await this.designationRepository.update(id, data);
  }

  async deleteDesignation(id: string) {
    // Check if designation exists
    await this.getDesignationById(id);

    return await this.designationRepository.delete(id);
  }
}