import { NextResponse } from "next/server";
import { deleteBooking } from "@/services/booking.service";
import { requireAuthContext, requireOwnerRole } from "@/lib/server/auth-context";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuthContext();
    requireOwnerRole(ctx);
    const { id } = await params;

    const result = await deleteBooking({ organizationId: ctx.organizationId, bookingId: id });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Delete booking error:", error);

    const message =
      error instanceof Error ? error.message : "Unexpected error";

    const status =
      typeof (error as any)?.statusCode === "number"
        ? (error as any).statusCode
        : 400;

    return NextResponse.json({ error: message }, { status });
  }
}