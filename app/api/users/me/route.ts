import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "../../../../lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, displayName: true, avatarUrl: true, bio: true, preferredTranslation: true, createdAt: true, role: true, twoFactorEnabled: true, age: true, country: true, city: true, denomination: true, attendsChurch: true },
  });
  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { displayName, avatarUrl, bio, age, country, city, denomination, attendsChurch } = await req.json();

  if (age != null && (typeof age !== "number" || age < 13 || age > 120 || !Number.isInteger(age))) {
    return NextResponse.json({ error: "Age must be a whole number between 13 and 120" }, { status: 400 });
  }
  if (country != null && (typeof country !== "string" || country.length > 60)) {
    return NextResponse.json({ error: "Country too long" }, { status: 400 });
  }
  if (city != null && (typeof city !== "string" || city.length > 80)) {
    return NextResponse.json({ error: "City too long" }, { status: 400 });
  }
  if (denomination != null && (typeof denomination !== "string" || denomination.length > 40)) {
    return NextResponse.json({ error: "Denomination too long" }, { status: 400 });
  }

  if (avatarUrl && typeof avatarUrl === "string" && avatarUrl.length > 800_000) {
    return NextResponse.json({ error: "Image too large (max ~500KB)" }, { status: 413 });
  }
  if (displayName && typeof displayName === "string" && displayName.length > 60) {
    return NextResponse.json({ error: "Display name too long" }, { status: 400 });
  }
  if (bio && typeof bio === "string" && bio.length > 280) {
    return NextResponse.json({ error: "Bio too long (max 280 chars)" }, { status: 400 });
  }

  const data: Record<string, string | number | boolean | null> = {};
  if (displayName !== undefined) data.displayName = displayName?.trim() || null;
  if (avatarUrl !== undefined) data.avatarUrl = avatarUrl || null;
  if (bio !== undefined) data.bio = bio?.trim() || null;
  if (age !== undefined) data.age = age ?? null;
  if (country !== undefined) data.country = country?.trim() || null;
  if (city !== undefined) data.city = city?.trim() || null;
  if (denomination !== undefined) data.denomination = denomination || null;
  if (attendsChurch !== undefined) data.attendsChurch = attendsChurch === true ? true : attendsChurch === false ? false : null;

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: { id: true, displayName: true, avatarUrl: true, bio: true, age: true, country: true, city: true, denomination: true, attendsChurch: true },
  });
  return NextResponse.json(updated);
}
