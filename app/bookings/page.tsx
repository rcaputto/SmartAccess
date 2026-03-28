import Link from "next/link";
import BookingsFilters from "../components/bookings/bookings-filters";
import BookingsTable from "../components/bookings/bookings-table";

type SearchParams = {
  status?: string;
  unitId?: string;
  from?: string;
  to?: string;
};

type UnitOption = {
  id: string;
  name: string;
  isActive: boolean;
  property: {
    name: string;
  };
};

async function getBookings(searchParams: SearchParams) {
  const params = new URLSearchParams();

  if (searchParams.status) params.set("status", searchParams.status);
  if (searchParams.unitId) params.set("unitId", searchParams.unitId);
  if (searchParams.from) params.set("from", searchParams.from);
  if (searchParams.to) params.set("to", searchParams.to);

  const queryString = params.toString();
  const url = queryString
    ? `http://localhost:3000/api/bookings?${queryString}`
    : "http://localhost:3000/api/bookings";

  const res = await fetch(url, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("No se pudieron cargar las reservas");
  }

  return res.json();
}

async function getUnits(): Promise<UnitOption[]> {
  const res = await fetch("http://localhost:3000/api/units", {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("No se pudieron cargar las unidades");
  }

  return res.json();
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

        <Link
          href="/bookings/new"
          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Nueva reserva
        </Link>
      </div>

      <BookingsFilters units={activeUnits} />

      <BookingsTable bookings={bookings} />
    </main>
  );
}