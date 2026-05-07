export interface ApprovalUserModel {
  id: string;
  title: string;
  trainingCategoryId: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateApprovalUserInput {
  title: string;
  trainingCategoryId: string;
  description?: string;
  approvers: Array<{
    userId: string;
    level: number;
  }>;
}

export interface UpdateApprovalUserInput {
  title?: string;
  trainingCategoryId?: string;
  description?: string;
  approvers?: Array<{
    userId: string;
    level: number;
  }>;
}
