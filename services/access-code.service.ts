import { prisma } from "@/lib/prisma";
import { buildPreCheckinMessage, sendWhatsAppMessage } from "./notifications.service";

function isWithinPreCheckinWindow(checkInDate: Date, now = new Date()) {
  const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return checkInDate <= next24h;
}

async function recordDelivery(params: {
  bookingId: string;
  accessCodeId?: string | null;
  organizationId?: string | null;
  recipient: string;
  body: string;
  status: "QUEUED" | "SENT" | "FAILED" | "SKIPPED";
  reason?: string | null;
  errorMessage?: string | null;
  providerMessageId?: string | null;
  attempt?: number;
  sentAt?: Date | null;
  failedAt?: Date | null;
}) {
  const {
    bookingId,
    accessCodeId,
    organizationId,
    recipient,
    body,
    status,
    reason,
    errorMessage,
    providerMessageId,
    attempt,
    sentAt,
    failedAt,
  } = params;

  const orgId =
    organizationId ??
    (
      await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { organizationId: true },
      })
    )?.organizationId ??
    null;

  if (!orgId) {
    throw new Error("Missing organizationId for delivery record");
  }

  if (status === "SKIPPED" && reason) {
    const dedupeWindowHours = 12;
    const since = new Date(Date.now() - dedupeWindowHours * 60 * 60 * 1000);

    const recentDuplicate = await prisma.notificationDelivery.findFirst({
      where: {
        bookingId,
        status: "SKIPPED",
        reason,
        createdAt: {
          gte: since,
        },
      },
      select: {
        id: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (recentDuplicate) {
      console.info("[delivery] Deduped SKIPPED delivery", {
        bookingId,
        reason,
        withinHours: dedupeWindowHours,
        existingId: recentDuplicate.id,
        existingCreatedAt: recentDuplicate.createdAt.toISOString(),
      });
      return null;
    }
  }

  const computedAttempt =
    attempt ??
    ((await prisma.notificationDelivery.count({
      where: {
        bookingId,
        accessCodeId: accessCodeId ?? null,
        channel: "WHATSAPP",
        status: {
          not: "QUEUED",
        },
      },
    })) + 1);

  return prisma.notificationDelivery.create({
    data: {
      organizationId: orgId,
      bookingId,
      accessCodeId: accessCodeId ?? null,
      channel: "WHATSAPP",
      recipient,
      body,
      status,
      reason: reason ?? null,
      errorMessage: errorMessage ?? null,
      providerMessageId: providerMessageId ?? null,
      attempt: computedAttempt,
      sentAt: sentAt ?? null,
      failedAt: failedAt ?? null,
    },
  });
}

export type PreCheckinProcessSummary = {
  processed: number;
  created: number;
  sent: number;
  skipped: number;
  failed: number;
  details?: Array<{
    bookingId: string;
    accessCodeId?: string;
    action:
      | "created"
      | "reused"
      | "sent"
      | "skipped_already_sent"
      | "skipped_missing_phone"
      | "skipped_no_action"
      | "failed";
    reason?: string;
  }>;
};

export async function processPreCheckins(params: {
  organizationId?: string;
} = {}): Promise<PreCheckinProcessSummary> {
  const now = new Date();
  const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  console.info("[pre-checkin] Scanning confirmed bookings", {
    now: now.toISOString(),
    next24h: next24h.toISOString(),
  });

  const bookings = await prisma.booking.findMany({
    where: {
      ...(params.organizationId ? { organizationId: params.organizationId } : {}),
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

  const summary: PreCheckinProcessSummary = {
    processed: 0,
    created: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    details: [],
  };

  console.info("[pre-checkin] Candidates found", { count: bookings.length });

  for (const booking of bookings) {
    summary.processed += 1;
    let accessCodeIdForDelivery: string | null = booking.accessCode?.id ?? null;
    let messageBodyForDelivery: string | null = null;

    console.info("[pre-checkin] Processing booking", {
      bookingId: booking.id,
      reference: booking.reference,
      checkInDate: booking.checkInDate.toISOString(),
      hasPhone: Boolean(booking.guest.phone),
      accessCodeStatus: booking.accessCode?.status ?? null,
    });

    try {
      let accessCode = booking.accessCode;

      // 1) Ensure access code exists (create only during pre-checkin flow)
      if (!accessCode) {
        try {
          accessCode = await prisma.accessCode.create({
            data: {
              organizationId: booking.organizationId!,
              bookingId: booking.id,
              code: generateRandomCode(),
              status: "GENERATED",
              startsAt: booking.checkInDate,
              endsAt: booking.checkOutDate,
            },
          });

          summary.created += 1;
          accessCodeIdForDelivery = accessCode.id;
          summary.details?.push({
            bookingId: booking.id,
            accessCodeId: accessCode.id,
            action: "created",
          });
        } catch (error) {
          // If a concurrent process created it, reuse.
          const existing = await prisma.accessCode.findUnique({
            where: { bookingId: booking.id },
          });

          if (!existing) {
            throw error;
          }

          accessCode = existing;
          accessCodeIdForDelivery = accessCode.id;
          summary.details?.push({
            bookingId: booking.id,
            accessCodeId: accessCode.id,
            action: "reused",
            reason: "access_code_already_exists",
          });
        }
      } else {
        accessCodeIdForDelivery = accessCode.id;
        summary.details?.push({
          bookingId: booking.id,
          accessCodeId: accessCode.id,
          action: "reused",
          reason: "existing_access_code",
        });
      }

      // 2) Idempotency: if already SENT, do nothing.
      if (accessCode.status === "SENT") {
        summary.skipped += 1;
        summary.details?.push({
          bookingId: booking.id,
          accessCodeId: accessCode.id,
          action: "skipped_already_sent",
        });
        console.info("[pre-checkin] Skip (already SENT)", {
          bookingId: booking.id,
          accessCodeId: accessCode.id,
        });
        continue;
      }

      // 3) If missing phone, do not send and do not mark SENT.
      if (!booking.guest.phone) {
        summary.skipped += 1;
        summary.details?.push({
          bookingId: booking.id,
          accessCodeId: accessCode.id,
          action: "skipped_missing_phone",
        });
        console.warn("[pre-checkin] Skip (missing phone)", {
          bookingId: booking.id,
          accessCodeId: accessCode.id,
        });

        await recordDelivery({
          organizationId: booking.organizationId ?? null,
          bookingId: booking.id,
          accessCodeId: accessCodeIdForDelivery,
          recipient: "MISSING_PHONE",
          body: "",
          status: "SKIPPED",
          reason: "missing_phone",
        });
        continue;
      }

      // 4) Send only when access code is GENERATED and has code
      if (accessCode.status !== "GENERATED" || !accessCode.code) {
        summary.skipped += 1;
        summary.details?.push({
          bookingId: booking.id,
          accessCodeId: accessCode.id,
          action: "skipped_no_action",
          reason: `status=${accessCode.status}`,
        });
        console.info("[pre-checkin] Skip (no action for status)", {
          bookingId: booking.id,
          accessCodeId: accessCode.id,
          status: accessCode.status,
        });
        continue;
      }

      const message = buildPreCheckinMessage({
        guestName: booking.guest.fullName,
        propertyName: booking.unit.property.name,
        propertyAddress: booking.unit.property.address || "",
        unitName: booking.unit.name,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        accessCode: accessCode.code,
      });
      messageBodyForDelivery = message;

      await sendWhatsAppMessage(booking.guest.phone, message);

      await prisma.accessCode.update({
        where: { id: accessCode.id },
        data: {
          status: "SENT",
          lastSyncedAt: new Date(),
          errorMessage: null,
        },
      });

      summary.sent += 1;
      summary.details?.push({
        bookingId: booking.id,
        accessCodeId: accessCode.id,
        action: "sent",
      });

      console.info("[pre-checkin] Sent", {
        bookingId: booking.id,
        accessCodeId: accessCode.id,
      });

      await recordDelivery({
        organizationId: booking.organizationId ?? null,
        bookingId: booking.id,
        accessCodeId: accessCodeIdForDelivery,
        recipient: booking.guest.phone,
        body: messageBodyForDelivery,
        status: "SENT",
        sentAt: new Date(),
      });
    } catch (error) {
      summary.failed += 1;
      summary.details?.push({
        bookingId: booking.id,
        action: "failed",
        reason: error instanceof Error ? error.message : String(error),
      });

      console.error("[pre-checkin] Failed booking", {
        bookingId: booking.id,
        message: error instanceof Error ? error.message : String(error),
      });

      // Persist what happened for operational visibility (best-effort).
      try {
        await recordDelivery({
          organizationId: booking.organizationId ?? null,
          bookingId: booking.id,
          accessCodeId: accessCodeIdForDelivery,
          recipient: booking.guest.phone ?? "MISSING_PHONE",
          body: messageBodyForDelivery ?? "",
          status: "FAILED",
          errorMessage: error instanceof Error ? error.message : String(error),
          failedAt: new Date(),
        });
      } catch (deliveryError) {
        console.error("[pre-checkin] Failed to persist delivery record", {
          bookingId: booking.id,
          message:
            deliveryError instanceof Error
              ? deliveryError.message
              : String(deliveryError),
        });
      }
    }
  }

  console.info("[pre-checkin] Summary", summary);
  return summary;
}

function generateRandomCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function buildMockDeliveryMessage(accessCode: {
  code: string | null;
  booking: {
    reference: string | null;
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
    message: `Hola ${accessCode.booking.guest.fullName}, tu código de acceso para la reserva ${accessCode.booking.reference ?? "sin referencia"} en ${accessCode.booking.unit.name} es ${accessCode.code}. Válido desde ${accessCode.booking.checkInDate.toISOString()} hasta ${accessCode.booking.checkOutDate.toISOString()}.`,
  };
}

export async function sendAccessCode(params: {
  organizationId: string;
  accessCodeId: string;
}) {
  const { organizationId, accessCodeId } = params;
  const accessCode = await prisma.accessCode.findFirst({
    where: { id: accessCodeId, organizationId },
    include: {
      booking: {
        include: {
          guest: true,
          unit: {
            include: {
              property: true,
            },
          },
        },
      },
    },
  });

  if (!accessCode) {
    throw new Error("AccessCode not found");
  }

  if (accessCode.booking.status !== "CONFIRMED") {
    throw new Error("Cannot send access code for this booking status");
  }

  if (!isWithinPreCheckinWindow(accessCode.booking.checkInDate)) {
    throw new Error("Cannot send access code outside the pre-checkin window");
  }

  if (accessCode.status !== "GENERATED") {
    throw new Error("AccessCode is not in GENERATED state");
  }

  if (!accessCode.code) {
    throw new Error("AccessCode has no code to send");
  }

  if (!accessCode.booking.guest.phone) {
    await recordDelivery({
      bookingId: accessCode.bookingId,
      accessCodeId: accessCode.id,
      recipient: "MISSING_PHONE",
      body: "",
      status: "SKIPPED",
      reason: "missing_phone",
    });
    throw new Error("Guest phone is required to send WhatsApp message");
  }

  const message = buildPreCheckinMessage({
    guestName: accessCode.booking.guest.fullName,
    propertyName: accessCode.booking.unit.property.name,
    propertyAddress: accessCode.booking.unit.property.address || "",
    unitName: accessCode.booking.unit.name,
    checkInDate: accessCode.booking.checkInDate,
    checkOutDate: accessCode.booking.checkOutDate,
    accessCode: accessCode.code,
  });

  try {
    await sendWhatsAppMessage(accessCode.booking.guest.phone, message);

    const updated = await prisma.accessCode.update({
      where: { id: accessCodeId },
      data: {
        status: "SENT",
        lastSyncedAt: new Date(),
        errorMessage: null,
      },
    });

    await recordDelivery({
      bookingId: accessCode.bookingId,
      accessCodeId: accessCode.id,
      recipient: accessCode.booking.guest.phone,
      body: message,
      status: "SENT",
      sentAt: new Date(),
    });

    return {
      ...updated,
      delivery: {
        to: accessCode.booking.guest.phone,
        channel: "WHATSAPP",
      },
    };
  } catch (error: any) {
    await prisma.accessCode.update({
      where: { id: accessCodeId },
      data: {
        status: "FAILED",
        errorMessage: error.message ?? "Send failed",
      },
    });

    try {
      await recordDelivery({
        bookingId: accessCode.bookingId,
        accessCodeId: accessCode.id,
        recipient: accessCode.booking.guest.phone,
        body: message,
        status: "FAILED",
        errorMessage: error.message ?? "Send failed",
        failedAt: new Date(),
      });
    } catch (deliveryError) {
      console.error("[sendAccessCode] Failed to persist delivery record", {
        accessCodeId,
        message:
          deliveryError instanceof Error
            ? deliveryError.message
            : String(deliveryError),
      });
    }

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


export async function generateAccessCode(params: {
  organizationId: string;
  accessCodeId: string;
}) {
  const { organizationId, accessCodeId } = params;
  const existingAccessCode = await prisma.accessCode.findFirst({
    where: { id: accessCodeId, organizationId },
    include: { booking: true },
  });

  if (!existingAccessCode) {
    throw new Error("Access code not found");
  }

  if (existingAccessCode.booking.status !== "CONFIRMED") {
    throw new Error("Cannot generate access code for this booking status");
  }

  if (!isWithinPreCheckinWindow(existingAccessCode.booking.checkInDate)) {
    throw new Error("Cannot generate access code outside the pre-checkin window");
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

export async function ensureAndGenerateAccessCodeForBooking(params: {
  organizationId: string;
  bookingId: string;
}) {
  const { organizationId, bookingId } = params;
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, organizationId },
    include: { accessCode: true },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.status !== "CONFIRMED") {
    throw new Error("Cannot generate access code for this booking status");
  }

  if (!isWithinPreCheckinWindow(booking.checkInDate)) {
    throw new Error("Cannot generate access code outside the pre-checkin window");
  }

  let accessCode = booking.accessCode;

  if (!accessCode) {
    accessCode = await prisma.accessCode.create({
      data: {
        organizationId,
        bookingId: booking.id,
        status: "PENDING",
        startsAt: booking.checkInDate,
        endsAt: booking.checkOutDate,
      },
    });
  }

  return generateAccessCode({ organizationId, accessCodeId: accessCode.id });
}

export async function processPendingAccessCodes() {
  const now = new Date();
  const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const pending = await prisma.accessCode.findMany({
    where: {
      status: "PENDING",
      booking: {
        status: "CONFIRMED",
        checkInDate: {
          lte: next24h,
        },
      },
    },
    include: {
      booking: true,
    },
  });

  const results = []

  for (const ac of pending) {
    try {
      if (!isWithinPreCheckinWindow(ac.booking.checkInDate, now)) {
        results.push({ id: ac.id, success: false, skipped: true })
        continue
      }

      const generated = await generateAccessCode({
        organizationId: ac.organizationId!,
        accessCodeId: ac.id,
      })
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