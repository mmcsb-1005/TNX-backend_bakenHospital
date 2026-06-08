ALTER TABLE "Setting" ADD COLUMN "attendanceGraceMinutes" INTEGER DEFAULT 15;

ALTER TABLE "UserAttendance" ADD COLUMN "expectedStartAt" TIMESTAMP(3);
ALTER TABLE "UserAttendance" ADD COLUMN "isLate" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "UserAttendance" ADD COLUMN "lateMinutes" INTEGER;

CREATE INDEX "UserAttendance_trainingId_attendanceDate_idx" ON "UserAttendance"("trainingId", "attendanceDate");
CREATE INDEX "UserAttendance_trainingId_isLate_idx" ON "UserAttendance"("trainingId", "isLate");
