export interface TrainingCategoryModel {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTrainingCategoryInput {
  name: string;
  description?: string;
}

export interface UpdateTrainingCategoryInput {
  name?: string;
  description?: string;
}