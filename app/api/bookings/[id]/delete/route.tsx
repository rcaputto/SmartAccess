import { NextResponse } from "next/server";
import { deleteBooking } from "@/services/booking.service";
// deja también tus imports actuales

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await deleteBooking(id);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Delete booking error:", error);

    const message =
      error instanceof Error ? error.message : "Unexpected error";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}