import { NextResponse } from "next/server";
import { BookingStatus } from "@prisma/client";
import {
  createBooking,
  getAllBookings,
  isBookingServiceError,
} from "@/services/booking.service";
import { processPreCheckins } from "@/services/access-code.service";

export async function GET(request: Request) {
  await processPreCheckins();
  try {
    const { searchParams } = new URL(request.url);

    const statusParam = searchParams.get("status");
    const unitId = searchParams.get("unitId") ?? undefined;
    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;

    const bookings = await getAllBookings({
      status: statusParam ? (statusParam as BookingStatus) : undefined,
      unitId,
      from,
      to,
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);

    if (isBookingServiceError(error)) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: "Error al obtener las reservas" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const booking = await createBooking(body);

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("Error creating booking:", error);

    if (isBookingServiceError(error)) {
      return NextResponse.json(
        {
          error: error.message,
          ...(error.details ?? {}),
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: "Error interno al crear la reserva" },
      { status: 500 }
    );
  }
}