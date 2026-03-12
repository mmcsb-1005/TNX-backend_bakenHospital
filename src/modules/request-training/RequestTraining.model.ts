export interface RequestTrainingModel {
  id: string;
  requestName: string;
  trainingId: string;
  approvalUserId?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedAt?: Date | null;
  rejectedAt?: Date | null;
  approvalNotes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRequestTrainingInput {
  requestName: string;
  trainingId: string;
  participantIds: string[];
  approvalUserId?: string;
}

export interface UpdateRequestTrainingInput {
  requestName?: string;
  trainingId?: string;
  participantIds?: string[];
  approvalUserId?: string | null;
}

export interface ApproveRequestInput {
  requestId: string;
  notes?: string;
}

export interface RejectRequestInput {
  requestId: string;
  notes?: string;
}