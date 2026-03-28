import BookingsTable from "@/components/bookings/bookings-table";

async function getBookings() {
  const res = await fetch("http://localhost:3000/api/bookings", {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("No se pudieron cargar las reservas");
  }

  return res.json();
}

export default async function BookingsPage() {
  const bookings = await getBookings();

  return (
    <main className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Bookings</h1>
        <p className="text-sm text-gray-600">
          Gestión de reservas y códigos de acceso
        </p>
      </div>

      <BookingsTable bookings={bookings} />
    </main>
  );
}