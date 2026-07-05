// Shared Prisma client. Next.js dev mode reloads modules on every request,
// so we cache the client on the global object to avoid exhausting Postgres
// connections with a fresh client per request.
//
// Uses the Neon serverless driver adapter so the same code runs both locally
// (Node) and on Cloudflare Workers, where raw TCP Postgres isn't available.
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaClient } from "../app/generated/prisma/client";

// The Neon driver needs a WebSocket implementation. Node 22+ and Cloudflare
// Workers both expose a global WebSocket, so use that in either environment.
if (typeof WebSocket !== "undefined") {
  neonConfig.webSocketConstructor = WebSocket as typeof neonConfig.webSocketConstructor;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
