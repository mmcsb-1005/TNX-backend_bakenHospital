export interface RequestTrainingModel {
  id: string;
  requestName: string;
  trainingId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRequestTrainingInput {
  requestName: string;
  trainingId: string;
  participantIds: string[];
}

export interface UpdateRequestTrainingInput {
  requestName?: string;
  trainingId?: string;
  participantIds?: string[];
}