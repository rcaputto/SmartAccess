import BookingForm from "../../../components/bookings/booking-form";
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

type BookingDetail = {
  id: string;
  reference: string | null;
  checkInDate: string;
  checkOutDate: string;
  status: "PENDING" | "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";
  guestCount: number | null;
  notes: string | null;
  unitId: string;
  guest: {
    fullName: string;
    email: string | null;
    phone: string | null;
    documentId: string | null;
  };
};

async function getUnits(): Promise<UnitOption[]> {
  return serverFetchJson<UnitOption[]>("/api/units");
}

async function getBooking(id: string): Promise<BookingDetail> {
  return serverFetchJson<BookingDetail>(`/api/bookings/${id}`);
}

export default async function EditBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [booking, units] = await Promise.all([getBooking(id), getUnits()]);
  const activeUnits = units.filter((unit) => unit.isActive);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-6">
        <p className="text-sm text-gray-500">Bookings</p>
        <h1 className="text-2xl font-bold">Editar reserva</h1>
        <p className="text-sm text-gray-600">
          Actualiza fechas, huésped y datos operativos de la reserva.
        </p>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <BookingForm
          mode="edit"
          bookingId={booking.id}
          units={activeUnits}
          initialValues={{
            unitId: booking.unitId,
            guest: {
              fullName: booking.guest.fullName,
              email: booking.guest.email,
              phone: booking.guest.phone,
              documentId: booking.guest.documentId,
            },
            checkInDate: booking.checkInDate,
            checkOutDate: booking.checkOutDate,
            guestCount: booking.guestCount,
            notes: booking.notes,
          }}
        />
      </div>
    </main>
  );
}