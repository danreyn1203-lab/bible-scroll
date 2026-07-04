// Promote a user to admin or moderator.
// Usage: npx tsx --env-file=.env scripts/promote-admin.ts <email> [admin|moderator]
//
// Bootstrap your first admin after deploy. After that, admins can manage
// roles through the dashboard at /admin.html.

import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const email = process.argv[2];
  const role = (process.argv[3] || "admin") as "admin" | "moderator" | "user";

  if (!email) {
    console.error("Usage: npx tsx scripts/promote-admin.ts <email> [admin|moderator|user]");
    process.exit(1);
  }
  if (!["admin", "moderator", "user"].includes(role)) {
    console.error(`Invalid role: ${role}. Must be admin, moderator, or user.`);
    process.exit(1);
  }

  const user = await prisma.user.update({
    where: { email },
    data: { role },
    select: { id: true, email: true, role: true },
  });
  console.log(`✅ ${user.email} is now ${user.role}`);
  await prisma.$disconnect();
}

main().catch(async e => {
  console.error("Failed:", e.message);
  await prisma.$disconnect();
  process.exit(1);
});
