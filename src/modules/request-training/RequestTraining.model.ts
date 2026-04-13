export interface RequestTrainingModel {
  id: string;
  requestName: string;
  requestJustification?: string | null;
  trainingId?: string | null;
  proposedTrainingData?: ProposedTrainingData | null;
  approvalUserId?: string | null;
  currentApprovalLevel?: number | null;
  approvalTrail?: ApprovalTrailItem[] | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedAt?: Date | null;
  rejectedAt?: Date | null;
  approvalNotes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRequestTrainingInput {
  requestName: string;
  requestJustification?: string;
  trainingId?: string;
  proposedTrainingData?: ProposedTrainingData;
  currentApprovalLevel?: number | null;
  approvalTrail?: ApprovalTrailItem[] | null;
  participantIds: string[];
  approvalUserId?: string;
}

export interface UpdateRequestTrainingInput {
  requestName?: string;
  requestJustification?: string | null;
  trainingId?: string;
  proposedTrainingData?: ProposedTrainingData | null;
  currentApprovalLevel?: number | null;
  approvalTrail?: ApprovalTrailItem[] | null;
  participantIds?: string[];
  approvalUserId?: string | null;
}

export interface ApproveRequestInput {
  requestId: string;
  notes?: string;
  actorUserId: string;
}

export interface RejectRequestInput {
  requestId: string;
  notes?: string;
  actorUserId: string;
}

export interface ApprovalTrailItem {
  level: number;
  actorUserId: string;
  actorName: string;
  action: 'APPROVED' | 'REJECTED';
  notes?: string | null;
  actedAt: string;
}

export interface ProposedTrainingData {
  title: string;
  description?: string;
  organizer: string;
  trainingType: 'IN_HOUSE' | 'EXTERNAL' | 'ONLINE';
  dateTimeStart: string;
  dateTimeEnd: string;
  venue: string;
  bond: 'BONDED' | 'NON_BONDED';
  typeOfPayment: 'HRDCORP' | 'NONE';
  budgeted: boolean;
  trainingMethod: 'CASH_IN_ADVANCE' | 'PAY_AND_CLAIM';
  sponsored?: string;
  accommodationCost?: number;
  travelCost?: number;
  mealCost?: number;
  comment?: string;
  categoryId?: string;
}

export interface SubmitTrainingRequestInput {
  requestName: string;
  userId: string; // The user submitting the request
  trainingData: ProposedTrainingData;
  approvalUserId?: string;
}