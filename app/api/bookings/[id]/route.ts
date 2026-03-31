import { NextResponse } from "next/server";
import {
  getBookingById,
  isBookingServiceError,
  updateBooking,
} from "@/services/booking.service";
import { writeAuditLog } from "@/services/audit.service";
import { requireAuthContext } from "@/lib/server/auth-context";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  try {
    const { organizationId } = await requireAuthContext();
    const { id } = await context.params;
    const booking = await getBookingById({ organizationId, id });

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
  const { id } = await context.params;
  const organizationId = (await requireAuthContext()).organizationId;

  try {
    const body = await request.json();

    console.log("PATCH booking id:", id);
    console.log("PATCH booking body:", body);

    await writeAuditLog({
      organizationId,
      entityType: "BOOKING",
      entityId: id,
      action: "MANUAL_BOOKING_PATCH_REQUESTED",
      actorType: "MANUAL",
      details: body,
    });

    const booking = await updateBooking({ organizationId, id, input: body });

    await writeAuditLog({
      organizationId,
      entityType: "BOOKING",
      entityId: id,
      action: "MANUAL_BOOKING_PATCH_SUCCEEDED",
      actorType: "MANUAL",
      details: {
        status: booking.status,
      },
    });

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Error updating booking:", error);

    await writeAuditLog({
      organizationId,
      entityType: "BOOKING",
      entityId: id,
      action: "MANUAL_BOOKING_PATCH_FAILED",
      actorType: "MANUAL",
      details: {
        message: error instanceof Error ? error.message : String(error),
      },
    });

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