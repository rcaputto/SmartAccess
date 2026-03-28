import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    const units = await prisma.unit.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        property: true,
      },
    });

    return NextResponse.json(units);
  } catch {
    return NextResponse.json(
      { error: "No se pudieron cargar las unidades" },
      { status: 500 }
    );
  }
}