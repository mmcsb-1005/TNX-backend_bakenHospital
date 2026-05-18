-- Ensure TrainingCategory table exists (used by Training.categoryId and legacy approval mapping)
CREATE TABLE IF NOT EXISTS "TrainingCategory" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TrainingCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TrainingCategory_name_key" ON "TrainingCategory"("name");

-- Add department mapping on ApprovalUser (new approval grouping)
DO $$
BEGIN
  IF to_regclass('public."ApprovalUser"') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'ApprovalUser'
        AND column_name = 'departmentId'
    ) THEN
      ALTER TABLE "ApprovalUser" ADD COLUMN "departmentId" TEXT;
    END IF;

    -- Make trainingCategoryId nullable so department-based workflows can be created
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'ApprovalUser'
        AND column_name = 'trainingCategoryId'
        AND is_nullable = 'NO'
    ) THEN
      ALTER TABLE "ApprovalUser" ALTER COLUMN "trainingCategoryId" DROP NOT NULL;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
        AND table_name = 'ApprovalUser'
        AND constraint_name = 'ApprovalUser_departmentId_fkey'
    ) THEN
      ALTER TABLE "ApprovalUser"
      ADD CONSTRAINT "ApprovalUser_departmentId_fkey"
      FOREIGN KEY ("departmentId") REFERENCES "Department"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
        AND table_name = 'ApprovalUser'
        AND constraint_name = 'ApprovalUser_trainingCategoryId_fkey'
    ) THEN
      ALTER TABLE "ApprovalUser"
      ADD CONSTRAINT "ApprovalUser_trainingCategoryId_fkey"
      FOREIGN KEY ("trainingCategoryId") REFERENCES "TrainingCategory"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
  END IF;
END $$;

-- Add optional approvalUserId to RequestTraining to match current API shape
DO $$
BEGIN
  IF to_regclass('public."RequestTraining"') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'RequestTraining'
        AND column_name = 'approvalUserId'
    ) THEN
      ALTER TABLE "RequestTraining" ADD COLUMN "approvalUserId" TEXT;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
        AND table_name = 'RequestTraining'
        AND constraint_name = 'RequestTraining_approvalUserId_fkey'
    ) THEN
      ALTER TABLE "RequestTraining"
      ADD CONSTRAINT "RequestTraining_approvalUserId_fkey"
      FOREIGN KEY ("approvalUserId") REFERENCES "ApprovalUser"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
  END IF;
END $$;

