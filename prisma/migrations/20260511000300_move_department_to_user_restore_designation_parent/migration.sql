DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'User'
      AND column_name = 'departmentId'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "departmentId" TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'User_departmentId_fkey'
  ) THEN
    ALTER TABLE "User"
      ADD CONSTRAINT "User_departmentId_fkey"
      FOREIGN KEY ("departmentId") REFERENCES "Department"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Designation_departmentId_fkey'
  ) THEN
    ALTER TABLE "Designation" DROP CONSTRAINT "Designation_departmentId_fkey";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Designation'
      AND column_name = 'departmentId'
  ) THEN
    ALTER TABLE "Designation" DROP COLUMN "departmentId";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Designation'
      AND column_name = 'parentId'
  ) THEN
    ALTER TABLE "Designation" ADD COLUMN "parentId" TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Designation_parentId_fkey'
  ) THEN
    ALTER TABLE "Designation"
      ADD CONSTRAINT "Designation_parentId_fkey"
      FOREIGN KEY ("parentId") REFERENCES "Designation"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

