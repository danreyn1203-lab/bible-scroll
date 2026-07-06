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

// Cloudflare Workers can reuse the same running instance across many
// unrelated requests. Caching one Prisma/Neon connection at module scope
// (fine in local Node dev) means one user's request can end up reusing a
// database connection/promise created for a different user's request —
// Cloudflare surfaces this as "promise resolved from a different request
// context" and it can cause requests to hang. Detect Workers via the
// documented navigator.userAgent check and, only there, hand back a proxy
// that builds a brand-new client (and Neon connection) per property access
// instead of one shared instance.
const isCloudflareWorkers =
  typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";

function freshClientProxy(): PrismaClient {
  return new Proxy({} as PrismaClient, {
    get(_target, prop, _receiver) {
      const client = createClient();
      return Reflect.get(client as object, prop, client);
    },
  });
}

export const prisma: PrismaClient = isCloudflareWorkers
  ? freshClientProxy()
  : globalForPrisma.prisma ?? createClient();

if (!isCloudflareWorkers && process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
