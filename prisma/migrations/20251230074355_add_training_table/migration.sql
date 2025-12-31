-- CreateEnum
CREATE TYPE "TrainingType" AS ENUM ('IN_HOUSE', 'EXTERNAL', 'ONLINE');

-- CreateEnum
CREATE TYPE "BondType" AS ENUM ('BONDED', 'NON_BONDED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('HRDCORP', 'NONE');

-- CreateEnum
CREATE TYPE "TrainingMethod" AS ENUM ('CASH_IN_ADVANCE', 'PAY_AND_CLAIM');

-- CreateTable
CREATE TABLE "Training" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "organizer" TEXT NOT NULL,
    "trainingType" "TrainingType" NOT NULL,
    "dateTimeStart" TIMESTAMP(3) NOT NULL,
    "dateTimeEnd" TIMESTAMP(3) NOT NULL,
    "duration" TEXT,
    "venue" TEXT NOT NULL,
    "bond" "BondType" NOT NULL,
    "typeOfPayment" "PaymentType" NOT NULL,
    "budgeted" BOOLEAN NOT NULL,
    "sponsored" TEXT,
    "accommodationCost" DECIMAL(10,2),
    "travelCost" DECIMAL(10,2),
    "mealCost" DECIMAL(10,2),
    "trainingMethod" "TrainingMethod" NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Training_pkey" PRIMARY KEY ("id")
);
