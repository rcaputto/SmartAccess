-- CreateTable
CREATE TABLE "NotificationDelivery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "channel" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "errorMessage" TEXT,
    "providerMessageId" TEXT,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "sentAt" DATETIME,
    "failedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "bookingId" TEXT NOT NULL,
    "accessCodeId" TEXT,
    CONSTRAINT "NotificationDelivery_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NotificationDelivery_accessCodeId_fkey" FOREIGN KEY ("accessCodeId") REFERENCES "AccessCode" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "NotificationDelivery_bookingId_createdAt_idx" ON "NotificationDelivery"("bookingId", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationDelivery_accessCodeId_idx" ON "NotificationDelivery"("accessCodeId");

-- CreateIndex
CREATE INDEX "NotificationDelivery_status_idx" ON "NotificationDelivery"("status");
