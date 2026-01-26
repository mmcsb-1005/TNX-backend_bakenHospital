/*
  Warnings:

  - You are about to drop the `_ApprovalUsers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_ApprovalUsers" DROP CONSTRAINT "_ApprovalUsers_A_fkey";

-- DropForeignKey
ALTER TABLE "_ApprovalUsers" DROP CONSTRAINT "_ApprovalUsers_B_fkey";

-- DropTable
DROP TABLE "_ApprovalUsers";
