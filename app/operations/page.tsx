import Link from "next/link";
import SectionHeader from "@/app/components/ui/section-header";
import StatBlock from "@/app/components/ui/stat-block";
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

async function getSummary(): Promise<OperationsSummary> {
  return serverFetchJson<OperationsSummary>("/api/operations/summary");
}

async function getCases(): Promise<OperationsCase[]> {
  return serverFetchJson<OperationsCase[]>("/api/operations/cases");
}

export default async function OperationsPage() {
  const [summary, cases] = await Promise.all([getSummary(), getCases()]);

  return (
    <div className="page-section mx-auto w-full max-w-7xl">
      <SectionHeader
        eyebrow="Panel operativo"
        title="Operaciones"
        subtitle="Alertas y reservas que requieren acción en las próximas 24 horas."
        actions={
          <Link href="/bookings" className="btn btn-secondary btn-sm">
            Ver reservas
          </Link>
        }
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatBlock
          label="Check-ins (24h)"
          value={summary.checkingInNext24h}
          hint="Reservas confirmadas con entrada próxima"
        />
        <StatBlock
          label="Sin envío SENT (24h)"
          value={summary.withoutSentAccessCodeInWindow}
        />
        <StatBlock
          label="Sin teléfono (24h)"
          value={summary.missingPhoneInWindow}
        />
        <StatBlock
          label="Generado sin enviar"
          value={summary.generatedNotSentInWindow}
        />
        <StatBlock
          label="Access codes en error"
          value={summary.failedAccessCodes}
          tone="danger"
        />
      </div>

      <div className="card mt-8">
        <div className="card-header">
          <h2 className="card-title">Requiere atención</h2>
          <p className="card-description">
            Ventana: {formatDate(summary.now)} → {formatDate(summary.next24h)}
          </p>
        </div>
        <div className="p-0">
          <OperationsCasesClient cases={cases} />
        </div>
      </div>
    </div>
  );
}

