import { NextResponse } from "next/server";
import { requireAuthContext } from "@/lib/server/auth-context";
import {
  getPropertyFinanceSummary,
  isFinanceServiceError,
} from "@/services/finance.service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ propertyId: string }> }
) {
  try {
    const ctx = await requireAuthContext();
    const { propertyId } = await context.params;

    const summary = await getPropertyFinanceSummary({
      organizationId: ctx.organizationId,
      propertyId,
    });

    return NextResponse.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status =
      message === "Unauthorized"
        ? 401
        : isFinanceServiceError(error)
          ? error.statusCode
          : 500;

    let propertyIdLog: string | undefined;
    try {
      propertyIdLog = (await context.params).propertyId;
    } catch {}

    console.error("[finance:summary] error", { message, propertyId: propertyIdLog });

    return NextResponse.json(
      { error: isFinanceServiceError(error) ? error.message : message },
      { status }
    );
  }
}

