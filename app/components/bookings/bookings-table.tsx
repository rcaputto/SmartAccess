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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
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
              <th className="px-4 py-3 font-medium">Propiedad</th>
              <th className="px-4 py-3 font-medium">Fechas</th>
              <th className="px-4 py-3 font-medium">Guests</th>
              <th className="px-4 py-3 font-medium">Booking</th>
              <th className="px-4 py-3 font-medium">Access Code</th>
              <th className="px-4 py-3 font-medium">PIN</th>
              <th className="px-4 py-3 font-medium">Notas</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
              <th className="px-4 py-3 font-medium">Detalle</th>
            </tr>
          </thead>

          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id} className="border-t align-top">
                <td className="px-4 py-3 font-medium">
                  {booking.reference ?? "Sin referencia"}
                </td>

                <td className="px-4 py-3">
                  <div className="font-medium">{booking.guest.fullName}</div>
                  <div className="text-xs text-gray-500">
                    {booking.guest.email || "Sin email"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {booking.guest.phone || "Sin teléfono"}
                  </div>
                </td>

                <td className="px-4 py-3">
                  <div>{booking.unit.name}</div>
                  <div className="text-xs text-gray-500">
                    Capacidad: {booking.unit.maxGuests ?? "-"}
                  </div>
                </td>

                <td className="px-4 py-3">
                  <div>{booking.unit.property.name}</div>
                  <div className="text-xs text-gray-500">
                    {booking.unit.property.city || "-"},{" "}
                    {booking.unit.property.country || "-"}
                  </div>
                </td>

                <td className="px-4 py-3">
                  <div>
                    <span className="font-medium">In:</span>{" "}
                    {formatDate(booking.checkInDate)}
                  </div>
                  <div className="text-gray-500">
                    <span className="font-medium">Out:</span>{" "}
                    {formatDate(booking.checkOutDate)}
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
                      <div className="text-xs text-gray-500">
                        {booking.accessCode.provider ?? "Sin provider"}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">No creado</span>
                  )}
                </td>

                <td className="px-4 py-3 font-mono">
                  {booking.accessCode?.code || "-"}
                </td>

                <td className="max-w-[220px] px-4 py-3 text-gray-600">
                  <span className="line-clamp-2">
                    {booking.notes || "Sin notas"}
                  </span>
                </td>

                <td className="px-4 py-3">
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
                </td>

                <td className="px-4 py-3">
                  <Link
                    href={`/bookings/${booking.id}`}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    Ver detalle
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}