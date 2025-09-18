/*
  Warnings:

  - The values [PENDING,CONFIRMED,CANCELLED] on the enum `CalloutStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `endTime` on the `Callout` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `Callout` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `JobRequest` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `Provider` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `Provider` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `Provider` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Provider` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Provider` table. All the data in the column will be lost.
  - You are about to drop the column `services` on the `Provider` table. All the data in the column will be lost.
  - You are about to drop the column `timezone` on the `Provider` table. All the data in the column will be lost.
  - You are about to drop the column `website` on the `Provider` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[externalCallId]` on the table `Callout` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone]` on the table `Provider` will be added. If there are existing duplicate values, this will fail.
  - Made the column `category` on table `JobRequest` required. This step will fail if there are existing NULL values in that column.
  - Made the column `description` on table `JobRequest` required. This step will fail if there are existing NULL values in that column.
  - Made the column `location` on table `JobRequest` required. This step will fail if there are existing NULL values in that column.
  - Made the column `phone` on table `Provider` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."CalloutStatus_new" AS ENUM ('QUEUED', 'DIALING', 'CONNECTED', 'NO_ANSWER', 'BUSY', 'FAILED', 'COMPLETED');
ALTER TABLE "public"."Callout" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."Callout" ALTER COLUMN "status" TYPE "public"."CalloutStatus_new" USING ("status"::text::"public"."CalloutStatus_new");
ALTER TYPE "public"."CalloutStatus" RENAME TO "CalloutStatus_old";
ALTER TYPE "public"."CalloutStatus_new" RENAME TO "CalloutStatus";
DROP TYPE "public"."CalloutStatus_old";
ALTER TABLE "public"."Callout" ALTER COLUMN "status" SET DEFAULT 'QUEUED';
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."JobRequest" DROP CONSTRAINT "JobRequest_userId_fkey";

-- DropIndex
DROP INDEX "public"."Provider_city_idx";

-- DropIndex
DROP INDEX "public"."Provider_email_key";

-- DropIndex
DROP INDEX "public"."Provider_name_idx";

-- AlterTable
ALTER TABLE "public"."Callout" DROP COLUMN "endTime",
DROP COLUMN "startTime",
ADD COLUMN     "calloutFee" DECIMAL(10,2),
ADD COLUMN     "earliestQuoteTime" TIMESTAMP(3),
ADD COLUMN     "externalCallId" TEXT,
ADD COLUMN     "recordingUrl" TEXT,
ADD COLUMN     "scheduledAt" TIMESTAMP(3),
ADD COLUMN     "toPhone" TEXT,
ADD COLUMN     "transcript" TEXT,
ALTER COLUMN "status" SET DEFAULT 'QUEUED';

-- AlterTable
ALTER TABLE "public"."JobRequest" DROP COLUMN "userId",
ADD COLUMN     "createdById" INTEGER,
ALTER COLUMN "category" SET NOT NULL,
ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "location" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."Provider" DROP COLUMN "address",
DROP COLUMN "category",
DROP COLUMN "city",
DROP COLUMN "email",
DROP COLUMN "notes",
DROP COLUMN "services",
DROP COLUMN "timezone",
DROP COLUMN "website",
ALTER COLUMN "phone" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "passwordHash";

-- CreateIndex
CREATE UNIQUE INDEX "Callout_externalCallId_key" ON "public"."Callout"("externalCallId");

-- CreateIndex
CREATE INDEX "Callout_status_scheduledAt_idx" ON "public"."Callout"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "JobRequest_status_idx" ON "public"."JobRequest"("status");

-- CreateIndex
CREATE INDEX "JobRequest_createdById_idx" ON "public"."JobRequest"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "Provider_phone_key" ON "public"."Provider"("phone");

-- AddForeignKey
ALTER TABLE "public"."JobRequest" ADD CONSTRAINT "JobRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
