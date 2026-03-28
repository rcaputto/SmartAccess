import BookingForm from "../../components/bookings/booking-form";

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

async function getUnits(): Promise<UnitOption[]> {
  const res = await fetch("http://localhost:3000/api/units", {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("No se pudieron cargar las unidades");
  }

  return res.json();
}

export default async function NewBookingPage() {
  const units = await getUnits();
  const activeUnits = units.filter((unit) => unit.isActive);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-6">
        <p className="text-sm text-gray-500">Bookings</p>
        <h1 className="text-2xl font-bold">Nueva reserva</h1>
        <p className="text-sm text-gray-600">
          Crea una nueva reserva y genera el flujo de acceso automáticamente.
        </p>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <BookingForm mode="create" units={activeUnits} />
      </div>
    </main>
  );
}