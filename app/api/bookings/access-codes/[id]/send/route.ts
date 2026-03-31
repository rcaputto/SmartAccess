import { NextResponse } from "next/server";
import { sendAccessCode } from "@/services/access-code.service";
import { writeAuditLog } from "@/services/audit.service";
import { requireAuthContext } from "@/lib/server/auth-context";

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const { organizationId } = await requireAuthContext();
    console.info("[manual] Send access code", { accessCodeId: id });
    await writeAuditLog({
      organizationId,
      entityType: "ACCESS_CODE",
      entityId: id,
      action: "MANUAL_SEND_REQUESTED",
      actorType: "MANUAL",
    });

    const result = await sendAccessCode({ organizationId, accessCodeId: id });

    await writeAuditLog({
      organizationId,
      entityType: "ACCESS_CODE",
      entityId: id,
      action: "MANUAL_SEND_SUCCEEDED",
      actorType: "MANUAL",
    });

    return NextResponse.json(result);
  } catch (error: any) {
    const organizationId = (await requireAuthContext()).organizationId;
    await writeAuditLog({
      organizationId,
      entityType: "ACCESS_CODE",
      entityId: id,
      action: "MANUAL_SEND_FAILED",
      actorType: "MANUAL",
      details: {
        message: error?.message ?? "Unexpected error",
      },
    });
    return NextResponse.json(
      { error: error.message ?? "Unexpected error" },
      { status: 400 }
    );
  }
}