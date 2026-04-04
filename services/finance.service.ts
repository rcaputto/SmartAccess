import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "./audit.service";
import {
  MortgageEntryType,
  PropertyExpenseCategory,
  PropertyFinanceRateType,
  type AuditActorType,
} from "@prisma/client";

export class FinanceServiceError extends Error {
  statusCode: number;
  details?: Record<string, unknown>;

  constructor(message: string, statusCode = 400, details?: Record<string, unknown>) {
    super(message);
    this.name = "FinanceServiceError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function isFinanceServiceError(error: unknown): error is FinanceServiceError {
  return error instanceof FinanceServiceError;
}

function parseDate(value: string, fieldName: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new FinanceServiceError(`Invalid ${fieldName}`, 400);
  }
  return d;
}

function normalizeOptionalString(value?: string | null) {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function requireFiniteNumber(value: unknown, fieldName: string) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) {
    throw new FinanceServiceError(`Invalid ${fieldName}`, 400);
  }
  return n;
}

function requireNonNegativeNumber(value: unknown, fieldName: string) {
  const n = requireFiniteNumber(value, fieldName);
  if (n < 0) {
    throw new FinanceServiceError(`${fieldName} must be >= 0`, 400);
  }
  return n;
}

function requireInt(value: unknown, fieldName: string) {
  const n = requireFiniteNumber(value, fieldName);
  if (!Number.isInteger(n)) {
    throw new FinanceServiceError(`${fieldName} must be an integer`, 400);
  }
  return n;
}

async function assertPropertyInOrganization(params: {
  organizationId: string;
  propertyId: string;
}) {
  const { organizationId, propertyId } = params;
  const property = await prisma.property.findFirst({
    where: { id: propertyId, organizationId },
    select: { id: true, name: true },
  });

  if (!property) {
    throw new FinanceServiceError("Property not found", 404);
  }

  return property;
}

export type UpsertFinanceProfileInput = {
  purchasePrice: number;
  downPayment: number;
  purchaseTaxes: number;
  notaryCosts: number;
  otherAcquisitionCosts: number;
  bankName?: string | null;

  mortgagePrincipal: number;
  termMonths: number;
  annualInterestRate: number;
  rateType: PropertyFinanceRateType;

  bonusConditions?: string | null;
  startDate?: string | null;
  notes?: string | null;
};

