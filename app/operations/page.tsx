import Link from "next/link";
import { serverFetchJson } from "@/lib/server/server-fetch";
import OperationsCasesClient from "./operations-cases-client";

type OperationsSummary = {
  now: string;
  next24h: string;
  checkingInNext24h: number;
  withoutSentAccessCodeInWindow: number;
  missingPhoneInWindow: number;
  generatedNotSentInWindow: number;
  failedAccessCodes: number;
};

type OperationsCase = {
  issueType:
    | "MISSING_PHONE"
    | "PRECHECKIN_NOT_SENT"
    | "ACCESS_CODE_FAILED"
    | "GENERATED_NOT_SENT";
  message: string;
  recommendedActions: string[];
  actionLinks: {
    openBooking: string;
    editBooking: string;
  };
  actionState: {
    canOpenBooking: boolean;
    canEditGuest: boolean;
    canGenerate: boolean;
    canSend: boolean;
  };
  delivery: {
    attempts: number;
    lastAttemptAt: string | null;
    lastStatus: string | null;
    lastError: string | null;
    lastRecipient: string | null;
  };
  booking: {
    id: string;
    reference: string | null;
    status: string;
    checkInDate: string;
    checkOutDate: string;
    guest: { fullName: string; phone: string | null };
    unit: { name: string; property: { name: string } };
    accessCode: { id: string; status: string; errorMessage: string | null } | null;
  };
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function IssueBadge({ issueType }: { issueType: OperationsCase["issueType"] }) {
  const styles: Record<string, string> = {
    MISSING_PHONE: "bg-amber-50 text-amber-700 ring-amber-100",
    PRECHECKIN_NOT_SENT: "bg-blue-50 text-blue-700 ring-blue-100",
    ACCESS_CODE_FAILED: "bg-red-50 text-red-700 ring-red-100",
    GENERATED_NOT_SENT: "bg-purple-50 text-purple-700 ring-purple-100",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
        styles[issueType] ?? "bg-gray-50 text-gray-700 ring-gray-100"
      }`}
    >
      {issueType}
    </span>
  );
}

async function getSummary(): Promise<OperationsSummary> {
  return serverFetchJson<OperationsSummary>("/api/operations/summary");
}

async function getCases(): Promise<OperationsCase[]> {
  return serverFetchJson<OperationsCase[]>("/api/operations/cases");
}

export default async function OperationsPage() {
  const [summary, cases] = await Promise.all([getSummary(), getCases()]);

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Operations</h1>
          <p className="text-sm text-gray-600">
            Alertas operativas y reservas que requieren acción.
          </p>
        </div>

        <Link
          href="/bookings"
          className="rounded-xl border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Ver bookings
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase text-gray-500">
            Check-ins 24h
          </div>
          <div className="mt-2 text-2xl font-bold">{summary.checkingInNext24h}</div>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase text-gray-500">
            Sin SENT (24h)
          </div>
          <div className="mt-2 text-2xl font-bold">
            {summary.withoutSentAccessCodeInWindow}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase text-gray-500">
            Falta teléfono (24h)
          </div>
          <div className="mt-2 text-2xl font-bold">{summary.missingPhoneInWindow}</div>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase text-gray-500">
            GENERATED no enviado
          </div>
          <div className="mt-2 text-2xl font-bold">
            {summary.generatedNotSentInWindow}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase text-gray-500">
            Access FAILED
          </div>
          <div className="mt-2 text-2xl font-bold">{summary.failedAccessCodes}</div>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-4">
          <div className="font-semibold">Needs attention</div>
          <div className="text-xs text-gray-500">
            Ventana evaluada: {formatDate(summary.now)} → {formatDate(summary.next24h)}
          </div>
        </div>

        <OperationsCasesClient cases={cases} />
      </div>
    </main>
  );
}

