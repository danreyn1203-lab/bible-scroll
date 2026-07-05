import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, subject, message } = await req.json();

    if (!email || !subject || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Send to admin
    await resend.emails.send({
      from: "noreply@simplymanna.com",
      to: "admin@simplymanna.com",
      subject: `Contact: ${subject}`,
      html: `<p><strong>From:</strong> ${email}</p><p><strong>Subject:</strong> ${subject}</p><p><strong>Message:</strong></p><p>${message.replace(/\n/g, "<br>")}</p>`,
    });

    // Send confirmation to user
    await resend.emails.send({
      from: "noreply@simplymanna.com",
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
