import Link from "next/link";
import BookingsFilters from "../components/bookings/bookings-filters";
import BookingsTable from "../components/bookings/bookings-table";
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
    <main className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Bookings</h1>
          <p className="text-sm text-gray-600">
            Gestión de reservas y códigos de acceso
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/operations"
            className="rounded-xl border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Operations
          </Link>

          <Link
            href="/bookings/new"
            className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Nueva reserva
          </Link>
        </div>
      </div>

      <BookingsFilters units={activeUnits} />

      <BookingsTable bookings={bookings} />
    </main>
  );
}