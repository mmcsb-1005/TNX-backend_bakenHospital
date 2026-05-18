import { DesignationRepository } from './Designation.repository';
import { CreateDesignationInput, UpdateDesignationInput } from './Designation.model';

export class DesignationService {
  private designationRepository: DesignationRepository;

  constructor() {
    this.designationRepository = new DesignationRepository();
  }

  async createDesignation(data: CreateDesignationInput) {
    if ((data as any).parentId === '') {
      (data as any).parentId = null;
    }

    // Check if designation name already exists
    const existing = await this.designationRepository.findByName(data.name);
    if (existing) {
      throw new Error('Designation with this name already exists');
    }

    // Validate parent if provided
    if (data.parentId) {
      const parent = await this.designationRepository.findById(data.parentId);
      if (!parent) {
        throw new Error('Parent designation not found');
      }
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
    if ((data as any).parentId === '') {
      (data as any).parentId = null;
    }

    // Check if designation exists
    await this.getDesignationById(id);

    // Check if new name already exists (if name is being updated)
    if (data.name) {
      const existing = await this.designationRepository.findByName(data.name);
      if (existing && existing.id !== id) {
        throw new Error('Designation with this name already exists');
      }
    }

    // Prevent circular parent relationship
    if (data.parentId) {
      if (data.parentId === id) {
        throw new Error('Designation cannot be its own parent');
      }

      const parent = await this.designationRepository.findById(data.parentId);
      if (!parent) {
        throw new Error('Parent designation not found');
      }

      let currentParent = parent as any;
      while (currentParent?.parentId) {
        if (currentParent.parentId === id) {
          throw new Error('Cannot create circular parent-child relationship');
        }
        currentParent = (await this.designationRepository.findById(currentParent.parentId)) as any;
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
