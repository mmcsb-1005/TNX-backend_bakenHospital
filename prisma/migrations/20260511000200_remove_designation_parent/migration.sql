DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Designation_parentId_fkey'
  ) THEN
    ALTER TABLE "Designation" DROP CONSTRAINT "Designation_parentId_fkey";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Designation'
      AND column_name = 'parentId'
  ) THEN
    ALTER TABLE "Designation" DROP COLUMN "parentId";
  END IF;
END $$;

