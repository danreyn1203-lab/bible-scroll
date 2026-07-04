import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// Health check for monitoring/load balancers.
// Returns 200 if DB reachable, 503 otherwise. No auth required.
export async function GET() {
  const checks: Record<string, { ok: boolean; latencyMs?: number; error?: string }> = {};
  let overallOk = true;

  // Database
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { ok: true, latencyMs: Date.now() - dbStart };
  } catch (e) {
    checks.database = { ok: false, error: e instanceof Error ? e.message : "unknown" };
    overallOk = false;
  }

  // Env presence (warnings, not failures)
  checks.config = {
    ok: !!(process.env.DATABASE_URL && process.env.AUTH_SECRET),
  };
  if (!checks.config.ok) overallOk = false;

  return NextResponse.json(
    {
      status: overallOk ? "healthy" : "degraded",
      version: process.env.npm_package_version || "unknown",
      uptime: process.uptime(),
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: overallOk ? 200 : 503 }
  );
}
