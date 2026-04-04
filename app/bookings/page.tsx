import Link from "next/link";
import BookingsFilters from "../components/bookings/bookings-filters";
import BookingsTable from "../components/bookings/bookings-table";
import SectionHeader from "@/app/components/ui/section-header";
import { serverFetchJson } from "@/lib/server/server-fetch";

type SearchParams = {
  status?: string;
  unitId?: string;
  from?: string;
  to?: string;
};

type BookingsTableProps = Parameters<typeof BookingsTable>[0];
type BookingRow = BookingsTableProps["bookings"][number];

type UnitOption = {
  id: string;
  name: string;
  isActive: boolean;
  property: {
    name: string;
  };
};

async function getBookings(
  searchParams: SearchParams
): Promise<BookingsTableProps["bookings"]> {
  const params = new URLSearchParams();

  if (searchParams.status) params.set("status", searchParams.status);
  if (searchParams.unitId) params.set("unitId", searchParams.unitId);
  if (searchParams.from) params.set("from", searchParams.from);
  if (searchParams.to) params.set("to", searchParams.to);

  const queryString = params.toString();
  const path = queryString ? `/api/bookings?${queryString}` : "/api/bookings";
  return serverFetchJson<BookingRow[]>(path);
}

async function getUnits(): Promise<UnitOption[]> {
  return serverFetchJson<UnitOption[]>("/api/units");
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;

  const [bookings, units] = await Promise.all([
    getBookings(resolvedSearchParams),
    getUnits(),
  ]);

  const activeUnits = units.filter((unit) => unit.isActive);

  return (
    <div className="page-section mx-auto w-full max-w-7xl">
      <SectionHeader
        eyebrow="Panel"
        title="Reservas"
        subtitle="Listado de reservas, unidades y códigos de acceso."
        actions={
          <>
            <Link href="/operations" className="btn btn-secondary btn-sm">
              Operaciones
            </Link>
            <Link href="/bookings/new" className="btn btn-primary btn-sm">
              Nueva reserva
            </Link>
          </>
        }
      />

      <BookingsFilters units={activeUnits} />

      <BookingsTable bookings={bookings} />
    </div>
  );
}