import { prisma } from "@/lib/prisma";

export type OperationsIssueType =
  | "MISSING_PHONE"
  | "PRECHECKIN_NOT_SENT"
  | "ACCESS_CODE_FAILED"
  | "GENERATED_NOT_SENT";

export type OperationsCase = {
  issueType: OperationsIssueType;
  message: string;
  recommendedActions: Array<
    | "EDIT_GUEST"
    | "GENERATE_ACCESS_CODE"
    | "SEND_ACCESS_CODE"
    | "RUN_PRECHECKIN_CRON"
    | "OPEN_BOOKING"
  >;
  actionLinks: {
    openBooking: string;
    editBooking: string;
  };
  actionState: {
    canOpenBooking: boolean;
    canEditGuest: boolean;
    canGenerate: boolean;
    canSend: boolean;
  };
  delivery: {
    attempts: number;
    lastAttemptAt: string | null;
    lastStatus: string | null;
    lastError: string | null;
    lastRecipient: string | null;
  };
  booking: {
    id: string;
    reference: string | null;
    status: string;
    checkInDate: string;
    checkOutDate: string;
    guest: {
      fullName: string;
      phone: string | null;
    };
    unit: {
      name: string;
      property: {
        name: string;
      };
    };
    accessCode: {
      id: string;
      status: string;
      errorMessage: string | null;
    } | null;
  };
};

