/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `VendorProfile` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "VendorProfile_userId_key";

-- AlterTable
ALTER TABLE "VendorProfile" ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "VendorProfile_slug_key" ON "VendorProfile"("slug");

-- CreateIndex
CREATE INDEX "VendorProfile_userId_idx" ON "VendorProfile"("userId");
