import { NextResponse } from "next/server";
import { auth } from "../auth";
import { prisma } from "./prisma";

export type AdminGuardResult =
  | { ok: true; user: { id: string; email: string; role: "moderator" | "admin" } }
  | { ok: false; response: NextResponse };

// Returns the current user if they are moderator or admin, else a 401/403 response.
// Pattern: `const guard = await requireStaff(); if (!guard.ok) return guard.response;`
export async function requireStaff(): Promise<AdminGuardResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, response: NextResponse.json({ error: "Not logged in" }, { status: 401 }) };
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, role: true, bannedAt: true },
  });
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "User not found" }, { status: 404 }) };
  }
  if (user.bannedAt) {
    return { ok: false, response: NextResponse.json({ error: "Account suspended" }, { status: 403 }) };
  }
  if (user.role !== "admin" && user.role !== "moderator") {
    return { ok: false, response: NextResponse.json({ error: "Staff access required" }, { status: 403 }) };
  }
  return { ok: true, user: { id: user.id, email: user.email, role: user.role } };
}

// Admin-only guard (stricter — moderators cannot pass)
export async function requireAdmin(): Promise<AdminGuardResult> {
  const guard = await requireStaff();
  if (!guard.ok) return guard;
  if (guard.user.role !== "admin") {
    return { ok: false, response: NextResponse.json({ error: "Admin access required" }, { status: 403 }) };
  }
  return guard;
}
