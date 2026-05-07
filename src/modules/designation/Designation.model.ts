export interface DesignationModel {
  id: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDesignationInput {
  name: string;
  description?: string;
  parentId?: string | null;
}

export interface UpdateDesignationInput {
  name?: string;
  description?: string;
  parentId?: string | null;
}
