import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/adminGuard";
import { prisma } from "../../../../lib/prisma";

// Promote or demote users to admin/moderator - admin only
export async function PATCH(req: Request) {
  const guard = await requireAdmin(); // Only admins can appoint other admins
  if (!guard.ok) return guard.response;

  try {
    const { userId, role } = await req.json();

    if (!userId || !["admin", "moderator", "user"].includes(role)) {
      return NextResponse.json({ error: "Invalid userId or role" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, email: true, displayName: true, role: true },
    });

    // Log the action
    console.log(`[ADMIN] ${guard.user?.email} promoted/demoted ${user.email} to ${role}`);

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `${user.displayName || user.email} is now a ${role}`,
    });
  } catch (err) {
    console.error("Promotion error:", err);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}
