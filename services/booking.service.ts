import { prisma } from "@/lib/prisma";
import { BookingStatus, AccessCodeStatus } from "@prisma/client";
import { writeAuditLog } from "./audit.service";

export type GetAllBookingsFilters = {
  status?: BookingStatus;
  unitId?: string;
  from?: string;
  to?: string;
};

export type CreateBookingInput = {
  unitId?: string;
  guest?: {
    fullName?: string;
    email?: string;
    phone?: string;
    documentId?: string;
  };
  checkInDate?: string;
  checkOutDate?: string;
  guestCount?: number;
  notes?: string;
};

export type UpdateBookingInput = {
  checkInDate?: string;
  checkOutDate?: string;
  status?: BookingStatus;
  guestCount?: number;
  notes?: string | null;
};

class BookingServiceError extends Error {
  statusCode: number;
  details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode = 400,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "BookingServiceError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

function generateBookingReference() {
  const now = new Date();

  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `BKG-${yyyy}${mm}${dd}-${randomPart}`;
}

async function generateUniqueBookingReference() {
  const maxAttempts = 5;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const reference = generateBookingReference();

    const existing = await prisma.booking.findUnique({
      where: { reference },
      select: { id: true },
    });

    if (!existing) {
      return reference;
    }
  }

  throw new BookingServiceError(
    "No se pudo generar una referencia única para la reserva",
    500
  );
}

function parseDate(value: string, fieldName: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new BookingServiceError(`Formato de ${fieldName} inválido`, 400);
  }

  return parsed;
}

function validateDateRange(checkInDate: Date, checkOutDate: Date) {
  if (checkOutDate <= checkInDate) {
    throw new BookingServiceError(
      "La fecha de salida debe ser mayor a la fecha de entrada",
      400
    );
  }
}

function isValidStatusTransition(
  currentStatus: BookingStatus,
  nextStatus: BookingStatus
) {
  if (currentStatus === nextStatus) {
    return true;
  }

  const allowedTransitions: Record<BookingStatus, BookingStatus[]> = {
    PENDING: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
    CONFIRMED: [BookingStatus.CHECKED_IN, BookingStatus.CANCELLED],
    CHECKED_IN: [BookingStatus.CHECKED_OUT],
    CHECKED_OUT: [],
    CANCELLED: [],
  };

  return allowedTransitions[currentStatus].includes(nextStatus);
}

async function findOverlappingBooking(params: {
  unitId: string;
  checkInDate: Date;
  checkOutDate: Date;
  organizationId?: string;
  excludeBookingId?: string;
}) {
  const { unitId, checkInDate, checkOutDate, excludeBookingId, organizationId } = params;

  return prisma.booking.findFirst({
    where: {
      ...(organizationId ? { organizationId } : {}),
      unitId,
      status: {
        not: BookingStatus.CANCELLED,
      },
      ...(excludeBookingId
        ? {
            id: {
              not: excludeBookingId,
            },
          }
        : {}),
      checkInDate: {
        lt: checkOutDate,
      },
      checkOutDate: {
        gt: checkInDate,
      },
    },
    select: {
      id: true,
      reference: true,
    },
  });
}

export async function getAllBookings(params: {
  organizationId: string;
  filters?: GetAllBookingsFilters;
}) {
  const { organizationId, filters = {} } = params;
  const { status, unitId, from, to } = filters;

  let parsedFrom: Date | undefined;
  let parsedTo: Date | undefined;

  if (from) {
    parsedFrom = parseDate(from, "from");
  }

  if (to) {
    parsedTo = parseDate(to, "to");
  }

  if (parsedFrom && parsedTo && parsedTo <= parsedFrom) {
    throw new BookingServiceError(
      "El rango de fechas es inválido: 'to' debe ser mayor a 'from'",
      400
    );
  }

  if (status && !Object.values(BookingStatus).includes(status)) {
    throw new BookingServiceError("Estado inválido", 400);
  }

  return prisma.booking.findMany({
    where: {
      organizationId,
      ...(status ? { status } : {}),
      ...(unitId ? { unitId } : {}),
      ...(parsedFrom && parsedTo
        ? {
            checkInDate: {
              lt: parsedTo,
            },
            checkOutDate: {
              gt: parsedFrom,
            },
          }
        : parsedFrom
        ? {
            checkOutDate: {
              gt: parsedFrom,
            },
          }
        : parsedTo
        ? {
            checkInDate: {
              lt: parsedTo,
            },
          }
        : {}),
    },
    orderBy: {
      checkInDate: "asc",
    },
    include: {
  unit: {
    include: {
      property: true,
    },
  },
  guest: true,
  accessCode: true,
},
  });
}

