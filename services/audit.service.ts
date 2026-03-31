import { prisma } from "@/lib/prisma";
import { AuditActorType } from "@prisma/client";
import { Prisma } from "@prisma/client";

export type AuditWriteInput = {
  organizationId: string;
  entityType: string;
  entityId: string;
  action: string;
  actorType: AuditActorType;
  actorLabel?: string | null;
  details?: Prisma.InputJsonValue | null;
};

export async function writeAuditLog(input: AuditWriteInput) {
  try {
    return await prisma.auditLog.create({
      data: {
        organizationId: input.organizationId,
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        actorType: input.actorType,
        actorLabel: input.actorLabel ?? null,
        details:
          input.details === undefined
            ? undefined
            : input.details === null
            ? Prisma.JsonNull
            : input.details,
      },
    });
  } catch (error) {
    console.error("[audit] Failed to write audit log", {
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

