import { NextResponse } from "next/server";
import { ensureAndGenerateAccessCodeForBooking } from "@/services/access-code.service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const accessCode = await ensureAndGenerateAccessCodeForBooking(id);

    return NextResponse.json(accessCode);
  } catch (error) {
    console.error("Generate access code for booking error:", error);

    const message =
      error instanceof Error ? error.message : "Unexpected error";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}