-- CreateTable
CREATE TABLE "ApprovalUserDepartment" (
    "id" TEXT NOT NULL,
    "approvalUserId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,

    CONSTRAINT "ApprovalUserDepartment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApprovalUserDepartment_departmentId_idx" ON "ApprovalUserDepartment"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalUserDepartment_approvalUserId_departmentId_key" ON "ApprovalUserDepartment"("approvalUserId", "departmentId");

-- AddForeignKey
ALTER TABLE "ApprovalUserDepartment" ADD CONSTRAINT "ApprovalUserDepartment_approvalUserId_fkey" FOREIGN KEY ("approvalUserId") REFERENCES "ApprovalUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalUserDepartment" ADD CONSTRAINT "ApprovalUserDepartment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill existing single-department approval users into join table
INSERT INTO "ApprovalUserDepartment" ("id", "approvalUserId", "departmentId")
SELECT
  CONCAT('aud_', "ApprovalUser"."id") AS "id",
  "ApprovalUser"."id" AS "approvalUserId",
  "ApprovalUser"."departmentId" AS "departmentId"
FROM "ApprovalUser"
WHERE "ApprovalUser"."departmentId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "ApprovalUserDepartment" aud
    WHERE aud."approvalUserId" = "ApprovalUser"."id"
      AND aud."departmentId" = "ApprovalUser"."departmentId"
  );