export async function getOperationsCases(params: { organizationId: string }) {
  const { organizationId } = params;
  const now = new Date();
  const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  console.info("[operations:cases] Generating cases", {
    now: now.toISOString(),
    next24h: next24h.toISOString(),
  });

  const bookingsInWindow = await prisma.booking.findMany({
    where: {
      organizationId,
      status: "CONFIRMED",
      checkInDate: {
        lte: next24h,
      },
    },
    include: {
      guest: true,
      unit: {
        include: {
          property: true,
        },
      },
      accessCode: true,
    },
    orderBy: {
      checkInDate: "asc",
    },
  });

  const cases: OperationsCase[] = [];
  const seen = new Set<string>(); // bookingId:issueType

  function pushCase(c: OperationsCase) {
    const key = `${c.booking.id}:${c.issueType}`;
    if (seen.has(key)) return;
    seen.add(key);
    cases.push(c);
  }

  const failedOutsideWindow = await prisma.accessCode.findMany({
    where: {
      organizationId,
      status: "FAILED",
      booking: {
        status: {
          not: "CANCELLED",
        },
      },
    },
    include: {
      booking: {
        include: {
          guest: true,
          unit: { include: { property: true } },
          accessCode: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 50,
  });

  const bookingIdsForDeliveries = Array.from(
    new Set([
      ...bookingsInWindow.map((b) => b.id),
      ...failedOutsideWindow.map((ac) => ac.bookingId),
    ])
  );

  const attemptsByBookingId = new Map<string, number>();
  if (bookingIdsForDeliveries.length) {
    const grouped = await prisma.notificationDelivery.groupBy({
      by: ["bookingId"],
      where: {
        organizationId,
        bookingId: { in: bookingIdsForDeliveries },
        channel: "WHATSAPP",
        status: { not: "QUEUED" },
      },
      _count: { _all: true },
    });

    for (const g of grouped) {
      attemptsByBookingId.set(g.bookingId, g._count._all);
    }
  }

  const lastDeliveryByBookingId = new Map<
    string,
    {
      createdAt: Date;
      status: string;
      errorMessage: string | null;
      reason: string | null;
      recipient: string;
    }
  >();

  if (bookingIdsForDeliveries.length) {
    const deliveries = await prisma.notificationDelivery.findMany({
      where: {
        organizationId,
        bookingId: { in: bookingIdsForDeliveries },
        channel: "WHATSAPP",
        status: { not: "QUEUED" },
      },
      orderBy: { createdAt: "desc" },
      take: 1000,
      select: {
        bookingId: true,
        createdAt: true,
        status: true,
        errorMessage: true,
        reason: true,
        recipient: true,
      },
    });

    for (const d of deliveries) {
      if (!lastDeliveryByBookingId.has(d.bookingId)) {
        lastDeliveryByBookingId.set(d.bookingId, d);
      }
      if (lastDeliveryByBookingId.size === bookingIdsForDeliveries.length) {
        break;
      }
    }
  }

  for (const b of bookingsInWindow) {
    const lastDelivery = lastDeliveryByBookingId.get(b.id) ?? null;
    const attempts = attemptsByBookingId.get(b.id) ?? 0;

    const isWithinWindow = b.checkInDate <= next24h;
    const manualActionsAllowed = b.status === "CONFIRMED" && isWithinWindow;
    const hasPhone = Boolean(b.guest.phone);

    const canGenerate =
      manualActionsAllowed &&
      (b.accessCode?.status === "PENDING" || b.accessCode?.status === "FAILED" || !b.accessCode);

    const canSend =
      manualActionsAllowed && hasPhone && b.accessCode?.status === "GENERATED";

    const baseBooking = {
      id: b.id,
      reference: b.reference,
      status: b.status,
      checkInDate: b.checkInDate.toISOString(),
      checkOutDate: b.checkOutDate.toISOString(),
      guest: {
        fullName: b.guest.fullName,
        phone: b.guest.phone,
      },
      unit: {
        name: b.unit.name,
        property: {
          name: b.unit.property.name,
        },
      },
      accessCode: b.accessCode
        ? {
            id: b.accessCode.id,
            status: b.accessCode.status,
            errorMessage: b.accessCode.errorMessage,
          }
        : null,
    };

    const baseCaseFields = {
      actionLinks: {
        openBooking: `/bookings/${b.id}`,
        editBooking: `/bookings/${b.id}/edit`,
      },
      actionState: {
        canOpenBooking: true,
        canEditGuest: true,
        canGenerate,
        canSend,
      },
      delivery: {
        attempts,
        lastAttemptAt: lastDelivery ? lastDelivery.createdAt.toISOString() : null,
        lastStatus: lastDelivery?.status ?? null,
        lastError: lastDelivery?.errorMessage ?? lastDelivery?.reason ?? null,
        lastRecipient: lastDelivery?.recipient ?? null,
      },
    };

    if (!b.guest.phone) {
      pushCase({
        issueType: "MISSING_PHONE",
        message: "Falta el teléfono del huésped para poder enviar el código.",
        recommendedActions: ["EDIT_GUEST", "OPEN_BOOKING"],
        ...baseCaseFields,
        booking: baseBooking,
      });
      continue;
    }

    if (!b.accessCode) {
      pushCase({
        issueType: "PRECHECKIN_NOT_SENT",
        message: "Reserva en ventana de pre-checkin sin access code creado/enviado.",
        recommendedActions: ["RUN_PRECHECKIN_CRON", "OPEN_BOOKING"],
        ...baseCaseFields,
        booking: baseBooking,
      });
      continue;
    }

    if (b.accessCode.status === "FAILED") {
      pushCase({
        issueType: "ACCESS_CODE_FAILED",
        message:
          b.accessCode.errorMessage ??
          "El access code está en estado FAILED y requiere revisión.",
        recommendedActions: ["GENERATE_ACCESS_CODE", "OPEN_BOOKING"],
        ...baseCaseFields,
        booking: baseBooking,
      });
      continue;
    }

    if (b.accessCode.status === "GENERATED") {
      pushCase({
        issueType: "GENERATED_NOT_SENT",
        message: "Access code generado pero todavía no enviado al huésped.",
        recommendedActions: ["SEND_ACCESS_CODE", "OPEN_BOOKING"],
        ...baseCaseFields,
        booking: baseBooking,
      });
      continue;
    }

    if (b.accessCode.status !== "SENT") {
      pushCase({
        issueType: "PRECHECKIN_NOT_SENT",
        message: `Access code en estado ${b.accessCode.status}, aún no está SENT.`,
        recommendedActions: ["OPEN_BOOKING"],
        ...baseCaseFields,
        booking: baseBooking,
      });
    }
  }

  for (const ac of failedOutsideWindow) {
    const b = ac.booking;
    const lastDelivery = lastDeliveryByBookingId.get(b.id) ?? null;
    const attempts = attemptsByBookingId.get(b.id) ?? 0;

    const canGenerate = b.status === "CONFIRMED";
    const canSend = Boolean(b.guest.phone) && b.accessCode?.status === "GENERATED";

    const baseBooking = {
      id: b.id,
      reference: b.reference,
      status: b.status,
      checkInDate: b.checkInDate.toISOString(),
      checkOutDate: b.checkOutDate.toISOString(),
      guest: {
        fullName: b.guest.fullName,
        phone: b.guest.phone,
      },
      unit: {
        name: b.unit.name,
        property: { name: b.unit.property.name },
      },
      accessCode: b.accessCode
        ? {
            id: b.accessCode.id,
            status: b.accessCode.status,
            errorMessage: b.accessCode.errorMessage,
          }
        : null,
    };

    pushCase({
      issueType: "ACCESS_CODE_FAILED",
      message:
        ac.errorMessage ??
        "El access code está en estado FAILED y requiere revisión.",
      recommendedActions: ["GENERATE_ACCESS_CODE", "OPEN_BOOKING"],
      actionLinks: {
        openBooking: `/bookings/${b.id}`,
        editBooking: `/bookings/${b.id}/edit`,
      },
      actionState: {
        canOpenBooking: true,
        canEditGuest: true,
        canGenerate,
        canSend,
      },
      delivery: {
        attempts,
        lastAttemptAt: lastDelivery ? lastDelivery.createdAt.toISOString() : null,
        lastStatus: lastDelivery?.status ?? null,
        lastError: lastDelivery?.errorMessage ?? lastDelivery?.reason ?? null,
        lastRecipient: lastDelivery?.recipient ?? null,
      },
      booking: baseBooking,
    });
  }

  console.info("[operations:cases] Done", { count: cases.length });
  return cases;
}