export async function getBookingById(params: { organizationId: string; id: string }) {
  const { organizationId, id } = params;
  const booking = await prisma.booking.findUnique({
    where: { id, organizationId },
    include: {
  unit: {
    include: {
      property: true,
    },
  },
  guest: true,
  accessCode: true,
  notificationDeliveries: {
    orderBy: {
      createdAt: "desc",
    },
  },
},
  });

  if (!booking) {
    throw new BookingServiceError("Reserva no encontrada", 404);
  }

  const auditLogs = await prisma.auditLog.findMany({
    where: {
      organizationId,
      entityType: "BOOKING",
      entityId: booking.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });

  return {
    ...booking,
    auditLogs,
  };
}

export async function createBooking(params: {
  organizationId: string;
  input: CreateBookingInput;
}) {
  const { organizationId, input } = params;
  const { unitId, guest, checkInDate, checkOutDate, guestCount, notes } = input;

  if (!unitId || !guest?.fullName || !checkInDate || !checkOutDate) {
    throw new BookingServiceError(
      "Campos obligatorios: unitId, guest.fullName, checkInDate, checkOutDate",
      400
    );
  }

  const parsedCheckInDate = parseDate(checkInDate, "checkInDate");
  const parsedCheckOutDate = parseDate(checkOutDate, "checkOutDate");

  validateDateRange(parsedCheckInDate, parsedCheckOutDate);

  const unit = await prisma.unit.findUnique({
    where: { id: unitId, organizationId },
    select: {
      id: true,
      maxGuests: true,
      isActive: true,
    },
  });

  if (!unit) {
    throw new BookingServiceError("La unidad indicada no existe", 404);
  }

  if (!unit.isActive) {
    throw new BookingServiceError("La unidad está inactiva", 400);
  }

  if (
    typeof guestCount === "number" &&
    unit.maxGuests &&
    guestCount > unit.maxGuests
  ) {
    throw new BookingServiceError(
      "La cantidad de huéspedes excede la capacidad de la unidad",
      400
    );
  }

  const overlappingBooking = await findOverlappingBooking({
    organizationId,
    unitId,
    checkInDate: parsedCheckInDate,
    checkOutDate: parsedCheckOutDate,
  });

  if (overlappingBooking) {
    throw new BookingServiceError(
      "Ya existe una reserva solapada para esa unidad en ese período",
      409,
      {
        conflictingBookingId: overlappingBooking.id,
        conflictingBookingReference: overlappingBooking.reference,
      }
    );
  }

  let guestRecord;

  if (guest.email) {
    guestRecord = await prisma.guest.findFirst({
      where: {
        organizationId,
        email: guest.email,
      },
    });

    if (!guestRecord) {
      guestRecord = await prisma.guest.create({
        data: {
          organizationId,
          fullName: guest.fullName,
          email: guest.email,
          phone: guest.phone,
          documentId: guest.documentId,
        },
      });
    }
  } else {
    guestRecord = await prisma.guest.create({
      data: {
        organizationId,
        fullName: guest.fullName,
        email: guest.email,
        phone: guest.phone,
        documentId: guest.documentId,
      },
    });
  }

  const reference = await generateUniqueBookingReference();

 const booking = await prisma.booking.create({
  data: {
    organizationId,
    reference,
    unitId,
    guestId: guestRecord.id,
    checkInDate: parsedCheckInDate,
    checkOutDate: parsedCheckOutDate,
    status: BookingStatus.CONFIRMED,
    guestCount,
    notes,
  },
});

return prisma.booking.findUniqueOrThrow({
  where: { id: booking.id },
  include: {
    unit: {
      include: {
        property: true,
      },
    },
    guest: true,
    accessCode: true,
  },
});
}

export async function updateBooking(params: {
  organizationId: string;
  id: string;
  input: UpdateBookingInput;
}) {
  const { organizationId, id, input } = params;
  const booking = await prisma.booking.findUnique({
    where: { id, organizationId },
    include: {
      unit: true,
      accessCode: true,
    },
  });

  if (!booking) {
    throw new BookingServiceError("Reserva no encontrada", 404);
  }

  const hasCheckInUpdate = Object.prototype.hasOwnProperty.call(
    input,
    "checkInDate"
  );
  const hasCheckOutUpdate = Object.prototype.hasOwnProperty.call(
    input,
    "checkOutDate"
  );
  const hasStatusUpdate = Object.prototype.hasOwnProperty.call(input, "status");
  const hasGuestCountUpdate = Object.prototype.hasOwnProperty.call(
    input,
    "guestCount"
  );
  const hasNotesUpdate = Object.prototype.hasOwnProperty.call(input, "notes");

  if (
    !hasCheckInUpdate &&
    !hasCheckOutUpdate &&
    !hasStatusUpdate &&
    !hasGuestCountUpdate &&
    !hasNotesUpdate
  ) {
    throw new BookingServiceError("No se enviaron campos para actualizar", 400);
  }

  if (
    booking.status === BookingStatus.CHECKED_OUT ||
    booking.status === BookingStatus.CANCELLED
  ) {
    throw new BookingServiceError(
      "No se puede modificar una reserva finalizada o cancelada",
      400
    );
  }

  let nextCheckInDate = booking.checkInDate;
  let nextCheckOutDate = booking.checkOutDate;

  if (hasCheckInUpdate) {
    if (!input.checkInDate) {
      throw new BookingServiceError("checkInDate no puede estar vacío", 400);
    }
    nextCheckInDate = parseDate(input.checkInDate, "checkInDate");
  }

  if (hasCheckOutUpdate) {
    if (!input.checkOutDate) {
      throw new BookingServiceError("checkOutDate no puede estar vacío", 400);
    }
    nextCheckOutDate = parseDate(input.checkOutDate, "checkOutDate");
  }

  validateDateRange(nextCheckInDate, nextCheckOutDate);

  if (hasGuestCountUpdate) {
    if (
      typeof input.guestCount !== "number" ||
      input.guestCount <= 0 ||
      !Number.isInteger(input.guestCount)
    ) {
      throw new BookingServiceError(
        "guestCount debe ser un número entero mayor que 0",
        400
      );
    }

    if (booking.unit.maxGuests && input.guestCount > booking.unit.maxGuests) {
      throw new BookingServiceError(
        "La cantidad de huéspedes excede la capacidad de la unidad",
        400
      );
    }
  }

  let nextStatus: BookingStatus = booking.status;

  if (hasStatusUpdate) {
    if (!input.status) {
      throw new BookingServiceError("status no puede estar vacío", 400);
    }

    const validStatuses = Object.values(BookingStatus);
    if (!validStatuses.includes(input.status)) {
      throw new BookingServiceError("Estado inválido", 400);
    }

    if (!isValidStatusTransition(booking.status, input.status)) {
      throw new BookingServiceError(
        `Transición de estado inválida: ${booking.status} -> ${input.status}`,
        400
      );
    }

    nextStatus = input.status;
  }

  const datesChanged =
    nextCheckInDate.getTime() !== booking.checkInDate.getTime() ||
    nextCheckOutDate.getTime() !== booking.checkOutDate.getTime();

  if (datesChanged && nextStatus !== BookingStatus.CANCELLED) {
    const overlappingBooking = await findOverlappingBooking({
      organizationId,
      unitId: booking.unitId,
      checkInDate: nextCheckInDate,
      checkOutDate: nextCheckOutDate,
      excludeBookingId: booking.id,
    });

    if (overlappingBooking) {
      throw new BookingServiceError(
        "Ya existe una reserva solapada para esa unidad en ese período",
        409,
        {
          conflictingBookingId: overlappingBooking.id,
          conflictingBookingReference: overlappingBooking.reference,
        }
      );
    }
  }

  const updatedBooking = await prisma.booking.update({
    where: { id: booking.id, organizationId },
    data: {
      checkInDate: nextCheckInDate,
      checkOutDate: nextCheckOutDate,
      status: nextStatus,
      ...(hasGuestCountUpdate ? { guestCount: input.guestCount } : {}),
      ...(hasNotesUpdate ? { notes: input.notes ?? null } : {}),
    },
    include: {
      unit: {
        include: {
          property: true,
        },
      },
      guest: true,
      accessCode: true,
    },
  });

  if (updatedBooking.status !== booking.status) {
    await writeAuditLog({
      organizationId,
      entityType: "BOOKING",
      entityId: updatedBooking.id,
      action: "BOOKING_STATUS_CHANGED",
      actorType: "MANUAL",
      details: {
        from: booking.status,
        to: updatedBooking.status,
      },
    });
  }

  // Business rule: CONFIRMED must NOT auto-generate access codes.
  // We only sync access windows if an access code already exists.
  if (datesChanged && updatedBooking.accessCode) {
    await syncAccessCodeWindowForBooking({
      bookingId: updatedBooking.id,
      checkInDate: updatedBooking.checkInDate,
      checkOutDate: updatedBooking.checkOutDate,
    });
  }

  if (updatedBooking.status === BookingStatus.CANCELLED) {
    await cancelAccessCodeForBooking(updatedBooking.id);
  }

  return prisma.booking.findUniqueOrThrow({
    where: { id: updatedBooking.id, organizationId },
    include: {
      unit: {
        include: {
          property: true,
        },
      },
      guest: true,
      accessCode: true,
    },
  });
}
export function isBookingServiceError(
  error: unknown
): error is BookingServiceError {
  return error instanceof BookingServiceError;
}

export async function ensureAccessCodeForBooking(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { accessCode: true },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.accessCode) {
    return booking.accessCode;
  }

  return prisma.accessCode.create({
    data: {
      organizationId: booking.organizationId!,
      bookingId: booking.id,
      status: "PENDING",
      startsAt: booking.checkInDate,
      endsAt: booking.checkOutDate,
    },
  });
}

