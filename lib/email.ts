import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM || "onboarding@resend.dev";

let client: Resend | null = null;

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

function getClient(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Email not configured. Set RESEND_API_KEY in .env");
  }
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

export async function sendEmail(opts: { to: string; subject: string; html: string }) {
  const c = getClient();
  await c.emails.send({ from: FROM, ...opts });
}

export function resetPasswordTemplate(link: string) {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:20px">
      <h2 style="color:#c9a14a">Reset your Manna password</h2>
      <p>Tap the link below to choose a new password. It expires in 1 hour.</p>
      <p><a href="${link}" style="background:#c9a14a;color:#0b0916;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">Reset password</a></p>
      <p style="color:#888;font-size:13px">If you didn't request this, ignore this email — nothing will change.</p>
    </div>
  `;
}

export function loginCodeTemplate(code: string) {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:20px">
      <h2 style="color:#c9a14a">Your Manna sign-in code</h2>
      <p style="font-size:32px;letter-spacing:6px;font-weight:700;color:#c9a14a;margin:18px 0">${code}</p>
      <p style="color:#888;font-size:13px">Expires in 10 minutes. If you didn't try to sign in, change your password.</p>
    </div>
  `;
}
