import { prisma } from "@/lib/prisma";

function buildMockDeliveryMessage(accessCode: {
  code: string | null;
  booking: {
    reference: string;
    checkInDate: Date;
    checkOutDate: Date;
    guest: {
      fullName: string;
      email: string | null;
      phone: string | null;
    };
    unit: {
      name: string;
    };
  };
}) {
  return {
    to: accessCode.booking.guest.email ?? accessCode.booking.guest.phone ?? "unknown",
    channel: accessCode.booking.guest.email ? "email" : "phone",
    message: `Hola ${accessCode.booking.guest.fullName}, tu código de acceso para la reserva ${accessCode.booking.reference} en ${accessCode.booking.unit.name} es ${accessCode.code}. Válido desde ${accessCode.booking.checkInDate.toISOString()} hasta ${accessCode.booking.checkOutDate.toISOString()}.`,
  };
}

export async function sendAccessCode(accessCodeId: string) {
  const accessCode = await prisma.accessCode.findUnique({
    where: { id: accessCodeId },
    include: {
      booking: {
        include: {
          guest: true,
          unit: true,
        },
      },
    },
  });

  if (!accessCode) {
    throw new Error("AccessCode not found");
  }

  if (accessCode.status !== "GENERATED") {
    throw new Error("AccessCode is not in GENERATED state");
  }

  if (!accessCode.code) {
    throw new Error("AccessCode has no code to send");
  }

  try {
    const delivery = buildMockDeliveryMessage(accessCode);

    console.log("MOCK SEND ACCESS CODE:", delivery);

    const updated = await prisma.accessCode.update({
      where: { id: accessCodeId },
      data: {
        status: "SENT",
        lastSyncedAt: new Date(),
        errorMessage: null,
      },
    });

    return {
      ...updated,
      delivery,
    };
  } catch (error: any) {
    await prisma.accessCode.update({
      where: { id: accessCodeId },
      data: {
        status: "FAILED",
        errorMessage: error.message ?? "Send failed",
      },
    });

    throw error;
  }
}

function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function generateExternalId(): string {
  return `lock_${Date.now()}_${Math.floor(Math.random() * 1000)}`
}

export async function generateAccessCode(accessCodeId: string) {
  const accessCode = await prisma.accessCode.findUnique({
    where: { id: accessCodeId },
    include: { booking: true },
  })

  if (!accessCode) {
    throw new Error("AccessCode not found")
  }

  if (accessCode.status !== "PENDING") {
    throw new Error("AccessCode is not in PENDING state")
  }

  // 🔐 generar código
  const pin = generatePin()

  const updated = await prisma.accessCode.update({
    where: { id: accessCodeId },
    data: {
      code: pin,
      status: "GENERATED",
      provider: "demo-lock",
      externalId: generateExternalId(),
    },
  })

  return updated
}

export async function processPendingAccessCodes() {
  const pending = await prisma.accessCode.findMany({
    where: { status: "PENDING" },
  })

  const results = []

  for (const ac of pending) {
    try {
      const generated = await generateAccessCode(ac.id)
      results.push({ id: ac.id, success: true, code: generated.code })
    } catch (error: any) {
      await prisma.accessCode.update({
        where: { id: ac.id },
        data: {
          status: "FAILED",
          errorMessage: error.message,
        },
      })

      results.push({ id: ac.id, success: false })
    }
  }

  return results
}