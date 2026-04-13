DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'RequestTraining'
      AND column_name = 'requestJustification'
  ) THEN
    ALTER TABLE "RequestTraining" ADD COLUMN "requestJustification" TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'RequestTraining'
      AND column_name = 'currentApprovalLevel'
  ) THEN
    ALTER TABLE "RequestTraining" ADD COLUMN "currentApprovalLevel" INTEGER;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'RequestTraining'
      AND column_name = 'approvalTrail'
  ) THEN
    ALTER TABLE "RequestTraining" ADD COLUMN "approvalTrail" JSONB;
  END IF;
END $$;
