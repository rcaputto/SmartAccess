-- CreateTable
CREATE TABLE "PropertyFinanceProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "purchasePrice" REAL NOT NULL,
    "downPayment" REAL NOT NULL,
    "purchaseTaxes" REAL NOT NULL,
    "notaryCosts" REAL NOT NULL,
    "otherAcquisitionCosts" REAL NOT NULL,
    "bankName" TEXT,
    "mortgagePrincipal" REAL NOT NULL,
    "termMonths" INTEGER NOT NULL,
    "annualInterestRate" REAL NOT NULL,
    "rateType" TEXT NOT NULL,
    "bonusConditions" TEXT,
    "startDate" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PropertyFinanceProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PropertyFinanceProfile_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MortgageEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "financeProfileId" TEXT,
    "date" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "totalAmount" REAL NOT NULL,
    "interestAmount" REAL NOT NULL,
    "principalAmount" REAL NOT NULL,
    "remainingPrincipal" REAL NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MortgageEntry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MortgageEntry_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MortgageEntry_financeProfileId_fkey" FOREIGN KEY ("financeProfileId") REFERENCES "PropertyFinanceProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PropertyExpense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "category" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "description" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PropertyExpense_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PropertyExpense_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PropertyFinanceProfile_propertyId_key" ON "PropertyFinanceProfile"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyFinanceProfile_organizationId_idx" ON "PropertyFinanceProfile"("organizationId");

-- CreateIndex
CREATE INDEX "PropertyFinanceProfile_propertyId_idx" ON "PropertyFinanceProfile"("propertyId");

-- CreateIndex
CREATE INDEX "MortgageEntry_organizationId_idx" ON "MortgageEntry"("organizationId");

-- CreateIndex
CREATE INDEX "MortgageEntry_propertyId_date_idx" ON "MortgageEntry"("propertyId", "date");

-- CreateIndex
CREATE INDEX "MortgageEntry_financeProfileId_idx" ON "MortgageEntry"("financeProfileId");

-- CreateIndex
CREATE INDEX "PropertyExpense_organizationId_idx" ON "PropertyExpense"("organizationId");

-- CreateIndex
CREATE INDEX "PropertyExpense_propertyId_date_idx" ON "PropertyExpense"("propertyId", "date");

-- CreateIndex
CREATE INDEX "PropertyExpense_category_idx" ON "PropertyExpense"("category");
