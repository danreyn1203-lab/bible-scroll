import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import { getStreak } from "../../../lib/streak";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  return NextResponse.json(await getStreak(session.user.id));
}
