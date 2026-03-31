-- CreateTable
CREATE TABLE "CartReminder" (
    "id" SERIAL NOT NULL,
    "cartId" INTEGER NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,

    CONSTRAINT "CartReminder_pkey" PRIMARY KEY ("id")
);
