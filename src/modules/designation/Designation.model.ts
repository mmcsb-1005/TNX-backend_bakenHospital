export interface DesignationModel {
  id: string;
  name: string;
  description?: string | null;
  level: number;
  parentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDesignationInput {
  name: string;
  description?: string;
  level?: number;
  parentId?: string | null;
}

export interface UpdateDesignationInput {
  name?: string;
  description?: string;
  level?: number;
  parentId?: string | null;
}