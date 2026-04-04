import Link from "next/link";
import BookingStatusBadge from "./booking-status-badge";
import AccessCodeStatusBadge from "./access-code-status-badge";
import BookingRowActions from "./booking-row-actions";

type Booking = {
  id: string;
  reference: string | null;
  checkInDate: string;
  checkOutDate: string;
  status: "PENDING" | "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";
  guestCount: number | null;
  notes: string | null;
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

function formatStayDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function BookingsTable({ bookings }: { bookings: Booking[] }) {
  if (!bookings.length) {
    return (
      <div className="card">
        <div className="card-content">
          <p className="text-sm text-[var(--muted)]">
            No hay reservas. Crea una nueva o ajusta los filtros.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Referencia</th>
            <th>Huésped</th>
            <th>Unidad</th>
            <th>Estadía</th>
            <th className="table-num">Huéspedes</th>
            <th>Estado</th>
            <th>Access code</th>
            <th className="text-right">Acciones</th>
          </tr>
        </thead>

        <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id} className="table-row-hover align-top">
                <td className="font-semibold text-slate-900">
                  <div className="max-w-[170px] break-words">
                    {booking.reference ?? "Sin referencia"}
                  </div>
                </td>

                <td>
                  <div className="max-w-[200px]">
                    <div className="font-semibold text-slate-900">{booking.guest.fullName}</div>
                    <div className="truncate text-xs text-gray-500">
                      {booking.guest.email || "Sin email"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {booking.guest.phone || "Sin teléfono"}
                    </div>
                  </div>
                </td>

                <td>
                  <div className="max-w-[200px]">
                    <div className="font-semibold text-slate-900">{booking.unit.name}</div>
                    <div className="text-xs text-gray-500">
                      {booking.unit.property.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {booking.unit.property.city || "-"},{" "}
                      {booking.unit.property.country || "-"}
                    </div>
                    <div className="text-xs text-gray-500">
                      Capacidad: {booking.unit.maxGuests ?? "-"}
                    </div>
                  </div>
                </td>

                <td>
                  <div className="min-w-[130px]">
                    <div className="font-semibold text-slate-900">
                      {formatStayDate(booking.checkInDate)}
                    </div>
                    <div className="text-xs text-gray-500">
                      → {formatStayDate(booking.checkOutDate)}
                    </div>
                  </div>
                </td>

                <td className="table-num text-slate-900">{booking.guestCount ?? "—"}</td>

                <td>
                  <BookingStatusBadge status={booking.status} />
                </td>

                <td>
                  {booking.accessCode ? (
                    <div className="space-y-1">
                      <AccessCodeStatusBadge status={booking.accessCode.status} />
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">No creado</span>
                  )}
                </td>

                <td className="text-right">
                  <div className="ml-auto flex min-w-[140px] max-w-[200px] flex-col items-end gap-3">
                    <BookingRowActions
                      bookingId={booking.id}
                      bookingStatus={booking.status}
                      checkInDate={booking.checkInDate}
                      guestPhone={booking.guest.phone}
                      accessCode={
                        booking.accessCode
                          ? {
                              id: booking.accessCode.id,
                              status: booking.accessCode.status,
                            }
                          : null
                      }
                    />

                    <Link
                      href={`/bookings/${booking.id}`}
                      className="text-sm font-semibold text-[var(--primary)] hover:underline"
                    >
                      Ver detalle
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}