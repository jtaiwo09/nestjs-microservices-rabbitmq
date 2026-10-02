-- AlterEnum
ALTER TYPE "SagaStatus" ADD VALUE 'TIMED_OUT';

-- AlterTable
ALTER TABLE "SagaState" ADD COLUMN     "failureReason" TEXT;
