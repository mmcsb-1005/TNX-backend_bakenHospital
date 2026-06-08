CREATE TABLE "FormTraining" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "trainingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormTraining_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FormTraining_formId_trainingId_key" ON "FormTraining"("formId", "trainingId");
CREATE INDEX "FormTraining_trainingId_idx" ON "FormTraining"("trainingId");
CREATE INDEX "FormTraining_formId_idx" ON "FormTraining"("formId");

ALTER TABLE "FormTraining" ADD CONSTRAINT "FormTraining_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FormTraining" ADD CONSTRAINT "FormTraining_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE CASCADE ON UPDATE CASCADE;

