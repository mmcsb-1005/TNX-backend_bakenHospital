export interface DesignationModel {
  id: string;
  name: string;
  description?: string | null;
  level: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDesignationInput {
  name: string;
  description?: string;
  level?: number;
}

export interface UpdateDesignationInput {
  name?: string;
  description?: string;
  level?: number;
}