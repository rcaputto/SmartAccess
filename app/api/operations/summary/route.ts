import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthContext } from "@/lib/server/auth-context";

export async function GET() {
  const { organizationId } = await requireAuthContext();
  const now = new Date();
  const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  console.info("[operations:summary] Generating summary", {
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
    select: {
      id: true,
      checkInDate: true,
      guest: {
        select: {
          phone: true,
        },
      },
      accessCode: {
        select: {
          status: true,
        },
      },
    },
  });

  const checkingInNext24h = bookingsInWindow.length;

  const missingPhoneInWindow = bookingsInWindow.filter(
    (b) => !b.guest.phone
  ).length;

  const withoutSentAccessCodeInWindow = bookingsInWindow.filter((b) => {
    if (!b.accessCode) return true;
    return b.accessCode.status !== "SENT";
  }).length;

  const generatedNotSentInWindow = bookingsInWindow.filter(
    (b) => b.accessCode?.status === "GENERATED"
  ).length;

  const failedAccessCodes = await prisma.accessCode.count({
    where: {
      organizationId,
      status: "FAILED",
    },
  });

  const summary = {
    now: now.toISOString(),
    next24h: next24h.toISOString(),
    checkingInNext24h,
    withoutSentAccessCodeInWindow,
    missingPhoneInWindow,
    generatedNotSentInWindow,
    failedAccessCodes,
  };

  console.info("[operations:summary] Done", summary);
  return NextResponse.json(summary);
}

