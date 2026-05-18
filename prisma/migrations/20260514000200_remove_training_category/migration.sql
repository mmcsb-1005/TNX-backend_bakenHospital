ALTER TABLE "Training" DROP CONSTRAINT IF EXISTS "Training_categoryId_fkey";
ALTER TABLE "ApprovalUser" DROP CONSTRAINT IF EXISTS "ApprovalUser_trainingCategoryId_fkey";

ALTER TABLE "Training" DROP COLUMN IF EXISTS "categoryId";
ALTER TABLE "ApprovalUser" DROP COLUMN IF EXISTS "trainingCategoryId";

DROP TABLE IF EXISTS "TrainingCategory" CASCADE;

