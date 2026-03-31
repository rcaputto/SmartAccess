import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireAuthContext } from "@/lib/server/auth-context";

export async function GET() {
  try {
    const { organizationId } = await requireAuthContext();
    const units = await prisma.unit.findMany({
      where: { organizationId },
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