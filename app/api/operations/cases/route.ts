import { NextResponse } from "next/server";
import { getOperationsCases } from "@/services/operations.service";
import { requireAuthContext } from "@/lib/server/auth-context";

export async function GET() {
  try {
    const { organizationId } = await requireAuthContext();
    const cases = await getOperationsCases({ organizationId });
    return NextResponse.json(cases);
  } catch (error) {
    console.error("[operations:cases] Failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Could not generate operations cases" },
      { status: 500 }
    );
  }
}

