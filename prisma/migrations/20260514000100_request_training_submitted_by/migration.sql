ALTER TABLE "RequestTraining" ADD COLUMN "submittedById" TEXT;

ALTER TABLE "RequestTraining"
ADD CONSTRAINT "RequestTraining_submittedById_fkey"
FOREIGN KEY ("submittedById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "RequestTraining_submittedById_idx" ON "RequestTraining"("submittedById");

UPDATE "RequestTraining" AS rt
SET "submittedById" = rp."B"
FROM "_RequestParticipant" AS rp
WHERE rp."A" = rt."id"
  AND rt."submittedById" IS NULL
  AND (
    SELECT COUNT(*)
    FROM "_RequestParticipant" AS rp2
    WHERE rp2."A" = rt."id"
  ) = 1;
