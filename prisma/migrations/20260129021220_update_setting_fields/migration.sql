/*
  Warnings:

  - You are about to drop the column `dangerColor` on the `Setting` table. All the data in the column will be lost.
  - You are about to drop the column `infoColor` on the `Setting` table. All the data in the column will be lost.
  - You are about to drop the column `key` on the `Setting` table. All the data in the column will be lost.
  - You are about to drop the column `successColor` on the `Setting` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `Setting` table. All the data in the column will be lost.
  - You are about to drop the column `warningColor` on the `Setting` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Setting" DROP COLUMN "dangerColor",
DROP COLUMN "infoColor",
DROP COLUMN "key",
DROP COLUMN "successColor",
DROP COLUMN "value",
DROP COLUMN "warningColor",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "trainingReminderDays" INTEGER DEFAULT 7,
ALTER COLUMN "primaryColor" SET DEFAULT '#3b82f6',
ALTER COLUMN "secondaryColor" SET DEFAULT '#8b5cf6';