export async function upsertPropertyFinanceProfile(params: {
  organizationId: string;
  propertyId: string;
  input: UpsertFinanceProfileInput;
  actorType?: AuditActorType;
}) {
  const { organizationId, propertyId, input } = params;

  const property = await assertPropertyInOrganization({ organizationId, propertyId });

  const existing = await prisma.propertyFinanceProfile.findUnique({
    where: { propertyId },
  });

  const parsedStartDate =
    input.startDate ? parseDate(input.startDate, "startDate") : null;

  const actorType: AuditActorType = params.actorType ?? "MANUAL";

  const rateType = input.rateType;
  if (!Object.values(PropertyFinanceRateType).includes(rateType)) {
    throw new FinanceServiceError("Invalid rateType", 400);
  }

  const profile = await prisma.propertyFinanceProfile.upsert({
    where: { propertyId: property.id },
    create: {
      organizationId,
      propertyId: property.id,
      purchasePrice: requireNonNegativeNumber(input.purchasePrice, "purchasePrice"),
      downPayment: requireNonNegativeNumber(input.downPayment, "downPayment"),
      purchaseTaxes: requireNonNegativeNumber(input.purchaseTaxes, "purchaseTaxes"),
      notaryCosts: requireNonNegativeNumber(input.notaryCosts, "notaryCosts"),
      otherAcquisitionCosts: requireNonNegativeNumber(
        input.otherAcquisitionCosts,
        "otherAcquisitionCosts"
      ),
      bankName: normalizeOptionalString(input.bankName),

      mortgagePrincipal: requireNonNegativeNumber(input.mortgagePrincipal, "mortgagePrincipal"),
      termMonths: requireInt(input.termMonths, "termMonths"),
      annualInterestRate: requireNonNegativeNumber(input.annualInterestRate, "annualInterestRate"),
      rateType,

      bonusConditions: normalizeOptionalString(input.bonusConditions),
      startDate: parsedStartDate,
      notes: normalizeOptionalString(input.notes),
    },
    update: {
      purchasePrice: requireNonNegativeNumber(input.purchasePrice, "purchasePrice"),
      downPayment: requireNonNegativeNumber(input.downPayment, "downPayment"),
      purchaseTaxes: requireNonNegativeNumber(input.purchaseTaxes, "purchaseTaxes"),
      notaryCosts: requireNonNegativeNumber(input.notaryCosts, "notaryCosts"),
      otherAcquisitionCosts: requireNonNegativeNumber(
        input.otherAcquisitionCosts,
        "otherAcquisitionCosts"
      ),
      bankName: normalizeOptionalString(input.bankName),

      mortgagePrincipal: requireNonNegativeNumber(input.mortgagePrincipal, "mortgagePrincipal"),
      termMonths: requireInt(input.termMonths, "termMonths"),
      annualInterestRate: requireNonNegativeNumber(input.annualInterestRate, "annualInterestRate"),
      rateType,

      bonusConditions: normalizeOptionalString(input.bonusConditions),
      startDate: parsedStartDate,
      notes: normalizeOptionalString(input.notes),
    },
  });

  await writeAuditLog({
    organizationId,
    entityType: "PROPERTY_FINANCE_PROFILE",
    entityId: profile.id,
    action: "FINANCE_PROFILE_UPSERTED",
    actorType,
    details: {
      propertyId: property.id,
      created: !existing,
    },
  });

  return profile;
}

export type CreateMortgageEntryInput = {
  date: string;
  type: MortgageEntryType;

  totalAmount: number;
  interestAmount: number;
  principalAmount: number;
  remainingPrincipal: number;

  notes?: string | null;
};

export async function createMortgageEntry(params: {
  organizationId: string;
  propertyId: string;
  input: CreateMortgageEntryInput;
  actorType?: AuditActorType;
}) {
  const { organizationId, propertyId, input } = params;

  const property = await assertPropertyInOrganization({ organizationId, propertyId });

  const type = input.type;
  if (!Object.values(MortgageEntryType).includes(type)) {
    throw new FinanceServiceError("Invalid mortgage entry type", 400);
  }

  const financeProfile = await prisma.propertyFinanceProfile.findUnique({
    where: { propertyId: property.id },
    select: { id: true },
  });

  const date = parseDate(input.date, "date");
  const notes = normalizeOptionalString(input.notes);

  const created = await prisma.mortgageEntry.create({
    data: {
      organizationId,
      propertyId: property.id,
      financeProfileId: financeProfile?.id ?? null,
      date,
      type,
      totalAmount: requireNonNegativeNumber(input.totalAmount, "totalAmount"),
      interestAmount: requireNonNegativeNumber(input.interestAmount, "interestAmount"),
      principalAmount: requireNonNegativeNumber(input.principalAmount, "principalAmount"),
      remainingPrincipal: requireNonNegativeNumber(
        input.remainingPrincipal,
        "remainingPrincipal"
      ),
      notes,
    },
  });

  const actorType: AuditActorType = params.actorType ?? "MANUAL";

  await writeAuditLog({
    organizationId,
    entityType: "MORTGAGE_ENTRY",
    entityId: created.id,
    action: "MORTGAGE_ENTRY_CREATED",
    actorType,
    details: {
      propertyId: property.id,
      type: created.type,
      date: created.date.toISOString(),
    },
  });

  return created;
}

export type CreatePropertyExpenseInput = {
  date: string;
  category: PropertyExpenseCategory;
  amount: number;

  description?: string | null;
  isRecurring?: boolean;
  notes?: string | null;
};

