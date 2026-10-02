-- CreateEnum
CREATE TYPE "SagaStep" AS ENUM ('STARTED', 'RESERVING_INVENTORY', 'PROCESSING_PAYMENT', 'RELEASING_INVENTORY', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "SagaStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "SagaState" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "step" "SagaStep" NOT NULL DEFAULT 'STARTED',
    "status" "SagaStatus" NOT NULL DEFAULT 'RUNNING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SagaState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SagaState_orderId_key" ON "SagaState"("orderId");
