// First step of login when 2FA is enabled: verify password, generate a 6-digit
// code, email it, and return { twoFactor: true }. The client then submits
// email+password+code to NextAuth credentials in step 2.
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createHash, randomInt } from "crypto";
import { prisma } from "../../../../lib/prisma";
import { sendEmail, loginCodeTemplate, isEmailConfigured } from "../../../../lib/email";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "email and password required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  if (!user.twoFactorEnabled) {
    return NextResponse.json({ twoFactor: false });
  }

  if (!isEmailConfigured()) {
    return NextResponse.json({ error: "2FA requires email. Set RESEND_API_KEY in .env" }, { status: 503 });
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const codeHash = createHash("sha256").update(code).digest("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.loginCode.create({ data: { userId: user.id, codeHash, expiresAt } });
  await sendEmail({ to: user.email, subject: "Your Simply Manna sign-in code", html: loginCodeTemplate(code) });

  return NextResponse.json({ twoFactor: true });
}
