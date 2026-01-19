-- AlterTable
ALTER TABLE "Training" ADD COLUMN     "categoryId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "designationId" TEXT;

-- CreateTable
CREATE TABLE "Designation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Designation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestTraining" (
    "id" TEXT NOT NULL,
    "requestName" TEXT NOT NULL,
    "trainingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequestTraining_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalUser" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "trainingCategoryId" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAttendance" (
    "id" TEXT NOT NULL,
    "trainingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "attendanceDate" TIMESTAMP(3) NOT NULL,
    "isPresent" BOOLEAN NOT NULL DEFAULT false,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RequestParticipant" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RequestParticipant_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ApprovalUsers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ApprovalUsers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ApprovedBy" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ApprovedBy_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Designation_name_key" ON "Designation"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingCategory_name_key" ON "TrainingCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserAttendance_trainingId_userId_attendanceDate_key" ON "UserAttendance"("trainingId", "userId", "attendanceDate");

-- CreateIndex
CREATE INDEX "_RequestParticipant_B_index" ON "_RequestParticipant"("B");

-- CreateIndex
CREATE INDEX "_ApprovalUsers_B_index" ON "_ApprovalUsers"("B");

-- CreateIndex
CREATE INDEX "_ApprovedBy_B_index" ON "_ApprovedBy"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_designationId_fkey" FOREIGN KEY ("designationId") REFERENCES "Designation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Training" ADD CONSTRAINT "Training_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TrainingCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestTraining" ADD CONSTRAINT "RequestTraining_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalUser" ADD CONSTRAINT "ApprovalUser_trainingCategoryId_fkey" FOREIGN KEY ("trainingCategoryId") REFERENCES "TrainingCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAttendance" ADD CONSTRAINT "UserAttendance_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RequestParticipant" ADD CONSTRAINT "_RequestParticipant_A_fkey" FOREIGN KEY ("A") REFERENCES "RequestTraining"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RequestParticipant" ADD CONSTRAINT "_RequestParticipant_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ApprovalUsers" ADD CONSTRAINT "_ApprovalUsers_A_fkey" FOREIGN KEY ("A") REFERENCES "ApprovalUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ApprovalUsers" ADD CONSTRAINT "_ApprovalUsers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ApprovedBy" ADD CONSTRAINT "_ApprovedBy_A_fkey" FOREIGN KEY ("A") REFERENCES "ApprovalUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ApprovedBy" ADD CONSTRAINT "_ApprovedBy_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
