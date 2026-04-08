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

export interface SubmitTrainingRequestInput {
  requestName: string;
  userId: string; // The user submitting the request
  trainingData: {
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
  };
  approvalUserId?: string;
}