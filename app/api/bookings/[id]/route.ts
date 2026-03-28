import { NextResponse } from "next/server";
import {
  getBookingById,
  isBookingServiceError,
  updateBooking,
} from "@/services/booking.service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const booking = await getBookingById(id);

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Error fetching booking by id:", error);

    if (isBookingServiceError(error)) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: "Error al obtener la reserva" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    console.log("PATCH booking id:", id);
    console.log("PATCH booking body:", body);

    const booking = await updateBooking(id, body);

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Error updating booking:", error);

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
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al actualizar la reserva",
      },
      { status: 500 }
    );
  }
}