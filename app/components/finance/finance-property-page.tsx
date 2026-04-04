"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/app/components/ui/toast";
import SaasCard from "@/app/components/ui/saas-card";
import SectionHeader from "@/app/components/ui/section-header";
import StatBlock from "@/app/components/ui/stat-block";

import type {
  MortgageEntryType,
  PropertyExpenseCategory,
  PropertyFinanceRateType,
} from "@prisma/client";

type FinanceProfile = {
  id: string;
  organizationId: string;
  propertyId: string;
  purchasePrice: number;
  downPayment: number;
  purchaseTaxes: number;
  notaryCosts: number;
  otherAcquisitionCosts: number;
  bankName: string | null;
  mortgagePrincipal: number;
  termMonths: number;
  annualInterestRate: number;
  rateType: PropertyFinanceRateType;
  bonusConditions: string | null;
  startDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type MortgageAggregate = {
  numberOfEntries: number;
  totalPaid: number;
  totalInterestPaid: number;
  totalPrincipalAmortized: number;
  latestRemainingPrincipal: number | null;
  latestRemainingPrincipalAt: string | null;
};

type ExpenseAggregate = {
  totalExpenses: number;
  totalsByCategory: Record<string, number>;
  latestExpenses: Array<{
    id: string;
    date: string;
    category: PropertyExpenseCategory;
    amount: number;
    description: string | null;
    isRecurring: boolean;
  }>;
};

export type FinanceSummary = {
  property: { id: string; name: string };
  financeProfile: FinanceProfile | null;
  mortgageAggregate: MortgageAggregate;
  expenseAggregate: ExpenseAggregate;
};

function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "-";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function toDateInputValue(value: string | null | undefined) {
  if (!value) return "";
  return value.slice(0, 10);
}

function parseOptionalMoney(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function parseRequiredMoney(value: string, fieldName: string) {
  const n = parseOptionalMoney(value);
  if (n === null) {
    throw new Error(`Valor inválido: ${fieldName}`);
  }
  if (n < 0) {
    throw new Error(`${fieldName} debe ser >= 0`);
  }
  return n;
}

export default function FinancePropertyPage({
  propertyId,
  summary,
}: {
  propertyId: string;
  summary: FinanceSummary;
}) {
  const router = useRouter();
  const { showToast } = useToast();

  const profile = summary.financeProfile;

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isAddingMortgage, setIsAddingMortgage] = useState(false);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isProfileFormOpen, setIsProfileFormOpen] = useState(false);

  const initialProfileValues = useMemo(() => {
    return {
      purchasePrice: profile ? String(profile.purchasePrice) : "",
      downPayment: profile ? String(profile.downPayment) : "",
      purchaseTaxes: profile ? String(profile.purchaseTaxes) : "",
      notaryCosts: profile ? String(profile.notaryCosts) : "",
      otherAcquisitionCosts: profile ? String(profile.otherAcquisitionCosts) : "",
      bankName: profile?.bankName ?? "",
      mortgagePrincipal: profile ? String(profile.mortgagePrincipal) : "",
      termMonths: profile ? String(profile.termMonths) : "",
      annualInterestRate: profile ? String(profile.annualInterestRate) : "",
      rateType: profile?.rateType ?? ("FIXED" as PropertyFinanceRateType),
      bonusConditions: profile?.bonusConditions ?? "",
      startDate: toDateInputValue(profile?.startDate ?? null),
      notes: profile?.notes ?? "",
    };
  }, [profile]);

  const [purchasePrice, setPurchasePrice] = useState("");
  const [downPayment, setDownPayment] = useState("");
  const [purchaseTaxes, setPurchaseTaxes] = useState("");
  const [notaryCosts, setNotaryCosts] = useState("");
  const [otherAcquisitionCosts, setOtherAcquisitionCosts] = useState("");
  const [bankName, setBankName] = useState("");
  const [mortgagePrincipal, setMortgagePrincipal] = useState("");
  const [termMonths, setTermMonths] = useState("");
  const [annualInterestRate, setAnnualInterestRate] = useState("");
  const [rateType, setRateType] = useState<PropertyFinanceRateType>(
    "FIXED" as PropertyFinanceRateType
  );
  const [bonusConditions, setBonusConditions] = useState("");
  const [startDate, setStartDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setPurchasePrice(initialProfileValues.purchasePrice);
    setDownPayment(initialProfileValues.downPayment);
    setPurchaseTaxes(initialProfileValues.purchaseTaxes);
    setNotaryCosts(initialProfileValues.notaryCosts);
    setOtherAcquisitionCosts(initialProfileValues.otherAcquisitionCosts);
    setBankName(initialProfileValues.bankName);
    setMortgagePrincipal(initialProfileValues.mortgagePrincipal);
    setTermMonths(initialProfileValues.termMonths);
    setAnnualInterestRate(initialProfileValues.annualInterestRate);
    setRateType(initialProfileValues.rateType);
    setBonusConditions(initialProfileValues.bonusConditions);
    setStartDate(initialProfileValues.startDate);
    setNotes(initialProfileValues.notes);
  }, [initialProfileValues]);

  const mortgageTypes: MortgageEntryType[] = [
    "PAYMENT",
    "EXTRA_PAYMENT",
    "BANK_FEE",
    "TAX",
    "INSURANCE_LINKED",
  ];

  const expenseCategories: PropertyExpenseCategory[] = [
    "INSURANCE",
    "CLEANING",
    "UTILITIES",
    "PROPERTY_TAX",
    "MAINTENANCE",
    "REPAIRS",
    "IMPROVEMENT",
    "COMMUNITY_FEES",
    "OTHER",
  ];

  const [mortgageDate, setMortgageDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [mortgageType, setMortgageType] = useState<MortgageEntryType>("PAYMENT");
  const [mortgageTotalAmount, setMortgageTotalAmount] = useState("");
  const [mortgageInterestAmount, setMortgageInterestAmount] = useState("");
  const [mortgagePrincipalAmount, setMortgagePrincipalAmount] = useState("");
  const [mortgageRemainingPrincipal, setMortgageRemainingPrincipal] = useState("");
  const [mortgageNotes, setMortgageNotes] = useState("");

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setIsSavingProfile(true);

    try {
      const termMonthsN = Number(termMonths);
      if (!Number.isFinite(termMonthsN) || !Number.isInteger(termMonthsN) || termMonthsN <= 0) {
        throw new Error("El plazo (meses) debe ser un entero positivo");
      }

      const payload = {
        purchasePrice: parseRequiredMoney(purchasePrice, "purchasePrice"),
        downPayment: parseRequiredMoney(downPayment, "downPayment"),
        purchaseTaxes: parseRequiredMoney(purchaseTaxes, "purchaseTaxes"),
        notaryCosts: parseRequiredMoney(notaryCosts, "notaryCosts"),
        otherAcquisitionCosts: parseRequiredMoney(
          otherAcquisitionCosts,
          "otherAcquisitionCosts"
        ),
        bankName: bankName.trim() ? bankName.trim() : null,
        mortgagePrincipal: parseRequiredMoney(
          mortgagePrincipal,
          "mortgagePrincipal"
        ),
        termMonths: termMonthsN,
        annualInterestRate: parseRequiredMoney(
          annualInterestRate,
          "annualInterestRate"
        ),
        rateType,
        bonusConditions: bonusConditions.trim() ? bonusConditions.trim() : null,
        startDate: startDate ? new Date(startDate).toISOString() : null,
        notes: notes.trim() ? notes.trim() : null,
      };

      const res = await fetch(`/api/finance/properties/${propertyId}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let backend = "";
        try {
          backend = (await res.json()).error ?? "";
        } catch {}
        throw new Error(backend || "No se pudo guardar el perfil financiero");
      }

      showToast({
        type: "success",
        title: "Perfil financiero guardado",
        message: "Se actualizó la configuración de compra y financiación.",
      });
      router.refresh();
    } catch (err) {
      showToast({
        type: "error",
        title: "No se pudo guardar",
        message: err instanceof Error ? err.message : "Error inesperado",
      });
    } finally {
      setIsSavingProfile(false);
    }
  }

  const [expenseDate, setExpenseDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [expenseCategory, setExpenseCategory] =
    useState<PropertyExpenseCategory>("INSURANCE");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseIsRecurring, setExpenseIsRecurring] = useState(false);
  const [expenseNotes, setExpenseNotes] = useState("");

  async function handleAddMortgageEntry(e: React.FormEvent) {
    e.preventDefault();
    setIsAddingMortgage(true);

    try {
      const payload = {
        date: new Date(mortgageDate).toISOString(),
        type: mortgageType,
        totalAmount: parseRequiredMoney(mortgageTotalAmount, "totalAmount"),
        interestAmount: parseRequiredMoney(
          mortgageInterestAmount,
          "interestAmount"
        ),
        principalAmount: parseRequiredMoney(
          mortgagePrincipalAmount,
          "principalAmount"
        ),
        remainingPrincipal: parseRequiredMoney(
          mortgageRemainingPrincipal,
          "remainingPrincipal"
        ),
        notes: mortgageNotes.trim() ? mortgageNotes.trim() : null,
      };

      const res = await fetch(
        `/api/finance/properties/${propertyId}/mortgage-entries`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        let backend = "";
        try {
          backend = (await res.json()).error ?? "";
        } catch {}
        throw new Error(backend || "No se pudo agregar el registro de hipoteca");
      }

      showToast({
        type: "success",
        title: "Registro de hipoteca agregado",
        message: "Se actualizó el resumen con el nuevo pago.",
      });
      setMortgageTotalAmount("");
      setMortgageInterestAmount("");
      setMortgagePrincipalAmount("");
      setMortgageRemainingPrincipal("");
      setMortgageNotes("");
      router.refresh();
    } catch (err) {
      showToast({
        type: "error",
        title: "No se pudo agregar",
        message: err instanceof Error ? err.message : "Error inesperado",
      });
    } finally {
      setIsAddingMortgage(false);
    }
  }

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    setIsAddingExpense(true);

    try {
      const payload = {
        date: new Date(expenseDate).toISOString(),
        category: expenseCategory,
        amount: parseRequiredMoney(expenseAmount, "amount"),
        description: expenseDescription.trim() ? expenseDescription.trim() : null,
        isRecurring: expenseIsRecurring,
        notes: expenseNotes.trim() ? expenseNotes.trim() : null,
      };

      const res = await fetch(`/api/finance/properties/${propertyId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let backend = "";
        try {
          backend = (await res.json()).error ?? "";
        } catch {}
        throw new Error(backend || "No se pudo agregar el gasto");
      }

      showToast({
        type: "success",
        title: "Gasto agregado",
        message: "Se actualizó el resumen de gastos operativos.",
      });
      setExpenseAmount("");
      setExpenseDescription("");
      setExpenseNotes("");
      setExpenseIsRecurring(false);
      router.refresh();
    } catch (err) {
      showToast({
        type: "error",
        title: "No se pudo agregar",
        message: err instanceof Error ? err.message : "Error inesperado",
      });
    } finally {
      setIsAddingExpense(false);
    }
  }

  return (
    <div className="page-section mx-auto w-full max-w-7xl">
      <SectionHeader
        eyebrow="Finanzas"
        title={summary.property.name}
        subtitle="Resumen de compra, hipoteca y gastos operativos por propiedad."
        actions={
          <Link href="/bookings" className="btn btn-secondary btn-sm">
            Volver a reservas
          </Link>
        }
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <SaasCard title="Compra y financiación" className="lg:col-span-1">

          {profile ? (
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-1 gap-1 py-2 sm:grid-cols-[140px_1fr]">
                <div className="text-sm font-medium text-gray-500">Precio de compra</div>
                <div className="text-sm text-gray-900">
                  {formatMoney(profile.purchasePrice)}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-1 py-2 sm:grid-cols-[140px_1fr]">
                <div className="text-sm font-medium text-gray-500">Aporte inicial</div>
                <div className="text-sm text-gray-900">
                  {formatMoney(profile.downPayment)}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-1 py-2 sm:grid-cols-[140px_1fr]">
                <div className="text-sm font-medium text-gray-500">Impuestos de compra</div>
                <div className="text-sm text-gray-900">
                  {formatMoney(profile.purchaseTaxes)}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-1 py-2 sm:grid-cols-[140px_1fr]">
                <div className="text-sm font-medium text-gray-500">Gastos de notaría</div>
                <div className="text-sm text-gray-900">
                  {formatMoney(profile.notaryCosts)}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-1 py-2 sm:grid-cols-[140px_1fr]">
                <div className="text-sm font-medium text-gray-500">Otros costos de adquisición</div>
                <div className="text-sm text-gray-900">
                  {formatMoney(profile.otherAcquisitionCosts)}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-1 py-2 sm:grid-cols-[140px_1fr]">
                <div className="text-sm font-medium text-gray-500">Banco</div>
                <div className="text-sm text-gray-900">
                  {profile.bankName ?? "-"}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-1 py-2 sm:grid-cols-[140px_1fr]">
                <div className="text-sm font-medium text-gray-500">Principal de hipoteca</div>
                <div className="text-sm text-gray-900">
                  {formatMoney(profile.mortgagePrincipal)}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-1 py-2 sm:grid-cols-[140px_1fr]">
                <div className="text-sm font-medium text-gray-500">Plazo (meses)</div>
                <div className="text-sm text-gray-900">{profile.termMonths}</div>
              </div>

              <div className="grid grid-cols-1 gap-1 py-2 sm:grid-cols-[140px_1fr]">
                <div className="text-sm font-medium text-gray-500">Interés anual</div>
                <div className="text-sm text-gray-900">
                  {profile.annualInterestRate}%
                </div>
              </div>

              <div className="grid grid-cols-1 gap-1 py-2 sm:grid-cols-[140px_1fr]">
                <div className="text-sm font-medium text-gray-500">Tipo de tasa</div>
                <div className="text-sm text-gray-900">{profile.rateType}</div>
              </div>

              <div className="grid grid-cols-1 gap-1 py-2 sm:grid-cols-[140px_1fr]">
                <div className="text-sm font-medium text-gray-500">Fecha de inicio</div>
                <div className="text-sm text-gray-900">{formatDate(profile.startDate)}</div>
              </div>

              {profile.bonusConditions ? (
                <div className="pt-2 text-xs text-gray-700">
                  <div className="font-medium text-gray-600">Condiciones de bonificación</div>
                  <div className="whitespace-pre-wrap">{profile.bonusConditions}</div>
                </div>
              ) : null}
              {profile.notes ? (
                <div className="pt-2 text-xs text-gray-700">
                  <div className="font-medium text-gray-600">Notas</div>
                  <div className="whitespace-pre-wrap">{profile.notes}</div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed bg-gray-50 p-4 text-sm text-gray-600">
              Todavía no hay un perfil financiero. Selecciona “Configurar perfil financiero” para cargar la compra y la hipoteca.
            </div>
          )}

          <div className="mt-4 pt-4">
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-xl border bg-gray-50 px-4 py-3 text-left text-sm font-semibold text-gray-900 hover:bg-gray-100"
              onClick={() => setIsProfileFormOpen((v) => !v)}
              aria-expanded={isProfileFormOpen}
            >
              <span>Configurar perfil financiero</span>
              <span className="text-xs font-medium text-gray-600">
                {isProfileFormOpen ? "Ocultar" : "Mostrar"}
              </span>
            </button>

            {isProfileFormOpen ? (
              <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Precio de compra
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Aporte inicial
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    value={downPayment}
                    onChange={(e) => setDownPayment(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Impuestos de compra
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    value={purchaseTaxes}
                    onChange={(e) => setPurchaseTaxes(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Gastos de notaría
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    value={notaryCosts}
                    onChange={(e) => setNotaryCosts(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Otros costos de adquisición
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                  value={otherAcquisitionCosts}
                  onChange={(e) => setOtherAcquisitionCosts(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Banco (opcional)
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Principal de hipoteca
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    value={mortgagePrincipal}
                    onChange={(e) => setMortgagePrincipal(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Plazo (meses)
                  </label>
                  <input
                    type="number"
                    step="1"
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    value={termMonths}
                    onChange={(e) => setTermMonths(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Tasa de interés anual (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    value={annualInterestRate}
                    onChange={(e) => setAnnualInterestRate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Tipo de tasa
                  </label>
                  <select
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    value={rateType}
                    onChange={(e) => setRateType(e.target.value as PropertyFinanceRateType)}
                    required
                  >
                    <option value="FIXED">FIXED</option>
                    <option value="VARIABLE">VARIABLE</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Fecha de inicio (opcional)
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Condiciones de bonificación (opcional)
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    value={bonusConditions}
                    onChange={(e) => setBonusConditions(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Notas (opcional)
                </label>
                <textarea
                  className="min-h-[96px] w-full rounded-xl border px-3 py-2 text-sm"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {isSavingProfile ? "Guardando..." : "Guardar perfil"}
                </button>
              </div>
              </form>
            ) : null}
          </div>
        </SaasCard>

        <SaasCard
          title="Hipoteca"
          description="Detalle de pagos registrados y capital pendiente."
          className="lg:col-span-2"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatBlock
              label="Registros"
              value={summary.mortgageAggregate.numberOfEntries}
            />
            <StatBlock
              label="Total pagado"
              value={formatMoney(summary.mortgageAggregate.totalPaid)}
            />
            <StatBlock
              label="Interés total"
              value={formatMoney(summary.mortgageAggregate.totalInterestPaid)}
            />
            <StatBlock
              label="Amortización total"
              value={formatMoney(summary.mortgageAggregate.totalPrincipalAmortized)}
            />
          </div>

          <div className="mt-6">
            <StatBlock
              label="Último capital pendiente"
              value={
                summary.mortgageAggregate.latestRemainingPrincipal === null
                  ? "—"
                  : formatMoney(summary.mortgageAggregate.latestRemainingPrincipal)
              }
              hint={
                summary.mortgageAggregate.latestRemainingPrincipalAt
                  ? `Al ${formatDate(summary.mortgageAggregate.latestRemainingPrincipalAt)}`
                  : "Todavía no hay registros de hipoteca"
              }
            />
          </div>

          <div className="mt-8 border-t border-[var(--border)] pt-6">
            <h3 className="mb-4 text-sm font-bold text-slate-900">Agregar registro de hipoteca</h3>
            <form onSubmit={handleAddMortgageEntry} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="field-group">
                  <label className="field-label text-[var(--foreground)]">
                    Fecha
                  </label>
                  <input
                    type="date"
                    className="input"
                    value={mortgageDate}
                    onChange={(e) => setMortgageDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Tipo
                  </label>
                  <select
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    value={mortgageType}
                    onChange={(e) => setMortgageType(e.target.value as MortgageEntryType)}
                    required
                  >
                    {mortgageTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Importe total
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    value={mortgageTotalAmount}
                    onChange={(e) => setMortgageTotalAmount(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Interés
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    value={mortgageInterestAmount}
                    onChange={(e) => setMortgageInterestAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Amortización (capital)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    value={mortgagePrincipalAmount}
                    onChange={(e) => setMortgagePrincipalAmount(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Capital pendiente
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    value={mortgageRemainingPrincipal}
                    onChange={(e) => setMortgageRemainingPrincipal(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Notas (opcional)
                </label>
                <textarea
                  className="min-h-[72px] w-full rounded-xl border px-3 py-2 text-sm"
                  value={mortgageNotes}
                  onChange={(e) => setMortgageNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="submit"
                  disabled={isAddingMortgage}
                  className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {isAddingMortgage ? "Agregando..." : "Agregar"}
                </button>
              </div>
            </form>
          </div>
        </SaasCard>

        <SaasCard
          title="Gastos operativos"
          description="Totales por categoría, listado reciente y alta de gastos."
          className="lg:col-span-3"
        >
          <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
            <div>
              <div className="rounded-xl border bg-gray-50 p-4 text-sm">
                <div className="text-gray-600">Total de gastos</div>
                <div className="mt-2 text-lg font-semibold">
                  {formatMoney(summary.expenseAggregate.totalExpenses)}
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-gray-600">
                    <tr>
                      <th className="px-3 py-3 font-medium">Categoría</th>
                      <th className="px-3 py-3 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {Object.entries(summary.expenseAggregate.totalsByCategory).length ? (
                      Object.entries(summary.expenseAggregate.totalsByCategory).map(
                        ([category, total]) => (
                          <tr key={category}>
                            <td className="px-3 py-2 text-gray-800">{category}</td>
                            <td className="px-3 py-2 font-medium">
                              {formatMoney(total)}
                            </td>
                          </tr>
                        )
                      )
                    ) : (
                      <tr>
                        <td className="px-3 py-3 text-gray-600" colSpan={2}>
                          Todavía no hay gastos.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <div className="rounded-xl border bg-gray-50 p-4 text-sm">
                <div className="text-gray-600">Gastos recientes</div>
                <div className="mt-3 overflow-hidden rounded-xl border">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-left text-gray-600">
                      <tr>
                        <th className="px-3 py-2 font-medium">Fecha</th>
                        <th className="px-3 py-2 font-medium">Importe</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {summary.expenseAggregate.latestExpenses.length ? (
                        summary.expenseAggregate.latestExpenses.slice(0, 5).map((e) => (
                          <tr key={e.id}>
                            <td className="px-3 py-2">
                              <div className="font-medium text-gray-800">{e.category}</div>
                              <div className="text-xs text-gray-500">{formatDate(e.date)}</div>
                              {e.description ? (
                                <div className="text-xs text-gray-500 truncate">
                                  {e.description}
                                </div>
                              ) : null}
                              {e.isRecurring ? (
                                <div className="text-xs text-amber-700">Recurrente</div>
                              ) : null}
                            </td>
                            <td className="px-3 py-2 font-medium text-gray-900">
                              {formatMoney(e.amount)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="px-3 py-3 text-gray-600" colSpan={2}>
                            Todavía no hay gastos.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold">Agregar gasto</h3>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Fecha
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Categoría
                  </label>
                  <select
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    value={expenseCategory}
                    onChange={(e) =>
                      setExpenseCategory(
                        e.target.value as PropertyExpenseCategory
                      )
                    }
                    required
                  >
                    {expenseCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Importe
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={expenseIsRecurring}
                      onChange={(e) => setExpenseIsRecurring(e.target.checked)}
                    />
                    Es recurrente
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Descripción (opcional)
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Notas (opcional)
                </label>
                <textarea
                  className="min-h-[72px] w-full rounded-xl border px-3 py-2 text-sm"
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="submit"
                  disabled={isAddingExpense}
                  className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {isAddingExpense ? "Agregando..." : "Agregar"}
                </button>
              </div>
            </form>
          </div>
        </SaasCard>
      </div>
    </div>
  );
}

