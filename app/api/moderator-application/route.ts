import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import { prisma } from "../../../lib/prisma";
import { checkText } from "../../../lib/moderation";
import { sendEmail, isEmailConfigured } from "../../../lib/email";

// Public form: anyone can apply to become a moderator.
// Notifies admins by email and stores the application for review.
export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id || null;

  const body = await req.json();
  const { name, email, age, experience, whyJoin, references } = body;

  if (!name || !email || !experience || !whyJoin) {
    return NextResponse.json({ error: "name, email, experience, and whyJoin are required" }, { status: 400 });
  }
  if (typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }
  if (age != null && (typeof age !== "number" || age < 13 || age > 120)) {
    return NextResponse.json({ error: "Age must be 13+" }, { status: 400 });
  }

  // Moderate free-text fields to keep spam/abuse out of admin inbox
  for (const field of [experience, whyJoin, references].filter(Boolean)) {
    const mod = await checkText(field);
    if (!mod.allowed) {
      return NextResponse.json({ error: "Application didn't pass moderation", reason: mod.reason }, { status: 422 });
    }
  }

  const app = await prisma.moderatorApplication.create({
    data: {
      userId,
      name: name.slice(0, 100),
      email: email.toLowerCase().slice(0, 200),
      age: age ?? null,
      experience: experience.slice(0, 2000),
      whyJoin: whyJoin.slice(0, 2000),
      references: references?.slice(0, 1000) || null,
    },
  });

  // Notify all admins
  if (isEmailConfigured()) {
    const admins = await prisma.user.findMany({ where: { role: "admin" }, select: { email: true } });
    const adminUrl = `${process.env.APP_URL || "http://localhost:8943"}/admin.html#applications`;
    const html = `
      <h2>New moderator application</h2>
      <p><b>${escapeHtml(name)}</b> (${escapeHtml(email)}) wants to help moderate Taste Manna.</p>
      <p><b>Experience:</b><br/>${escapeHtml(experience).slice(0, 500)}…</p>
      <p><b>Why they want to join:</b><br/>${escapeHtml(whyJoin).slice(0, 500)}…</p>
      <p><a href="${adminUrl}">Review in admin dashboard</a></p>
    `;
    await Promise.all(
      admins.map(a => sendEmail({ to: a.email, subject: "New moderator application — Taste Manna", html }).catch(() => null))
    );
  }

  return NextResponse.json({ id: app.id, status: "received" }, { status: 201 });
}

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
