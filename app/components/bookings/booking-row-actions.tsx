"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/app/components/ui/button";
import { useToast } from "@/app/components/ui/toast";
import { useSession } from "next-auth/react";

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
  checkInDate: string;
  guestPhone: string | null;
  accessCode: {
    id: string;
    status: AccessCodeStatus;
  } | null;
};

export default function BookingRowActions({
  bookingId,
  bookingStatus,
  checkInDate,
  guestPhone,
  accessCode,
}: BookingRowActionsProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { data: session } = useSession();
  const role = (session as any)?.role as "OWNER" | "MANAGER" | undefined;
  const canDeleteByRole = role === "OWNER";
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isBusy = isGenerating || isSending || isCancelling || isDeleting;

  const isWithinPrecheckinWindow = useMemo(() => {
    const now = new Date();
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return new Date(checkInDate) <= next24h;
  }, [checkInDate]);

  const isConfirmed = bookingStatus === "CONFIRMED";

  const manualActionsAllowed = isConfirmed && isWithinPrecheckinWindow;

  const canGenerate = useMemo(() => {
    if (bookingStatus === "CANCELLED" || bookingStatus === "CHECKED_OUT") {
      return false;
    }

    if (!manualActionsAllowed) {
      return false;
    }

    if (!accessCode) {
      return true;
    }

    return (
      accessCode.status === "PENDING" ||
      accessCode.status === "FAILED" ||
      accessCode.status === "GENERATED"
    );
  }, [bookingStatus, accessCode, manualActionsAllowed]);

  const canSend = useMemo(() => {
    if (!accessCode) {
      return false;
    }

    if (!manualActionsAllowed) {
      return false;
    }

    if (!guestPhone) {
      return false;
    }

    return accessCode.status === "GENERATED";
  }, [accessCode, manualActionsAllowed, guestPhone]);

  const canCancel = useMemo(() => {
    return bookingStatus !== "CANCELLED" && bookingStatus !== "CHECKED_OUT";
  }, [bookingStatus]);

  const canDelete = useMemo(() => {
    return canDeleteByRole && bookingStatus === "CANCELLED";
  }, [bookingStatus, canDeleteByRole]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current) return;

      if (!menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function parseResponse(res: Response) {
    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      return res.json();
    }

    return res.text();
  }

  async function handleGenerate() {
    setIsGenerating(true);
    setIsOpen(false);

    try {
      if (!manualActionsAllowed) {
        showToast({
          type: "error",
          title: "Acción no disponible",
          message: "Generate solo está disponible dentro de las 24h previas al check-in y con la reserva CONFIRMED.",
        });
        return;
      }

      let res: Response;

      if (!accessCode) {
        res = await fetch(`/api/bookings/${bookingId}/generate-access`, {
          method: "POST",
        });
      } else {
        res = await fetch(`/api/bookings/access-codes/${accessCode.id}/generate`, {
          method: "POST",
        });
      }

      const data = await parseResponse(res);

      if (!res.ok) {
        throw new Error(
          typeof data === "string"
            ? data
            : data?.error || "Could not generate access code"
        );
      }

      showToast({
        type: "success",
        title: "Access code ready",
        message: "The booking access code was generated successfully.",
      });

      router.refresh();
    } catch (error) {
      console.error("Generate access code error:", error);

      showToast({
        type: "error",
        title: "Generate failed",
        message:
          error instanceof Error
            ? error.message
            : "Could not generate access code.",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSend() {
    if (!accessCode) return;

    setIsSending(true);
    setIsOpen(false);

    try {
      if (!manualActionsAllowed) {
        showToast({
          type: "error",
          title: "Acción no disponible",
          message: "Send solo está disponible dentro de las 24h previas al check-in y con la reserva CONFIRMED.",
        });
        return;
      }

      if (!guestPhone) {
        showToast({
          type: "error",
          title: "Falta teléfono",
          message: "Agrega un teléfono al huésped para poder enviar por WhatsApp.",
        });
        return;
      }

      const res = await fetch(`/api/bookings/access-codes/${accessCode.id}/send`, {
        method: "POST",
      });

      const data = await parseResponse(res);

      if (!res.ok) {
        throw new Error(
          typeof data === "string"
            ? data
            : data?.error || "Could not send access code"
        );
      }

      showToast({
        type: "success",
        title: "Access code sent",
        message: "The guest notification was sent successfully.",
      });

      router.refresh();
    } catch (error) {
      console.error("Send access code error:", error);

      showToast({
        type: "error",
        title: "Send failed",
        message:
          error instanceof Error
            ? error.message
            : "Could not send access code.",
      });
    } finally {
      setIsSending(false);
    }
  }

  async function handleCancel() {
    const confirmed = window.confirm("Are you sure you want to cancel this booking?");
    if (!confirmed) return;

    setIsCancelling(true);
    setIsOpen(false);

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

      const data = await parseResponse(res);

      if (!res.ok) {
        throw new Error(
          typeof data === "string"
            ? data
            : data?.error || "Could not cancel booking"
        );
      }

      showToast({
        type: "success",
        title: "Booking cancelled",
        message: "The reservation was cancelled successfully.",
      });

      router.refresh();
    } catch (error) {
      console.error("Cancel booking error:", error);

      showToast({
        type: "error",
        title: "Cancel failed",
        message:
          error instanceof Error ? error.message : "Could not cancel booking.",
      });
    } finally {
      setIsCancelling(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "This will permanently delete the booking. This action cannot be undone. Continue?"
    );
    if (!confirmed) return;

    setIsDeleting(true);
    setIsOpen(false);

    try {
      const res = await fetch(`/api/bookings/${bookingId}/delete`, {
        method: "DELETE",
      });

      const data = await parseResponse(res);

      if (!res.ok) {
        console.error("Delete booking response error:", data);

        throw new Error(
          typeof data === "string"
            ? data
            : data?.error || "Could not delete booking"
        );
      }

      showToast({
        type: "success",
        title: "Booking deleted",
        message: "The reservation was permanently deleted.",
      });

      router.refresh();
    } catch (error) {
      console.error("Delete booking error:", error);

      showToast({
        type: "error",
        title: "Delete failed",
        message:
          error instanceof Error ? error.message : "Could not delete booking.",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  const currentLoadingLabel = isGenerating
    ? "Generating..."
    : isSending
    ? "Sending..."
    : isCancelling
    ? "Cancelling..."
    : isDeleting
    ? "Deleting..."
    : null;

  return (
    <div className="relative inline-block" ref={menuRef}>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={isBusy}
        loading={isBusy}
        className="min-w-[110px] justify-between"
      >
        {currentLoadingLabel ?? "Actions"}
      </Button>

      {isOpen && !isBusy ? (
        <div className="absolute right-0 z-30 mt-2 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="block w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Generate
          </button>

          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className="block w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={!canCancel}
            className="block w-full px-4 py-2.5 text-left text-sm text-amber-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={!canDelete}
            className="block w-full px-4 py-2.5 text-left text-sm text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Delete
          </button>

          {!canDeleteByRole ? (
            <div className="border-t bg-gray-50 px-4 py-2 text-xs text-gray-600">
              Solo OWNER puede borrar reservas.
            </div>
          ) : null}

          {!manualActionsAllowed ? (
            <div className="border-t bg-gray-50 px-4 py-2 text-xs text-gray-600">
              Generate/Send solo dentro de 24h del check-in y con CONFIRMED.
            </div>
          ) : !guestPhone ? (
            <div className="border-t bg-gray-50 px-4 py-2 text-xs text-gray-600">
              Falta teléfono del huésped para enviar.
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}