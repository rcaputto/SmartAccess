import BookingStatusBadge from "../../components/bookings/booking-status-badge";
import AccessCodeStatusBadge from "../../components/bookings/access-code-status-badge";
import BookingActions from "../../components/bookings/booking-actions";
import Link from "next/link";

type BookingDetail = {
  id: string;
  reference: string | null;
  checkInDate: string;
  checkOutDate: string;
  status: "PENDING" | "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";
  guestCount: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  unitId: string;
  guestId: string;
  unit: {
    id: string;
    name: string;
    description: string | null;
    maxGuests: number | null;
    isActive: boolean;
    propertyId: string;
    property: {
      id: string;
      name: string;
      address: string | null;
      city: string | null;
      country: string | null;
      userId: string;
    };
  };
  guest: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    documentId: string | null;
  };
  accessCode: {
    id: string;
    bookingId: string;
    provider: string | null;
    code: string | null;
    status:
      | "PENDING"
      | "GENERATED"
      | "SENT"
      | "ACTIVE"
      | "EXPIRED"
      | "CANCELLED"
      | "FAILED";
    startsAt: string;
    endsAt: string;
    externalId: string | null;
    lastSyncedAt: string | null;
    errorMessage: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

async function getBooking(id: string): Promise<BookingDetail> {
  const res = await fetch(`http://localhost:3000/api/bookings/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("No se pudo cargar la reserva");
  }

  return res.json();
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-1 py-2 sm:grid-cols-[140px_1fr]">
      <div className="text-sm font-medium text-gray-500">{label}</div>
      <div className="text-sm text-gray-900">{value}</div>
    </div>
  );
}

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const booking = await getBooking(id);

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-500">Booking detail</p>
          <h1 className="text-2xl font-bold">
            {booking.reference ?? "Sin referencia"}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <BookingStatusBadge status={booking.status} />
          {booking.accessCode ? (
            <AccessCodeStatusBadge status={booking.accessCode.status} />
          ) : (
            <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
              No access code
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Reserva</h2>

          <InfoRow label="Referencia" value={booking.reference ?? "Sin referencia"} />
          <InfoRow label="Check-in" value={formatDate(booking.checkInDate)} />
          <InfoRow label="Check-out" value={formatDate(booking.checkOutDate)} />
          <InfoRow label="Estado" value={<BookingStatusBadge status={booking.status} />} />
          <InfoRow label="Guests" value={booking.guestCount ?? "-"} />
          <InfoRow label="Notas" value={booking.notes ?? "Sin notas"} />
          <InfoRow label="Creado" value={formatDate(booking.createdAt)} />
          <InfoRow label="Actualizado" value={formatDate(booking.updatedAt)} />
        </section>

        <section className="rounded-2xl border bg-white p-5 shadow-sm">
  <h2 className="mb-4 text-lg font-semibold">Acciones</h2>
  <Link
  href={`/bookings/${booking.id}/edit`}
  className="mb-3 inline-flex w-full items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
>
  Editar reserva
</Link>
  <BookingActions
    bookingId={booking.id}
    bookingStatus={booking.status}
    accessCode={
      booking.accessCode
        ? {
            id: booking.accessCode.id,
            status: booking.accessCode.status,
          }
        : null
    }
  />

  <p className="mt-3 text-xs text-gray-500">
    Generate se habilita para access codes en PENDING o FAILED. Send se
    habilita para GENERATED. Cancel desactiva la reserva y su access code.
  </p>
</section>

        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Huésped</h2>

          <InfoRow label="Nombre" value={booking.guest.fullName} />
          <InfoRow label="Email" value={booking.guest.email ?? "Sin email"} />
          <InfoRow label="Teléfono" value={booking.guest.phone ?? "Sin teléfono"} />
          <InfoRow label="Documento" value={booking.guest.documentId ?? "Sin documento"} />
        </section>

        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Unidad</h2>

          <InfoRow label="Nombre" value={booking.unit.name} />
          <InfoRow label="Descripción" value={booking.unit.description ?? "Sin descripción"} />
          <InfoRow label="Capacidad" value={booking.unit.maxGuests ?? "-"} />
          <InfoRow
            label="Activa"
            value={booking.unit.isActive ? "Sí" : "No"}
          />
        </section>

        <section className="rounded-2xl border bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Propiedad</h2>

          <InfoRow label="Nombre" value={booking.unit.property.name} />
          <InfoRow label="Dirección" value={booking.unit.property.address ?? "Sin dirección"} />
          <InfoRow label="Ciudad" value={booking.unit.property.city ?? "Sin ciudad"} />
          <InfoRow label="País" value={booking.unit.property.country ?? "Sin país"} />
        </section>

        <section className="rounded-2xl border bg-white p-5 shadow-sm lg:col-span-3">
          <h2 className="mb-4 text-lg font-semibold">Access Code</h2>

          {booking.accessCode ? (
            <div className="grid gap-x-8 gap-y-2 md:grid-cols-2">
              <InfoRow
                label="Estado"
                value={<AccessCodeStatusBadge status={booking.accessCode.status} />}
              />
              <InfoRow label="PIN" value={booking.accessCode.code ?? "No generado"} />
              <InfoRow label="Provider" value={booking.accessCode.provider ?? "Sin provider"} />
              <InfoRow label="External ID" value={booking.accessCode.externalId ?? "Sin externalId"} />
              <InfoRow label="Starts at" value={formatDate(booking.accessCode.startsAt)} />
              <InfoRow label="Ends at" value={formatDate(booking.accessCode.endsAt)} />
              <InfoRow
                label="Last sync"
                value={
                  booking.accessCode.lastSyncedAt
                    ? formatDate(booking.accessCode.lastSyncedAt)
                    : "Sin sincronización"
                }
              />
              <InfoRow
                label="Error"
                value={booking.accessCode.errorMessage ?? "Sin errores"}
              />
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              Esta reserva todavía no tiene access code asociado.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}