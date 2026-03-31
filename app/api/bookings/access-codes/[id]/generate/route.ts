import { NextResponse } from "next/server"
import { generateAccessCode } from "@/services/access-code.service"
import { writeAuditLog } from "@/services/audit.service"
import { requireAuthContext } from "@/lib/server/auth-context"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const { organizationId } = await requireAuthContext()
    console.log("ACCESS CODE ID:", id)

    console.info("[manual] Generate access code", { accessCodeId: id })
    await writeAuditLog({
      organizationId,
      entityType: "ACCESS_CODE",
      entityId: id,
      action: "MANUAL_GENERATE_REQUESTED",
      actorType: "MANUAL",
    })

    const result = await generateAccessCode({ organizationId, accessCodeId: id })

    await writeAuditLog({
      organizationId,
      entityType: "ACCESS_CODE",
      entityId: id,
      action: "MANUAL_GENERATE_SUCCEEDED",
      actorType: "MANUAL",
    })

    return NextResponse.json(result)
  } catch (error: any) {
    const organizationId = (await requireAuthContext()).organizationId
    await writeAuditLog({
      organizationId,
      entityType: "ACCESS_CODE",
      entityId: id,
      action: "MANUAL_GENERATE_FAILED",
      actorType: "MANUAL",
      details: {
        message: error?.message ?? "Unexpected error",
      },
    })

    return NextResponse.json(
      { error: error.message ?? "Unexpected error" },
      { status: 400 }
    )
  }
}