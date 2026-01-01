/*
  Warnings:

  - The values [CONFIRMED] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `totalPrice` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `variantName` on the `OrderItem` table. All the data in the column will be lost.
  - Added the required column `name` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `variantId` to the `OrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('PENDING', 'PAID', 'CANCELLED');
ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "OrderStatus_old";
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "totalPrice",
DROP COLUMN "variantName",
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "variantId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
