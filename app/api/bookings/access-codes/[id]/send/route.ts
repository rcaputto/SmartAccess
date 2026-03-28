import { NextResponse } from "next/server";
import { sendAccessCode } from "@/services/access-code.service";

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const result = await sendAccessCode(id);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? "Unexpected error" },
      { status: 400 }
    );
  }
}