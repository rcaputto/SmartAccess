import BookingStatusBadge from "../../components/bookings/booking-status-badge";
import AccessCodeStatusBadge from "../../components/bookings/access-code-status-badge";
import BookingActions from "../../components/bookings/booking-actions";
import SaasCard from "@/app/components/ui/saas-card";
import SectionHeader from "@/app/components/ui/section-header";
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
    <div className="grid grid-cols-1 gap-1 border-b border-[var(--border)] py-3 last:border-b-0 sm:grid-cols-[minmax(0,160px)_1fr] sm:gap-4">
      <div className="field-label text-[var(--muted)]">{label}</div>
      <div className="text-sm font-medium text-slate-900">{value}</div>
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
    <div className="page-section mx-auto w-full max-w-5xl">
      <SectionHeader
        eyebrow="Detalle de reserva"
        title={booking.reference ?? "Sin referencia"}
        subtitle={`Creada el ${formatDate(booking.createdAt)}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <BookingStatusBadge status={booking.status} />
            {booking.accessCode ? (
              <AccessCodeStatusBadge status={booking.accessCode.status} />
            ) : (
              <span className="badge badge-neutral">Sin access code</span>
            )}
          </div>
        }
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <SaasCard title="Reserva" className="lg:col-span-2">
          <InfoRow label="Referencia" value={booking.reference ?? "Sin referencia"} />
          <InfoRow label="Check-in" value={formatDate(booking.checkInDate)} />
          <InfoRow label="Check-out" value={formatDate(booking.checkOutDate)} />
          <InfoRow label="Estado" value={<BookingStatusBadge status={booking.status} />} />
          <InfoRow label="Huéspedes" value={booking.guestCount ?? "—"} />
          <InfoRow label="Notas" value={booking.notes ?? "Sin notas"} />
          <InfoRow label="Creado" value={formatDate(booking.createdAt)} />
          <InfoRow label="Actualizado" value={formatDate(booking.updatedAt)} />
        </SaasCard>

        <SaasCard title="Acciones">
          <Link
            href={`/bookings/${booking.id}/edit`}
            className="btn btn-secondary mb-4 w-full"
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

          <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
            <strong>Generar</strong> está disponible con access code en PENDING o FAILED.{" "}
            <strong>Enviar</strong> con estado GENERATED. <strong>Cancelar</strong> anula la reserva y el access code.
          </p>
        </SaasCard>

        <SaasCard title="Huésped">
          <InfoRow label="Nombre" value={booking.guest.fullName} />
          <InfoRow label="Email" value={booking.guest.email ?? "Sin email"} />
          <InfoRow label="Teléfono" value={booking.guest.phone ?? "Sin teléfono"} />
          <InfoRow label="Documento" value={booking.guest.documentId ?? "Sin documento"} />
        </SaasCard>

        <SaasCard title="Unidad">
          <InfoRow label="Nombre" value={booking.unit.name} />
          <InfoRow label="Descripción" value={booking.unit.description ?? "Sin descripción"} />
          <InfoRow label="Capacidad" value={booking.unit.maxGuests ?? "—"} />
          <InfoRow
            label="Activa"
            value={booking.unit.isActive ? "Sí" : "No"}
          />
        </SaasCard>

        <SaasCard title="Propiedad" className="lg:col-span-2">
          <InfoRow label="Nombre" value={booking.unit.property.name} />
          <InfoRow label="Dirección" value={booking.unit.property.address ?? "Sin dirección"} />
          <InfoRow label="Ciudad" value={booking.unit.property.city ?? "Sin ciudad"} />
          <InfoRow label="País" value={booking.unit.property.country ?? "Sin país"} />

          <div className="mt-4 border-t border-[var(--border)] pt-4">
            <Link
              href={`/finance/${booking.unit.property.id}`}
              className="text-sm font-semibold text-[var(--primary)] hover:underline"
            >
              Ver finanzas de la propiedad
            </Link>
          </div>
        </SaasCard>

        <SaasCard title="Access code" className="lg:col-span-3">

          {booking.accessCode ? (
            <div className="grid gap-x-8 gap-y-2 md:grid-cols-2">
              <InfoRow
                label="Estado"
                value={<AccessCodeStatusBadge status={booking.accessCode.status} />}
              />
              <InfoRow label="PIN" value={booking.accessCode.code ?? "No generado"} />
              <InfoRow label="Proveedor" value={booking.accessCode.provider ?? "Sin proveedor"} />
              <InfoRow label="ID externo" value={booking.accessCode.externalId ?? "—"} />
              <InfoRow label="Inicio" value={formatDate(booking.accessCode.startsAt)} />
              <InfoRow label="Fin" value={formatDate(booking.accessCode.endsAt)} />
              <InfoRow
                label="Última sincronización"
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
            <p className="text-sm text-[var(--muted)]">
              Esta reserva todavía no tiene access code asociado.
            </p>
          )}
        </SaasCard>

        <SaasCard title="Resumen de envíos" className="lg:col-span-3">

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
                  label="Estado del access code"
                  value={
                    booking.accessCode ? (
                      <AccessCodeStatusBadge status={booking.accessCode.status} />
                    ) : (
                      <span className="text-sm text-slate-700">No creado</span>
                    )
                  }
                />
                <InfoRow label="Último estado de envío" value={lastStatus ?? "—"} />
                <InfoRow label="Intentos" value={attempts} />
                <InfoRow
                  label="Último intento"
                  value={lastAttemptAt ? formatDate(lastAttemptAt) : "Sin intentos"}
                />
                <InfoRow label="Último destinatario" value={lastRecipient ?? "—"} />
                <InfoRow label="Último error" value={lastError ?? "—"} />
              </div>
            );
          })()}
        </SaasCard>

        <SaasCard title="Historial de notificaciones" className="lg:col-span-3">
          {booking.notificationDeliveries?.length ? (
            <div className="table-wrap">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Estado</th>
                    <th>Canal</th>
                    <th>Destinatario</th>
                    <th>Fecha</th>
                    <th>Motivo / error</th>
                  </tr>
                </thead>
                <tbody>
                  {booking.notificationDeliveries.map((d) => (
                    <tr key={d.id} className="table-row-hover align-top">
                      <td className="text-sm">
                        <DeliveryStatusPill status={d.status} />
                      </td>
                      <td className="text-sm text-slate-700">{d.channel}</td>
                      <td className="text-sm text-slate-700">{d.recipient}</td>
                      <td className="text-sm text-slate-700">
                        {formatDate(d.createdAt)}
                      </td>
                      <td className="text-sm text-slate-700">
                        {d.errorMessage ?? d.reason ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-[var(--muted)]">
              Todavía no hay registros de envío o intentos.
            </p>
          )}
        </SaasCard>

        {booking.auditLogs?.length ? (
          <SaasCard title="Historial de auditoría" className="lg:col-span-3">
            <div className="table-wrap">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Actor</th>
                    <th>Acción</th>
                    <th>Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {booking.auditLogs.map((a) => (
                    <tr key={a.id} className="table-row-hover align-top">
                      <td className="text-sm text-slate-700">
                        {formatDate(a.createdAt)}
                      </td>
                      <td className="text-sm text-slate-700">
                        {a.actorType}
                      </td>
                      <td className="text-sm text-slate-700">{a.action}</td>
                      <td className="text-sm text-slate-700">
                        <pre className="max-w-[720px] overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-2 text-xs text-slate-700">
                          {a.details ? JSON.stringify(a.details, null, 2) : "—"}
                        </pre>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SaasCard>
        ) : null}
      </div>
    </div>
  );
}