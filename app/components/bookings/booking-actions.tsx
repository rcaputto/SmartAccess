"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "CHECKED_OUT"
  | "CANCELLED";

type AccessCodeStatus =
  | "PENDING"
  | "GENERATED"
  | "SENT"
  | "ACTIVE"
  | "EXPIRED"
  | "CANCELLED"
  | "FAILED";

type BookingActionsProps = {
  bookingId: string;
  bookingStatus: BookingStatus;
  accessCode: {
    id: string;
    status: AccessCodeStatus;
  } | null;
};

export default function BookingActions({
  bookingId,
  bookingStatus,
  accessCode,
}: BookingActionsProps) {
  const router = useRouter();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canGenerate = useMemo(() => {
    if (bookingStatus === "CANCELLED" || bookingStatus === "CHECKED_OUT") {
      return false;
    }

    if (!accessCode) {
      return false;
    }

    return accessCode.status === "PENDING" || accessCode.status === "FAILED";
  }, [bookingStatus, accessCode]);

  const canSend = useMemo(() => {
    if (!accessCode) {
      return false;
    }

    return accessCode.status === "GENERATED";
  }, [accessCode]);

  const canCancel = useMemo(() => {
    return bookingStatus !== "CANCELLED" && bookingStatus !== "CHECKED_OUT";
  }, [bookingStatus]);

  async function handleGenerate() {
    if (!accessCode) return;

    setIsGenerating(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(
        `/api/bookings/access-codes/${accessCode.id}/generate`,
        {
          method: "POST",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudo generar el access code");
      }

      setMessage("Access code generado correctamente.");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Error al generar el access code");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSend() {
    if (!accessCode) return;

    setIsSending(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`/api/bookings/access-codes/${accessCode.id}/send`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudo enviar el access code");
      }

      setMessage("Access code enviado correctamente.");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Error al enviar el access code");
    } finally {
      setIsSending(false);
    }
  }

  async function handleCancel() {
    const confirmed = window.confirm("¿Seguro que quieres cancelar esta reserva?");
    if (!confirmed) return;

    setIsCancelling(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "CANCELLED",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudo cancelar la reserva");
      }

      setMessage("Reserva cancelada correctamente.");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Error al cancelar la reserva");
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={!canGenerate || isGenerating || isSending || isCancelling}
        className="w-full rounded-xl border px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isGenerating ? "Generating..." : "Generate access code"}
      </button>

      <button
        type="button"
        onClick={handleSend}
        disabled={!canSend || isGenerating || isSending || isCancelling}
        className="w-full rounded-xl border px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSending ? "Sending..." : "Send access code"}
      </button>

      <button
        type="button"
        onClick={handleCancel}
        disabled={!canCancel || isGenerating || isSending || isCancelling}
        className="w-full rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isCancelling ? "Cancelling..." : "Cancel booking"}
      </button>

      {message ? (
        <p className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-700">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}