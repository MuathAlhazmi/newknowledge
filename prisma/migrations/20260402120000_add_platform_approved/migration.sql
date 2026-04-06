-- AlterTable
ALTER TABLE "User" ADD COLUMN "platformApproved" BOOLEAN NOT NULL DEFAULT false;

-- Existing rows keep access (one-time backfill for deployments that already had users)
UPDATE "User" SET "platformApproved" = true WHERE "platformApproved" = false;
