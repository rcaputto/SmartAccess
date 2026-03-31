import BookingForm from "../../components/bookings/booking-form";
import { serverFetchJson } from "@/lib/server/server-fetch";

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
  return serverFetchJson<UnitOption[]>("/api/units");
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