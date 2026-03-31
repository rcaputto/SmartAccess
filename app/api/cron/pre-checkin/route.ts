import { NextResponse } from "next/server";
import { processPreCheckins } from "@/services/access-code.service";
import { writeAuditLog } from "@/services/audit.service";
import { prisma } from "@/lib/prisma";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return { ok: false as const, reason: "missing_secret" as const };
  }

  const provided = request.headers.get("x-cron-secret");
  if (!provided || provided !== secret) {
    return { ok: false as const, reason: "unauthorized" as const };
  }

  return { ok: true as const };
}

export async function POST(request: Request) {
  const auth = isAuthorized(request);

  if (!auth.ok) {
    if (auth.reason === "missing_secret") {
      console.error("[cron:pre-checkin] CRON_SECRET is not configured");
      return NextResponse.json(
        { success: false, error: "CRON_SECRET is not configured" },
        { status: 500 }
      );
    }

    console.warn("[cron:pre-checkin] Unauthorized request", {
      hasHeader: Boolean(request.headers.get("x-cron-secret")),
    });
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  console.info("[cron:pre-checkin] Start");
  const organizations = await prisma.organization.findMany({
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });

  try {
    const results = [];
    for (const org of organizations) {
      await writeAuditLog({
        organizationId: org.id,
        entityType: "CRON",
        entityId: "pre-checkin",
        action: "CRON_START",
        actorType: "SYSTEM",
        details: {
          at: new Date().toISOString(),
          organizationName: org.name,
        },
      });

      const summary = await processPreCheckins({ organizationId: org.id });
      results.push({ organizationId: org.id, summary });

      await writeAuditLog({
        organizationId: org.id,
        entityType: "CRON",
        entityId: "pre-checkin",
        action: "CRON_DONE",
        actorType: "SYSTEM",
        details: summary,
      });
    }

    console.info("[cron:pre-checkin] Done", { organizations: results.length });

    return NextResponse.json({
      success: true,
      organizationsProcessed: results.length,
      results,
    });
  } catch (error) {
    console.error("[cron:pre-checkin] Failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    if (organizations[0]?.id) {
      await writeAuditLog({
        organizationId: organizations[0].id,
        entityType: "CRON",
        entityId: "pre-checkin",
        action: "CRON_FAILED",
        actorType: "SYSTEM",
        details: {
          message: error instanceof Error ? error.message : String(error),
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "Pre-checkin processing failed" },
      { status: 500 }
    );
  }
}

