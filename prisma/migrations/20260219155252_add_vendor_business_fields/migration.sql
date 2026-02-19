/*
  Warnings:

  - Made the column `address` on table `VendorProfile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `businessName` on table `VendorProfile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `city` on table `VendorProfile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `phone` on table `VendorProfile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `region` on table `VendorProfile` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "VendorProfile" ALTER COLUMN "address" SET NOT NULL,
ALTER COLUMN "businessName" SET NOT NULL,
ALTER COLUMN "city" SET NOT NULL,
ALTER COLUMN "phone" SET NOT NULL,
ALTER COLUMN "region" SET NOT NULL;
