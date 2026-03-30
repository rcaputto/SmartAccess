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
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-600">No hay reservas cargadas todavía.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3 font-medium">Referencia</th>
              <th className="px-4 py-3 font-medium">Huésped</th>
              <th className="px-4 py-3 font-medium">Unidad</th>
              <th className="px-4 py-3 font-medium">Estadía</th>
              <th className="px-4 py-3 font-medium">Guests</th>
              <th className="px-4 py-3 font-medium">Booking</th>
              <th className="px-4 py-3 font-medium">Access</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id} className="border-t align-top">
                <td className="px-4 py-3 font-medium">
                  <div className="max-w-[170px] break-words">
                    {booking.reference ?? "Sin referencia"}
                  </div>
                </td>

                <td className="px-4 py-3">
                  <div className="max-w-[200px]">
                    <div className="font-medium">{booking.guest.fullName}</div>
                    <div className="truncate text-xs text-gray-500">
                      {booking.guest.email || "Sin email"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {booking.guest.phone || "Sin teléfono"}
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3">
                  <div className="max-w-[200px]">
                    <div className="font-medium">{booking.unit.name}</div>
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

                <td className="px-4 py-3">
                  <div className="min-w-[130px]">
                    <div className="font-medium">
                      {formatStayDate(booking.checkInDate)}
                    </div>
                    <div className="text-xs text-gray-500">
                      → {formatStayDate(booking.checkOutDate)}
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3">{booking.guestCount ?? "-"}</td>

                <td className="px-4 py-3">
                  <BookingStatusBadge status={booking.status} />
                </td>

                <td className="px-4 py-3">
                  {booking.accessCode ? (
                    <div className="space-y-1">
                      <AccessCodeStatusBadge status={booking.accessCode.status} />
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">No creado</span>
                  )}
                </td>

                <td className="px-4 py-3">
                  <div className="flex min-w-[140px] flex-col gap-3">
                    <BookingRowActions
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

                    <Link
                      href={`/bookings/${booking.id}`}
                      className="text-sm font-medium text-blue-600 hover:underline"
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
    </div>
  );
}