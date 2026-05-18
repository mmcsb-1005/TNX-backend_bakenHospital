// Domain labels for request-training module
export type RequestTrainingStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ApprovalTrailAction = 'APPROVED' | 'REJECTED';
export type TrainingTypeValue = 'IN_HOUSE' | 'EXTERNAL' | 'ONLINE';
export type BondTypeValue = 'BONDED' | 'NON_BONDED';
export type PaymentTypeValue = 'HRDCORP' | 'NONE';
export type TrainingMethodValue = 'CASH_IN_ADVANCE' | 'PAY_AND_CLAIM';

// Persisted request-training labels
export interface RequestTrainingModel {
  id: string;
  requestName: string;
  requestJustification?: string | null;
  trainingId?: string | null;
  proposedTrainingData?: ProposedTrainingData | null;
  approvalUserId?: string | null;
  currentApprovalLevel?: number | null;
  approvalTrail?: ApprovalTrailItem[] | null;
  status: RequestTrainingStatus;
  approvedAt?: Date | null;
  rejectedAt?: Date | null;
  approvalNotes?: string | null;
  submittedById?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Create and update payload labels
export interface CreateRequestTrainingInput {
  requestName: string;
  requestJustification?: string;
  trainingId?: string;
  proposedTrainingData?: ProposedTrainingData;
  currentApprovalLevel?: number | null;
  approvalTrail?: ApprovalTrailItem[] | null;
  participantIds: string[];
  approvalUserId?: string;
  submittedById?: string;
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

// Approval action labels
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
  action: ApprovalTrailAction;
  notes?: string | null;
  actedAt: string;
}

// Proposed training payload labels
export interface ProposedTrainingData {
  title: string;
  description?: string;
  organizer: string;
  trainingType: TrainingTypeValue;
  dateTimeStart: string;
  dateTimeEnd: string;
  venue: string;
  bond: BondTypeValue;
  typeOfPayment: PaymentTypeValue;
  budgeted: boolean;
  trainingMethod: TrainingMethodValue;
  sponsored?: string;
  trainingCost?: number;
  accommodationCost?: number;
  travelCost?: number;
  mealCost?: number;
  comment?: string;
  objectives?: string;
  courseCurriculum?: string;
  faqs?: string;
  imagePath?: string;
}

// User self-submission labels for propose-training flow
export interface SubmitTrainingRequestInput {
  requestName: string;
  userId: string; // The user submitting the request
  trainingData: ProposedTrainingData;
  participantIds?: string[];
  approvalUserId?: string;
}
