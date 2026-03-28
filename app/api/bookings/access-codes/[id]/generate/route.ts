import { NextResponse } from "next/server"
import { generateAccessCode } from "@/services/access-code.service"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log("ACCESS CODE ID:", id)
    const result = await generateAccessCode(id)

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? "Unexpected error" },
      { status: 400 }
    )
  }
}