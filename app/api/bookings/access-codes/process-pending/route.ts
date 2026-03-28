import { NextResponse } from "next/server"
import { processPendingAccessCodes } from "@/services/access-code.service"

export async function POST() {
  try {
    const result = await processPendingAccessCodes()

    return NextResponse.json({
      processed: result.length,
      result,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}