import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { prisma } from "../../../../lib/prisma";
import { sendEmail, resetPasswordTemplate, isEmailConfigured } from "../../../../lib/email";

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  // Always return ok to prevent email enumeration
  if (!user) return NextResponse.json({ ok: true });

  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  const link = `${process.env.APP_URL || "http://localhost:8943"}/reset?token=${token}`;

  if (!isEmailConfigured()) {
    return NextResponse.json({ error: "Email not configured. Set RESEND_API_KEY in .env" }, { status: 503 });
  }

  await sendEmail({ to: user.email, subject: "Reset your Taste Manna password", html: resetPasswordTemplate(link) });
  return NextResponse.json({ ok: true });
}
