-- CreateIndex
CREATE INDEX "Product_isActive_idx" ON "Product"("isActive");

-- CreateIndex
CREATE INDEX "Product_categoryId_isActive_idx" ON "Product"("categoryId", "isActive");
