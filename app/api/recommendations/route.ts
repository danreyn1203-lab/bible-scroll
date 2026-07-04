import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import { prisma } from "../../../lib/prisma";

// Personalized content suggestions driven by the user's profile.
// Rules (simple, tweakable):
//  - Teens/young adults → catechism + funfact slant
//  - Seekers / non-attenders → introductory content (Gospels, Psalms)
//  - Catholic → catechism + theology bias
//  - Orthodox → history bias
//  - Falls back to a balanced mix
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { age: true, denomination: true, attendsChurch: true, city: true, country: true },
  });
  if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Determine category weights from profile
  const weights: Record<string, number> = { verse: 1, history: 1, theology: 1, catechism: 1, funfact: 1 };
  const reasons: string[] = [];

  if (me.age != null) {
    if (me.age < 20) { weights.funfact += 1.5; weights.catechism += 0.5; reasons.push(`Young readers (you're ${me.age}) get more fun facts to make it stick.`); }
    else if (me.age >= 50) { weights.theology += 1; weights.history += 0.5; reasons.push(`Deeper theology & history for your stage of life.`); }
  }
  if (me.denomination === "Catholic") { weights.catechism += 1.5; reasons.push("Extra catechism for the Catholic tradition."); }
  else if (me.denomination === "Orthodox") { weights.history += 1.5; reasons.push("Church history for the Orthodox tradition."); }
  else if (me.denomination === "Evangelical" || me.denomination === "Protestant") { weights.verse += 1; weights.theology += 0.5; reasons.push("Scripture-first content for your tradition."); }
  else if (me.denomination === "Seeking") { weights.verse += 1; weights.funfact += 1; reasons.push("Gentle on-ramp: verses + fun facts while you explore."); }
  if (me.attendsChurch === false) { weights.verse += 1; reasons.push("Verses + a church-finder nearby (see profile)."); }

  // Fetch a candidate pool and weight by category
  const candidates = await prisma.content.findMany({ take: 400 });
  const scored = candidates.map(c => ({
    ...c,
    score: (weights[c.category as keyof typeof weights] || 1) * (0.7 + Math.random() * 0.3),
  }));
  scored.sort((a, b) => b.score - a.score);

  // Find local groups in the user's city (community connection)
  const localGroups = me.city
    ? await prisma.group.findMany({
        where: { OR: [{ name: { contains: me.city, mode: "insensitive" } }, { description: { contains: me.city, mode: "insensitive" } }] },
        take: 3,
      })
    : [];

  return NextResponse.json({
    recommendations: scored.slice(0, 30).map(c => ({ id: c.id, ref: c.ref, text: c.text, category: c.category })),
    reasons,
    weights,
    localGroups,
  });
}
