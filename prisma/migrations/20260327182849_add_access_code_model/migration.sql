-- CreateTable
CREATE TABLE "AccessCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "provider" TEXT,
    "code" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME NOT NULL,
    "externalId" TEXT,
    "lastSyncedAt" DATETIME,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AccessCode_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AccessCode_bookingId_key" ON "AccessCode"("bookingId");

-- CreateIndex
CREATE INDEX "AccessCode_status_idx" ON "AccessCode"("status");

-- CreateIndex
CREATE INDEX "AccessCode_startsAt_endsAt_idx" ON "AccessCode"("startsAt", "endsAt");
