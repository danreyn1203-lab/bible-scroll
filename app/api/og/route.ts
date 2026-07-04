// Open Graph image generation for social sharing
// Returns a simple PNG with title/description for Twitter, Facebook, etc.

import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// Placeholder: in production, use a library like `satori` to generate dynamic images
// For now, return a static default OG image
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  // In production, generate a dynamic image based on type + id
  // For now, redirect to a default OG image
  return NextResponse.redirect("/og-manna.png");
}
