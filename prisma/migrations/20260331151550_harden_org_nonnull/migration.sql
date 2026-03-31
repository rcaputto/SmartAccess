/*
  Warnings:

  - Made the column `organizationId` on table `AccessCode` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organizationId` on table `AuditLog` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organizationId` on table `Booking` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organizationId` on table `Guest` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organizationId` on table `NotificationDelivery` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organizationId` on table `Property` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organizationId` on table `Unit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organizationId` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `passwordHash` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AccessCode" (
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
    "organizationId" TEXT NOT NULL,
    CONSTRAINT "AccessCode_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AccessCode_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AccessCode" ("bookingId", "code", "createdAt", "endsAt", "errorMessage", "externalId", "id", "lastSyncedAt", "organizationId", "provider", "startsAt", "status", "updatedAt") SELECT "bookingId", "code", "createdAt", "endsAt", "errorMessage", "externalId", "id", "lastSyncedAt", "organizationId", "provider", "startsAt", "status", "updatedAt" FROM "AccessCode";
DROP TABLE "AccessCode";
ALTER TABLE "new_AccessCode" RENAME TO "AccessCode";
CREATE UNIQUE INDEX "AccessCode_bookingId_key" ON "AccessCode"("bookingId");
CREATE INDEX "AccessCode_organizationId_idx" ON "AccessCode"("organizationId");
CREATE INDEX "AccessCode_status_idx" ON "AccessCode"("status");
CREATE INDEX "AccessCode_startsAt_endsAt_idx" ON "AccessCode"("startsAt", "endsAt");
CREATE TABLE "new_AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "actorLabel" TEXT,
    "details" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT NOT NULL,
    CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AuditLog" ("action", "actorLabel", "actorType", "createdAt", "details", "entityId", "entityType", "id", "organizationId") SELECT "action", "actorLabel", "actorType", "createdAt", "details", "entityId", "entityType", "id", "organizationId" FROM "AuditLog";
DROP TABLE "AuditLog";
ALTER TABLE "new_AuditLog" RENAME TO "AuditLog";
CREATE INDEX "AuditLog_organizationId_idx" ON "AuditLog"("organizationId");
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE TABLE "new_Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference" TEXT,
    "checkInDate" DATETIME NOT NULL,
    "checkOutDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "guestCount" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "organizationId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    CONSTRAINT "Booking_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Booking_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Booking_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Booking" ("checkInDate", "checkOutDate", "createdAt", "guestCount", "guestId", "id", "notes", "organizationId", "reference", "status", "unitId", "updatedAt") SELECT "checkInDate", "checkOutDate", "createdAt", "guestCount", "guestId", "id", "notes", "organizationId", "reference", "status", "unitId", "updatedAt" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
CREATE UNIQUE INDEX "Booking_reference_key" ON "Booking"("reference");
CREATE INDEX "Booking_organizationId_idx" ON "Booking"("organizationId");
CREATE INDEX "Booking_unitId_idx" ON "Booking"("unitId");
CREATE INDEX "Booking_guestId_idx" ON "Booking"("guestId");
CREATE INDEX "Booking_checkInDate_checkOutDate_idx" ON "Booking"("checkInDate", "checkOutDate");
CREATE TABLE "new_Guest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "documentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "organizationId" TEXT NOT NULL,
    CONSTRAINT "Guest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Guest" ("createdAt", "documentId", "email", "fullName", "id", "organizationId", "phone", "updatedAt") SELECT "createdAt", "documentId", "email", "fullName", "id", "organizationId", "phone", "updatedAt" FROM "Guest";
DROP TABLE "Guest";
ALTER TABLE "new_Guest" RENAME TO "Guest";
CREATE TABLE "new_NotificationDelivery" (
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
    "organizationId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "accessCodeId" TEXT,
    CONSTRAINT "NotificationDelivery_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NotificationDelivery_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NotificationDelivery_accessCodeId_fkey" FOREIGN KEY ("accessCodeId") REFERENCES "AccessCode" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_NotificationDelivery" ("accessCodeId", "attempt", "body", "bookingId", "channel", "createdAt", "errorMessage", "failedAt", "id", "organizationId", "providerMessageId", "reason", "recipient", "sentAt", "status", "updatedAt") SELECT "accessCodeId", "attempt", "body", "bookingId", "channel", "createdAt", "errorMessage", "failedAt", "id", "organizationId", "providerMessageId", "reason", "recipient", "sentAt", "status", "updatedAt" FROM "NotificationDelivery";
DROP TABLE "NotificationDelivery";
ALTER TABLE "new_NotificationDelivery" RENAME TO "NotificationDelivery";
CREATE INDEX "NotificationDelivery_organizationId_idx" ON "NotificationDelivery"("organizationId");
CREATE INDEX "NotificationDelivery_bookingId_createdAt_idx" ON "NotificationDelivery"("bookingId", "createdAt");
CREATE INDEX "NotificationDelivery_accessCodeId_idx" ON "NotificationDelivery"("accessCodeId");
CREATE INDEX "NotificationDelivery_status_idx" ON "NotificationDelivery"("status");
CREATE TABLE "new_Property" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Property_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Property_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Property" ("address", "city", "country", "createdAt", "id", "name", "organizationId", "updatedAt", "userId") SELECT "address", "city", "country", "createdAt", "id", "name", "organizationId", "updatedAt", "userId" FROM "Property";
DROP TABLE "Property";
ALTER TABLE "new_Property" RENAME TO "Property";
CREATE TABLE "new_Unit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "maxGuests" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "organizationId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    CONSTRAINT "Unit_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Unit_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Unit" ("createdAt", "description", "id", "isActive", "maxGuests", "name", "organizationId", "propertyId", "updatedAt") SELECT "createdAt", "description", "id", "isActive", "maxGuests", "name", "organizationId", "propertyId", "updatedAt" FROM "Unit";
DROP TABLE "Unit";
ALTER TABLE "new_Unit" RENAME TO "Unit";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'OWNER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "organizationId" TEXT NOT NULL,
    CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "email", "fullName", "id", "organizationId", "passwordHash", "role", "updatedAt") SELECT "createdAt", "email", "fullName", "id", "organizationId", "passwordHash", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
