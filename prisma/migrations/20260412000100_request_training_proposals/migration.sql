ALTER TABLE "RequestTraining"
ADD COLUMN "proposedTrainingData" JSONB;

ALTER TABLE "RequestTraining"
ALTER COLUMN "trainingId" DROP NOT NULL;

ALTER TABLE "RequestTraining"
DROP CONSTRAINT "RequestTraining_trainingId_fkey";

ALTER TABLE "RequestTraining"
ADD CONSTRAINT "RequestTraining_trainingId_fkey"
FOREIGN KEY ("trainingId") REFERENCES "Training"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;