-- CreateEnum
CREATE TYPE "RepositorySyncStatus" AS ENUM ('SYNCED', 'PENDING', 'DISCONNECTED', 'PAUSED', 'ERROR');

-- AlterTable
ALTER TABLE "repositories" ADD COLUMN     "disconnected_at" TIMESTAMP(3),
ADD COLUMN     "is_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "last_sync_attempt_at" TIMESTAMP(3),
ADD COLUMN     "last_sync_error" TEXT,
ADD COLUMN     "last_synced_at" TIMESTAMP(3),
ADD COLUMN     "sync_status" "RepositorySyncStatus" NOT NULL DEFAULT 'PENDING';
