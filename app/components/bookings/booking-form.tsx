"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type UnitOption = {
  id: string;
  name: string;
  maxGuests: number | null;
  isActive: boolean;
  property: {
    name: string;
    city: string | null;
    country: string | null;
  };
};

type BookingFormValues = {
  unitId: string;
  guest: {
    fullName: string;
    email: string | null;
    phone: string | null;
    documentId: string | null;
  };
  checkInDate: string;
  checkOutDate: string;
  guestCount: number | null;
  notes: string | null;
};

type BookingFormProps = {
  mode: "create" | "edit";
  units: UnitOption[];
  initialValues?: BookingFormValues;
  bookingId?: string;
};

function toDateInputValue(value: string | null | undefined) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export default function BookingForm({
  mode,
  units,
  initialValues,
  bookingId,
}: BookingFormProps) {
  const router = useRouter();

  const isEditMode = mode === "edit";

  const [unitId, setUnitId] = useState(
    initialValues?.unitId ?? units[0]?.id ?? ""
  );

  const [fullName, setFullName] = useState(
    initialValues?.guest.fullName ?? ""
  );

  const [email, setEmail] = useState(initialValues?.guest.email ?? "");
  const [phone, setPhone] = useState(initialValues?.guest.phone ?? "");
  const [documentId, setDocumentId] = useState(
    initialValues?.guest.documentId ?? ""
  );

  const [checkInDate, setCheckInDate] = useState(
    toDateInputValue(initialValues?.checkInDate)
  );

  const [checkOutDate, setCheckOutDate] = useState(
    toDateInputValue(initialValues?.checkOutDate)
  );

  const [guestCount, setGuestCount] = useState(
    initialValues?.guestCount ? String(initialValues.guestCount) : "1"
  );

  const [notes, setNotes] = useState(initialValues?.notes ?? "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = isEditMode
        ? {
            checkInDate: checkInDate
              ? new Date(checkInDate).toISOString()
              : null,
            checkOutDate: checkOutDate
              ? new Date(checkOutDate).toISOString()
              : null,
            guestCount: guestCount ? Number(guestCount) : null,
            notes: notes || null,
          }
        : {
            unitId,
            guest: {
              fullName,
              email: email || null,
              phone: phone || null,
              documentId: documentId || null,
            },
            checkInDate: checkInDate
              ? new Date(checkInDate).toISOString()
              : null,
            checkOutDate: checkOutDate
              ? new Date(checkOutDate).toISOString()
              : null,
            guestCount: guestCount ? Number(guestCount) : null,
            notes: notes || null,
          };

      const url = isEditMode
        ? `/api/bookings/${bookingId}`
        : "/api/bookings";

      const method = isEditMode ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let data;

      try {
        data = await res.json();
      } catch {
        throw new Error("Respuesta inválida del servidor");
      }

        console.log("payload enviado:", payload);
        console.log("status response:", res.status);

            if (!res.ok) {
        console.log("PATCH error response:", data);
        throw new Error(
            data?.error ||
            data?.message ||
            JSON.stringify(data) ||
            "No se pudo guardar la reserva"
        );
        }

      router.push(
        isEditMode ? `/bookings/${bookingId}` : `/bookings/${data.id}`
      );

      router.refresh();
            } catch (err: any) {
        console.error("Error al actualizar la reserva:", err);
        setError(err.message || "Error al guardar la reserva");
        } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* RESERVA */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Reserva</h2>

        {!isEditMode && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Unidad
            </label>
            <select
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm"
              required
            >
              <option value="" disabled>
                Selecciona una unidad
              </option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name} · {unit.property.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Check-in
            </label>
            <input
              type="date"
              value={checkInDate}
              onChange={(e) => setCheckInDate(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Check-out
            </label>
            <input
              type="date"
              value={checkOutDate}
              onChange={(e) => setCheckOutDate(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm"
              required
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Cantidad de huéspedes
          </label>
          <input
            type="number"
            min="1"
            value={guestCount}
            onChange={(e) => setGuestCount(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Notas
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[96px] w-full rounded-xl border px-3 py-2 text-sm"
          />
        </div>
      </section>

      {/* HUÉSPED */}
      {!isEditMode && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Huésped</h2>

          <input
            type="text"
            placeholder="Nombre completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm"
            required
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm"
          />

          <input
            type="text"
            placeholder="Teléfono"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm"
          />

          <input
            type="text"
            placeholder="Documento"
            value={documentId}
            onChange={(e) => setDocumentId(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm"
          />
        </section>
      )}

      {/* ERROR */}
      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ACTIONS */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() =>
            router.push(
              isEditMode && bookingId
                ? `/bookings/${bookingId}`
                : "/bookings"
            )
          }
          className="rounded-xl border px-4 py-2 text-sm"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-black px-4 py-2 text-sm text-white"
        >
          {isSubmitting
            ? "Guardando..."
            : isEditMode
            ? "Guardar cambios"
            : "Crear reserva"}
        </button>
      </div>
    </form>
  );
}