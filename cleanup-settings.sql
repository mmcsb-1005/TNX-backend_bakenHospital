-- Clean up duplicate Setting records
-- Keep only the first record and delete the rest

-- Check current records
SELECT * FROM "Setting" ORDER BY "createdAt" ASC;

-- Delete all records except the first one
DELETE FROM "Setting" 
WHERE id NOT IN (
  SELECT id FROM "Setting" 
  ORDER BY "createdAt" ASC 
  LIMIT 1
);

-- Verify only one record remains
SELECT * FROM "Setting";
