import { getServerSession } from "next-auth";
import { authOptions, type AuthContext } from "./auth";

export async function requireAuthContext(): Promise<AuthContext> {
  const session = await getServerSession(authOptions);

  const userId = (session as any)?.userId as string | undefined;
  const organizationId = (session as any)?.organizationId as string | undefined;
  const role = (session as any)?.role as "OWNER" | "MANAGER" | undefined;

  if (!userId || !organizationId || !role) {
    throw new Error("Unauthorized");
  }

  return { userId, organizationId, role };
}

export function requireOwnerRole(ctx: AuthContext) {
  if (ctx.role !== "OWNER") {
    const error = new Error("Forbidden");
    (error as any).statusCode = 403;
    throw error;
  }
}

