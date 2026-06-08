export interface UserAttendanceModel {
  id: string;
  trainingId: string;
  userId: string;
  attendanceDate: Date;
  isPresent: boolean;
  comment?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserAttendanceInput {
  trainingId: string;
  userId: string;
  attendanceDate: Date;
  isPresent: boolean;
  comment?: string;
}

export interface UpdateUserAttendanceInput {
  isPresent?: boolean;
  comment?: string;
}

export interface BulkUpdateAttendanceInput {
  attendances: {
    userId: string;
    isPresent: boolean;
    comment?: string;
    attendedTime?: string | null;
  }[];
}
