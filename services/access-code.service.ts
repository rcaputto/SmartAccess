import { prisma } from "@/lib/prisma";
import { buildPreCheckinMessage, sendWhatsAppMessage } from "./notifications.service";

export async function processPreCheckins() {
  const now = new Date();
  const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const bookings = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      checkInDate: {
        lte: next24h,
      },
      OR: [
        {
          accessCode: {
            is: null,
          },
        },
        {
          accessCode: {
            is: {
              status: "GENERATED",
            },
          },
        },
      ],
    },
    include: {
      guest: true,
      accessCode: true,
      unit: {
        include: {
          property: true,
        },
      },
    },
  });

  for (const booking of bookings) {
    let accessCode = booking.accessCode;

    // 1. SI NO EXISTE → CREAR
    if (!accessCode) {
      accessCode = await prisma.accessCode.create({
        data: {
          bookingId: booking.id,
          code: generateRandomCode(),
          status: "GENERATED",
          startsAt: booking.checkInDate,
          endsAt: booking.checkOutDate,
        },
      });
    }

    // 2. SI YA FUE ENVIADO → SKIP
    if (accessCode.status === "SENT") {
      continue;
    }

    // 3. BUILD MESSAGE
    const message = buildPreCheckinMessage({
      guestName: booking.guest.fullName,
      propertyName: booking.unit.property.name,
      propertyAddress: booking.unit.property.address || "",
      unitName: booking.unit.name,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      accessCode: accessCode.code || "",
    });

    let messageSent = false;

// 4. SEND
    if (booking.guest.phone) {
      await sendWhatsAppMessage(booking.guest.phone, message);
      messageSent = true;
    }

    // 5. UPDATE STATUS SOLO SI SE ENVIÓ
    if (messageSent) {
      await prisma.accessCode.update({
        where: { id: accessCode.id },
        data: {
          status: "SENT",
        },
      });
    }
  }
}

function generateRandomCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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

// export async function generateAccessCode(accessCodeId: string) {
//   const accessCode = await prisma.accessCode.findUnique({
//     where: { id: accessCodeId },
//     include: { booking: true },
//   })

//   if (!accessCode) {
//     throw new Error("AccessCode not found")
//   }

//   if (accessCode.status !== "PENDING") {
//     throw new Error("AccessCode is not in PENDING state")
//   }

//   // 🔐 generar código
//   const pin = generatePin()

//   const updated = await prisma.accessCode.update({
//     where: { id: accessCodeId },
//     data: {
//       code: pin,
//       status: "GENERATED",
//       provider: "demo-lock",
//       externalId: generateExternalId(),
//     },
//   })

//   return updated
// }


export async function generateAccessCode(accessCodeId: string) {
  const existingAccessCode = await prisma.accessCode.findUnique({
    where: { id: accessCodeId },
    include: { booking: true },
  });

  if (!existingAccessCode) {
    throw new Error("Access code not found");
  }

  if (
    existingAccessCode.booking.status === "CANCELLED" ||
    existingAccessCode.booking.status === "CHECKED_OUT"
  ) {
    throw new Error("Cannot generate access code for this booking");
  }

  const pin = generatePin();

  return prisma.accessCode.update({
    where: { id: accessCodeId },
    data: {
      code: pin,
      status: "GENERATED",
    },
  });
}

export async function ensureAndGenerateAccessCodeForBooking(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { accessCode: true },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.status === "CANCELLED" || booking.status === "CHECKED_OUT") {
    throw new Error("Cannot generate access code for this booking");
  }

  let accessCode = booking.accessCode;

  if (!accessCode) {
    accessCode = await prisma.accessCode.create({
      data: {
        bookingId: booking.id,
        status: "PENDING",
        startsAt: booking.checkInDate,
        endsAt: booking.checkOutDate,
      },
    });
  }

  return generateAccessCode(accessCode.id);
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