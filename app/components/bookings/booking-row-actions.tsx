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

type BookingRowActionsProps = {
  bookingId: string;
  bookingStatus: BookingStatus;
  accessCode: {
    id: string;
    status: AccessCodeStatus;
  } | null;
};

export default function BookingRowActions({
  bookingId,
  bookingStatus,
  accessCode,
}: BookingRowActionsProps) {
  const router = useRouter();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const isBusy = isGenerating || isSending || isCancelling;

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

    try {
      const res = await fetch(
        `/api/bookings/access-codes/${accessCode.id}/generate`,
        {
          method: "POST",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo generar el access code");
      }

      router.refresh();
    } catch (error) {
      console.error("Generate access code error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "No se pudo generar el access code"
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSend() {
    if (!accessCode) return;

    setIsSending(true);

    try {
      const res = await fetch(`/api/bookings/access-codes/${accessCode.id}/send`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo enviar el access code");
      }

      router.refresh();
    } catch (error) {
      console.error("Send access code error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "No se pudo enviar el access code"
      );
    } finally {
      setIsSending(false);
    }
  }

  async function handleCancel() {
    const confirmed = window.confirm("¿Seguro que quieres cancelar esta reserva?");
    if (!confirmed) return;

    setIsCancelling(true);

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
        throw new Error(data?.error || "No se pudo cancelar la reserva");
      }

      router.refresh();
    } catch (error) {
      console.error("Cancel booking error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "No se pudo cancelar la reserva"
      );
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={!canGenerate || isBusy}
        className="rounded-lg border px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isGenerating ? "Generating..." : "Generate"}
      </button>

      <button
        type="button"
        onClick={handleSend}
        disabled={!canSend || isBusy}
        className="rounded-lg border px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSending ? "Sending..." : "Send"}
      </button>

      <button
        type="button"
        onClick={handleCancel}
        disabled={!canCancel || isBusy}
        className="rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isCancelling ? "Cancelling..." : "Cancel"}
      </button>
    </div>
  );
}