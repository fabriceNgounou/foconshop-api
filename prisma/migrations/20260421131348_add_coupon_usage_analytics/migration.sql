-- AlterTable
ALTER TABLE "CouponUsage" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "discountAmount" DOUBLE PRECISION,
ADD COLUMN     "orderId" INTEGER;

-- CreateIndex
CREATE INDEX "CouponUsage_orderId_idx" ON "CouponUsage"("orderId");

-- CreateIndex
CREATE INDEX "CouponUsage_usedAt_idx" ON "CouponUsage"("usedAt");
