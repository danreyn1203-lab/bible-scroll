import { NextResponse } from "next/server";
import { sendEmail, isEmailConfigured } from "../../../lib/email";

export async function POST(req: Request) {
  try {
    const { email, subject, message } = await req.json();

    if (!email || !subject || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (!isEmailConfigured()) {
      return NextResponse.json({ error: "Contact form isn't configured yet" }, { status: 503 });
    }

    // Send to admin
    await sendEmail({
      to: "admin@simplymanna.com",
      subject: `Contact: ${subject}`,
      html: `<p><strong>From:</strong> ${email}</p><p><strong>Subject:</strong> ${subject}</p><p><strong>Message:</strong></p><p>${message.replace(/\n/g, "<br>")}</p>`,
    });

    // Send confirmation to user
    await sendEmail({
      to: email,
      subject: "We received your message",
      html: "<p>Thanks for reaching out! We'll get back to you soon.</p><p>— The Simply Manna Team</p>",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact error:", err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
