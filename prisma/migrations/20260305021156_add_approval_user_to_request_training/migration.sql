-- AlterTable
ALTER TABLE "RequestTraining" ADD COLUMN     "approvalUserId" TEXT;

-- AddForeignKey
ALTER TABLE "RequestTraining" ADD CONSTRAINT "RequestTraining_approvalUserId_fkey" FOREIGN KEY ("approvalUserId") REFERENCES "ApprovalUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
