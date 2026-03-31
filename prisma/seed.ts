import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function seed() {
  // 1) Default organization (single-tenant bootstrap)
  const org =
    (await prisma.organization.findFirst()) ??
    (await prisma.organization.create({
      data: { name: "Default Organization" },
    }));

  // 2) Ensure at least one user exists (admin)
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@smartaccess.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin123";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  const admin = existingAdmin
    ? await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          fullName: existingAdmin.fullName || "Admin",
          organizationId: existingAdmin.organizationId ?? org.id,
          passwordHash: existingAdmin.passwordHash ?? passwordHash,
          role: existingAdmin.role ?? "OWNER",
        },
      })
    : await prisma.user.create({
        data: {
          fullName: "Admin",
          email: adminEmail,
          passwordHash,
          role: "OWNER",
          organizationId: org.id,
        },
      });

  // 3) Backfill organizationId across existing data
  // NOTE: organizationId/passwordHash are NOT NULL after Sprint 7 hardening,
  // so these updateMany calls are only useful during early bootstrap.

  console.info("[seed] Done", {
    organizationId: org.id,
    adminEmail,
    adminUserId: admin.id,
  });
}

seed()
  .catch((e) => {
    console.error("[seed] Failed", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

