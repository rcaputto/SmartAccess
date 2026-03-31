import { NextResponse } from "next/server";
import { ensureAndGenerateAccessCodeForBooking } from "@/services/access-code.service";
import { writeAuditLog } from "@/services/audit.service";
import { requireAuthContext } from "@/lib/server/auth-context";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const organizationId = (await requireAuthContext()).organizationId;

  try {
    // NOTE: Manual override tool.
    // This is not the primary automation path; pre-checkin cron owns automated generation.
    // Keep for UI actions when there is no AccessCode row yet.
    console.info("[manual] Ensure+generate access for booking", { bookingId: id });
    await writeAuditLog({
      organizationId,
      entityType: "BOOKING",
      entityId: id,
      action: "MANUAL_GENERATE_ACCESS_REQUESTED",
      actorType: "MANUAL",
    });

    const accessCode = await ensureAndGenerateAccessCodeForBooking({
      organizationId,
      bookingId: id,
    });

    await writeAuditLog({
      organizationId,
      entityType: "BOOKING",
      entityId: id,
      action: "MANUAL_GENERATE_ACCESS_SUCCEEDED",
      actorType: "MANUAL",
      details: {
        accessCodeId: accessCode.id,
        accessCodeStatus: accessCode.status,
      },
    });

    return NextResponse.json(accessCode);
  } catch (error) {
    console.error("Generate access code for booking error:", error);

    await writeAuditLog({
      organizationId,
      entityType: "BOOKING",
      entityId: id,
      action: "MANUAL_GENERATE_ACCESS_FAILED",
      actorType: "MANUAL",
      details: {
        message: error instanceof Error ? error.message : "Unexpected error",
      },
    });

    const message =
      error instanceof Error ? error.message : "Unexpected error";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}