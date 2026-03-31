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
        title: "Generate falló",
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
        title: "Send falló",
        message: error instanceof Error ? error.message : "Error inesperado.",
      });
    } finally {
      setBusyKey((current) => (current === key ? null : current));
    }
  }

  if (!rows.length) {
    return <div className="p-6 text-sm text-gray-600">No hay casos operativos.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-left text-gray-600">
          <tr>
            <th className="px-4 py-3 font-medium">Issue</th>
            <th className="px-4 py-3 font-medium">Booking</th>
            <th className="px-4 py-3 font-medium">Huésped</th>
            <th className="px-4 py-3 font-medium">Unidad</th>
            <th className="px-4 py-3 font-medium">Check-in</th>
            <th className="px-4 py-3 font-medium">Access</th>
            <th className="px-4 py-3 font-medium">Último intento</th>
            <th className="px-4 py-3 font-medium">Último error</th>
            <th className="px-4 py-3 font-medium">Mensaje</th>
            <th className="px-4 py-3 font-medium">Acción</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => {
            const genKey = `${c.booking.id}:generate`;
            const sendKey = `${c.booking.id}:send`;

            return (
              <tr key={`${c.booking.id}-${c.issueType}`} className="border-t align-top">
                <td className="px-4 py-3">
                  <IssueBadge issueType={c.issueType} />
                </td>
                <td className="px-4 py-3 font-medium">
                  {c.booking.reference ?? "Sin referencia"}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{c.booking.guest.fullName}</div>
                  <div className="text-xs text-gray-500">
                    {c.booking.guest.phone ?? "Sin teléfono"}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{c.booking.unit.name}</div>
                  <div className="text-xs text-gray-500">{c.booking.unit.property.name}</div>
                </td>
                <td className="px-4 py-3">{formatDate(c.booking.checkInDate)}</td>
                <td className="px-4 py-3">
                  {c.booking.accessCode ? c.booking.accessCode.status : "No creado"}
                </td>
                <td className="px-4 py-3 text-gray-700">
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
                <td className="px-4 py-3 text-gray-700">
                  {c.delivery.lastError ? (
                    <div className="max-w-[260px] break-words text-xs text-gray-700">
                      {c.delivery.lastError}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-700">{c.message}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <Link
                        href={c.actionLinks.openBooking}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        Abrir
                      </Link>
                      <Link
                        href={c.actionLinks.editBooking}
                        className="text-sm font-medium text-gray-700 hover:underline"
                      >
                        Editar
                      </Link>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => handleGenerate(c)}
                        disabled={!c.actionState.canGenerate || busyKey !== null}
                        loading={busyKey === genKey}
                      >
                        Generate
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => handleSend(c)}
                        disabled={!c.actionState.canSend || !c.booking.accessCode || busyKey !== null}
                        loading={busyKey === sendKey}
                      >
                        Send
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

