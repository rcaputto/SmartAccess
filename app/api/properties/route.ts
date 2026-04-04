import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthContext } from "@/lib/server/auth-context";

export async function GET() {
  try {
    const { organizationId } = await requireAuthContext();

    const properties = await prisma.property.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        country: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(properties);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    console.error("[properties:list]", error);
    return NextResponse.json(
      { error: "Error al obtener las propiedades" },
      { status: 500 }
    );
  }
}
