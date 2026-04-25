/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "slug" TEXT;

-- CreateTable
CREATE TABLE "ProductSlugHistory" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductSlugHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductSlugHistory_slug_key" ON "ProductSlugHistory"("slug");

-- CreateIndex
CREATE INDEX "ProductSlugHistory_productId_idx" ON "ProductSlugHistory"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- AddForeignKey
ALTER TABLE "ProductSlugHistory" ADD CONSTRAINT "ProductSlugHistory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