async function cancelAccessCodeForBooking(bookingId: string) {
  const existingAccessCode = await prisma.accessCode.findUnique({
    where: { bookingId },
    select: {
      id: true,
      status: true,
    },
  });

  if (!existingAccessCode) {
    return;
  }

  if (existingAccessCode.status === AccessCodeStatus.CANCELLED) {
    return;
  }

  await prisma.accessCode.update({
    where: { bookingId },
    data: {
      status: AccessCodeStatus.CANCELLED,
      errorMessage: null,
    },
  });
}

async function syncAccessCodeWindowForBooking(params: {
  bookingId: string;
  checkInDate: Date;
  checkOutDate: Date;
}) {
  const existingAccessCode = await prisma.accessCode.findUnique({
    where: { bookingId: params.bookingId },
    select: {
      id: true,
      status: true,
    },
  });

  if (!existingAccessCode) {
    return;
  }

  if (existingAccessCode.status === AccessCodeStatus.CANCELLED) {
    return;
  }

  await prisma.accessCode.update({
    where: { bookingId: params.bookingId },
    data: {
      startsAt: params.checkInDate,
      endsAt: params.checkOutDate,
    },
  });
}


export async function deleteBooking(params: { organizationId: string; bookingId: string }) {
  const { organizationId, bookingId } = params;
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, organizationId },
    include: {
      accessCode: true,
    },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.status !== "CANCELLED") {
    throw new Error("Only cancelled bookings can be deleted");
  }

  await prisma.$transaction(async (tx) => {
    if (booking.accessCode) {
      await tx.accessCode.delete({
        where: { bookingId: booking.id },
      });
    }

    await tx.booking.delete({
      where: { id: booking.id },
    });
  });

  return { success: true };
}