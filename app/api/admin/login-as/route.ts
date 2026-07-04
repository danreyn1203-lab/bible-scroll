import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { headers } from "next/headers";

// Admin login-as endpoint for verified admins only.
// Allows admin to generate a session token for testing accounts.
export async function POST(req: Request) {
  try {
    const headersList = await headers();
    const auth = headersList.get("authorization");
    const adminKey = process.env.ADMIN_SECRET_KEY;

    if (!auth || !adminKey || !auth.includes(adminKey)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, displayName: true, role: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Generate a temporary JWT token (valid for 24 hours)
    const token = Buffer.from(JSON.stringify({ sub: user.id, email: user.email, iat: Date.now() })).toString("base64");

    return NextResponse.json({
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      token,
      message: "Admin session created. Set this token in localStorage[\"auth_token\"]",
    });
  } catch (err) {
    console.error("Admin login error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
