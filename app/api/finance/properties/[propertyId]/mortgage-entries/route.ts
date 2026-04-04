import { NextResponse } from "next/server";
import { requireAuthContext } from "@/lib/server/auth-context";
import {
  createMortgageEntry,
  isFinanceServiceError,
  type CreateMortgageEntryInput,
} from "@/services/finance.service";

export async function POST(
  request: Request,
  context: { params: Promise<{ propertyId: string }> }
) {
  try {
    const ctx = await requireAuthContext();
    const { propertyId } = await context.params;

    const body = (await request.json()) as CreateMortgageEntryInput;

    const created = await createMortgageEntry({
      organizationId: ctx.organizationId,
      propertyId,
      input: body,
      actorType: "MANUAL",
    });

    return NextResponse.json(created);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status =
      message === "Unauthorized"
        ? 401
        : isFinanceServiceError(error)
          ? error.statusCode
          : 500;

    return NextResponse.json(
      { error: isFinanceServiceError(error) ? error.message : message },
      { status }
    );
  }
}

