import BookingStatusBadge from "../../components/bookings/booking-status-badge";
import AccessCodeStatusBadge from "../../components/bookings/access-code-status-badge";
import BookingActions from "../../components/bookings/booking-actions";
import Link from "next/link";
import { serverFetchJson } from "@/lib/server/server-fetch";

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

  notificationDeliveries: Array<{
    id: string;
    channel: "WHATSAPP";
    recipient: string;
    body: string;
    status: "QUEUED" | "SENT" | "FAILED" | "SKIPPED";
    reason: string | null;
    errorMessage: string | null;
    providerMessageId: string | null;
    attempt: number;
    sentAt: string | null;
    failedAt: string | null;
    createdAt: string;
  }>;

  auditLogs?: Array<{
    id: string;
    entityType: string;
    entityId: string;
    action: string;
    actorType: "SYSTEM" | "MANUAL";
    actorLabel: string | null;
    details: any;
    createdAt: string;
  }>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

async function getBooking(id: string): Promise<BookingDetail> {
  return serverFetchJson<BookingDetail>(`/api/bookings/${id}`);
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

function DeliveryStatusPill({ status }: { status: BookingDetail["notificationDeliveries"][number]["status"] }) {
  const styles: Record<string, string> = {
    SENT: "bg-green-50 text-green-700 ring-green-100",
    FAILED: "bg-red-50 text-red-700 ring-red-100",
    SKIPPED: "bg-amber-50 text-amber-700 ring-amber-100",
    QUEUED: "bg-gray-50 text-gray-700 ring-gray-100",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
        styles[status] ?? styles.QUEUED
      }`}
    >
      {status}
    </span>
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

        <section className="rounded-2xl border bg-white p-5 shadow-sm lg:col-span-3">
          <h2 className="mb-4 text-lg font-semibold">Delivery Summary</h2>

          {(() => {
            const deliveries = (booking.notificationDeliveries ?? []).filter(
              (d) => d.channel === "WHATSAPP" && d.status !== "QUEUED"
            );

            const latest = deliveries[0] ?? null;
            const attempts = deliveries.length;
            const lastAttemptAt = latest?.createdAt ?? null;
            const lastStatus = latest?.status ?? null;
            const lastError = latest?.errorMessage ?? latest?.reason ?? null;
            const lastRecipient = latest?.recipient ?? null;

            return (
              <div className="grid gap-x-8 gap-y-2 md:grid-cols-2">
                <InfoRow
                  label="Access status"
                  value={
                    booking.accessCode ? (
                      <AccessCodeStatusBadge status={booking.accessCode.status} />
                    ) : (
                      <span className="text-sm text-gray-700">No creado</span>
                    )
                  }
                />
                <InfoRow label="Latest delivery status" value={lastStatus ?? "-"} />
                <InfoRow label="Attempts" value={attempts} />
                <InfoRow
                  label="Last attempt"
                  value={lastAttemptAt ? formatDate(lastAttemptAt) : "Sin intentos"}
                />
                <InfoRow label="Last recipient" value={lastRecipient ?? "-"} />
                <InfoRow label="Last error" value={lastError ?? "-"} />
              </div>
            );
          })()}
        </section>

        <section className="rounded-2xl border bg-white p-5 shadow-sm lg:col-span-3">
          <h2 className="mb-4 text-lg font-semibold">Notification History</h2>

          {booking.notificationDeliveries?.length ? (
            <div className="overflow-hidden rounded-xl border">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Channel
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Recipient
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      When
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Reason / Error
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {booking.notificationDeliveries.map((d) => (
                    <tr key={d.id} className="align-top">
                      <td className="px-3 py-2 text-sm">
                        <DeliveryStatusPill status={d.status} />
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700">{d.channel}</td>
                      <td className="px-3 py-2 text-sm text-gray-700">{d.recipient}</td>
                      <td className="px-3 py-2 text-sm text-gray-700">
                        {formatDate(d.createdAt)}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700">
                        {d.errorMessage ?? d.reason ?? "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              Todavía no hay registros de envío o intentos.
            </p>
          )}
        </section>

        {booking.auditLogs?.length ? (
          <section className="rounded-2xl border bg-white p-5 shadow-sm lg:col-span-3">
            <h2 className="mb-4 text-lg font-semibold">Audit Trail</h2>

            <div className="overflow-hidden rounded-xl border">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      When
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Actor
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Action
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {booking.auditLogs.map((a) => (
                    <tr key={a.id} className="align-top">
                      <td className="px-3 py-2 text-sm text-gray-700">
                        {formatDate(a.createdAt)}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700">
                        {a.actorType}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700">{a.action}</td>
                      <td className="px-3 py-2 text-sm text-gray-700">
                        <pre className="max-w-[720px] overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-gray-50 p-2 text-xs text-gray-700">
                          {a.details ? JSON.stringify(a.details, null, 2) : "-"}
                        </pre>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}