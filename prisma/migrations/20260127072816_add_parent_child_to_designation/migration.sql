-- AlterTable
ALTER TABLE "Designation" ADD COLUMN     "parentId" TEXT;

-- AddForeignKey
ALTER TABLE "Designation" ADD CONSTRAINT "Designation_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Designation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