export async function createPropertyExpense(params: {
  organizationId: string;
  propertyId: string;
  input: CreatePropertyExpenseInput;
  actorType?: AuditActorType;
}) {
  const { organizationId, propertyId, input } = params;

  const property = await assertPropertyInOrganization({ organizationId, propertyId });

  const category = input.category;
  if (!Object.values(PropertyExpenseCategory).includes(category)) {
    throw new FinanceServiceError("Invalid expense category", 400);
  }

  const date = parseDate(input.date, "date");
  const notes = normalizeOptionalString(input.notes);
  const description = normalizeOptionalString(input.description);
  const isRecurring = Boolean(input.isRecurring);

  const created = await prisma.propertyExpense.create({
    data: {
      organizationId,
      propertyId: property.id,
      date,
      category,
      amount: requireNonNegativeNumber(input.amount, "amount"),
      description,
      isRecurring,
      notes,
    },
  });

  const actorType: AuditActorType = params.actorType ?? "MANUAL";

  await writeAuditLog({
    organizationId,
    entityType: "PROPERTY_EXPENSE",
    entityId: created.id,
    action: "PROPERTY_EXPENSE_CREATED",
    actorType,
    details: {
      propertyId: property.id,
      category: created.category,
      date: created.date.toISOString(),
    },
  });

  return created;
}

export async function getPropertyFinanceSummary(params: {
  organizationId: string;
  propertyId: string;
}) {
  const { organizationId, propertyId } = params;

  const property = await assertPropertyInOrganization({ organizationId, propertyId });

  const [financeProfile, mortgageCount, mortgageSums, latestMortgage, expenseSums, expenseByCategory, latestExpenses] =
    await Promise.all([
      prisma.propertyFinanceProfile.findUnique({
        where: { propertyId: property.id },
      }),
      prisma.mortgageEntry.count({
        where: { organizationId, propertyId: property.id },
      }),
      prisma.mortgageEntry.aggregate({
        where: { organizationId, propertyId: property.id },
        _sum: {
          totalAmount: true,
          interestAmount: true,
          principalAmount: true,
        },
      }),
      prisma.mortgageEntry.findFirst({
        where: { organizationId, propertyId: property.id },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        select: { remainingPrincipal: true, date: true },
      }),
      prisma.propertyExpense.aggregate({
        where: { organizationId, propertyId: property.id },
        _sum: { amount: true },
      }),
      prisma.propertyExpense.groupBy({
        by: ["category"],
        where: { organizationId, propertyId: property.id },
        _sum: { amount: true },
      }),
      prisma.propertyExpense.findMany({
        where: { organizationId, propertyId: property.id },
        orderBy: { date: "desc" },
        take: 10,
        select: {
          id: true,
          date: true,
          category: true,
          amount: true,
          description: true,
          isRecurring: true,
        },
      }),
    ]);

  const totalPaid = Number(mortgageSums._sum?.totalAmount ?? 0);
  const totalInterestPaid = Number(mortgageSums._sum?.interestAmount ?? 0);
  const totalPrincipalAmortized = Number(mortgageSums._sum?.principalAmount ?? 0);

  const latestRemainingPrincipal = latestMortgage?.remainingPrincipal ?? null;

  const totalsByCategory: Record<string, number> = {};
  for (const row of expenseByCategory) {
    totalsByCategory[row.category] = Number(row._sum.amount ?? 0);
  }

  return {
    property,
    financeProfile,
    mortgageAggregate: {
      numberOfEntries: mortgageCount,
      totalPaid,
      totalInterestPaid,
      totalPrincipalAmortized,
      latestRemainingPrincipal,
      latestRemainingPrincipalAt: latestMortgage?.date?.toISOString() ?? null,
    },
    expenseAggregate: {
      totalExpenses: Number(expenseSums._sum?.amount ?? 0),
      totalsByCategory,
      latestExpenses: latestExpenses.map((e) => ({
        id: e.id,
        date: e.date.toISOString(),
        category: e.category,
        amount: e.amount,
        description: e.description,
        isRecurring: e.isRecurring,
      })),
    },
  };
}

