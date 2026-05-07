export interface GradeModel {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGradeInput {
  name: string;
  description?: string;
}

export interface UpdateGradeInput {
  name?: string;
  description?: string;
}

