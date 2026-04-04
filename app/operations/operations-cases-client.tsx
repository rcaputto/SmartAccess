"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Button from "@/app/components/ui/button";
import { useToast } from "@/app/components/ui/toast";

type OperationsCase = {
  issueType:
    | "MISSING_PHONE"
    | "PRECHECKIN_NOT_SENT"
    | "ACCESS_CODE_FAILED"
    | "GENERATED_NOT_SENT";
  message: string;
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
  const label: Record<OperationsCase["issueType"], string> = {
    MISSING_PHONE: "Falta teléfono",
    PRECHECKIN_NOT_SENT: "Pre-checkin pendiente",
    ACCESS_CODE_FAILED: "Access code fallido",
    GENERATED_NOT_SENT: "Generado sin enviar",
  };
  const styles: Record<string, string> = {
    MISSING_PHONE: "badge-warning",
    PRECHECKIN_NOT_SENT: "badge-info",
    ACCESS_CODE_FAILED: "badge-danger",
    GENERATED_NOT_SENT: "badge-info",
  };

  return (
    <span className={`badge ${styles[issueType] ?? "badge-neutral"}`}>
      {label[issueType] ?? issueType}
    </span>
  );
}

export default function OperationsCasesClient({ cases }: { cases: OperationsCase[] }) {
  const router = useRouter();
  const { showToast } = useToast();

  const [busyKey, setBusyKey] = useState<string | null>(null);

  const rows = useMemo(() => cases, [cases]);

  async function handleGenerate(row: OperationsCase) {
    const key = `${row.booking.id}:generate`;
    setBusyKey(key);

    try {
      if (!row.actionState.canGenerate) {
        showToast({
          type: "error",
          title: "No disponible",
          message: "Generate no está permitido para esta reserva en este momento.",
        });
        return;
      }

      const res = row.booking.accessCode
        ? await fetch(`/api/bookings/access-codes/${row.booking.accessCode.id}/generate`, {
            method: "POST",
          })
        : await fetch(`/api/bookings/${row.booking.id}/generate-access`, {
            method: "POST",
          });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "No se pudo generar el access code");
      }

      showToast({
        type: "success",
        title: "Access code generado",
        message: "Se generó correctamente.",
      });

      router.refresh();
    } catch (error) {
      showToast({
        type: "error",
        title: "Error al generar",
        message: error instanceof Error ? error.message : "Error inesperado.",
      });
    } finally {
      setBusyKey((current) => (current === key ? null : current));
    }
  }

  async function handleSend(row: OperationsCase) {
    const key = `${row.booking.id}:send`;
    setBusyKey(key);

    try {
      if (!row.actionState.canSend || !row.booking.accessCode) {
        showToast({
          type: "error",
          title: "No disponible",
          message:
            "Send no está permitido para esta reserva en este momento (o falta access code).",
        });
        return;
      }

      const res = await fetch(`/api/bookings/access-codes/${row.booking.accessCode.id}/send`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "No se pudo enviar el access code");
      }

      showToast({
        type: "success",
        title: "Envío realizado",
        message: "Se envió correctamente al huésped (mock).",
      });

      router.refresh();
    } catch (error) {
      showToast({
        type: "error",
        title: "Error al enviar",
        message: error instanceof Error ? error.message : "Error inesperado.",
      });
    } finally {
      setBusyKey((current) => (current === key ? null : current));
    }
  }

  if (!rows.length) {
    return (
      <div className="px-6 py-10 text-center text-sm text-[var(--muted)]">
        No hay alertas operativas en este momento.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="table table-striped min-w-[960px] text-sm">
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Reserva</th>
            <th>Huésped</th>
            <th>Unidad</th>
            <th>Check-in</th>
            <th>Access code</th>
            <th>Último intento</th>
            <th>Último error</th>
            <th>Mensaje</th>
            <th className="text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => {
            const genKey = `${c.booking.id}:generate`;
            const sendKey = `${c.booking.id}:send`;

            return (
              <tr key={`${c.booking.id}-${c.issueType}`} className="table-row-hover align-top">
                <td>
                  <IssueBadge issueType={c.issueType} />
                </td>
                <td className="font-semibold text-slate-900">
                  {c.booking.reference ?? "Sin referencia"}
                </td>
                <td>
                  <div className="font-semibold text-slate-900">{c.booking.guest.fullName}</div>
                  <div className="text-xs text-[var(--muted)]">
                    {c.booking.guest.phone ?? "Sin teléfono"}
                  </div>
                </td>
                <td>
                  <div className="font-semibold text-slate-900">{c.booking.unit.name}</div>
                  <div className="text-xs text-[var(--muted)]">{c.booking.unit.property.name}</div>
                </td>
                <td className="whitespace-nowrap text-sm">{formatDate(c.booking.checkInDate)}</td>
                <td className="text-sm">
                  {c.booking.accessCode ? c.booking.accessCode.status : "No creado"}
                </td>
                <td className="text-slate-700">
                  {c.delivery.lastAttemptAt ? (
                    <div>
                      <div className="font-medium">{formatDate(c.delivery.lastAttemptAt)}</div>
                      <div className="text-xs text-gray-500">
                        {c.delivery.lastStatus ?? "-"} · {c.delivery.attempts} intentos
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">Sin intentos</span>
                  )}
                </td>
                <td className="text-slate-700">
                  {c.delivery.lastError ? (
                    <div className="max-w-[260px] break-words text-xs text-slate-700">
                      {c.delivery.lastError}
                    </div>
                  ) : (
                    <span className="text-xs text-[var(--muted)]">—</span>
                  )}
                </td>
                <td className="max-w-[280px] text-sm text-slate-700">{c.message}</td>
                <td className="text-right">
                  <div className="ml-auto flex max-w-[220px] flex-col items-end gap-2">
                    <div className="flex flex-wrap justify-end gap-3">
                      <Link
                        href={c.actionLinks.openBooking}
                        className="text-sm font-semibold text-[var(--primary)] hover:underline"
                      >
                        Abrir
                      </Link>
                      <Link
                        href={c.actionLinks.editBooking}
                        className="text-sm font-semibold text-slate-600 hover:underline"
                      >
                        Editar
                      </Link>
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => handleGenerate(c)}
                        disabled={!c.actionState.canGenerate || busyKey !== null}
                        loading={busyKey === genKey}
                      >
                        Generar
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => handleSend(c)}
                        disabled={!c.actionState.canSend || !c.booking.accessCode || busyKey !== null}
                        loading={busyKey === sendKey}
                      >
                        Enviar
                      </Button>
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

