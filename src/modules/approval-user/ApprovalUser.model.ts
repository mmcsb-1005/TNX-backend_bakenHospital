export interface ApprovalUserModel {
  id: string;
  title: string;
  departmentId: string;
  departmentIds?: string[];
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateApprovalUserInput {
  title: string;
  departmentId?: string;
  departmentIds?: string[];
  description?: string;
  approvers: Array<{
    userId: string;
    level: number;
  }>;
}

export interface UpdateApprovalUserInput {
  title?: string;
  departmentId?: string;
  departmentIds?: string[];
  description?: string;
  approvers?: Array<{
    userId: string;
    level: number;
  }>;
}
