-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ORDER_CREATED', 'ORDER_PAID', 'ORDER_SHIPPED', 'NEW_ORDER_VENDOR', 'NEW_ORDER_ADMIN', 'PRODUCT_OUT_OF_STOCK', 'NEW_VENDOR', 'DISPUTE_CREATED');

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
