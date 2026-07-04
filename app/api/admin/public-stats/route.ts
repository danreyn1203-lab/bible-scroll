import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

// Public stats endpoint - no auth required, for admin dashboard display
export async function GET() {
  try {
    const [totalUsers, totalPosts, totalComments, activeToday, topDenominations, topCities] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.postComment.count(),
      prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
      prisma.user.groupBy({
        by: ["denomination"],
        where: { denomination: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { denomination: "desc" } },
        take: 5,
      }),
      prisma.user.groupBy({
        by: ["city"],
        where: { city: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { city: "desc" } },
        take: 5,
      }),
    ]);

    // Age stats
    const ages = await prisma.user.findMany({ where: { age: { not: null } }, select: { age: true } });
    const avgAge = ages.length ? Math.round((ages.reduce((sum, u) => sum + (u.age || 0), 0) / ages.length) * 10) / 10 : 0;

    // Church attendance
    const churchYes = await prisma.user.count({ where: { attendsChurch: true } });
    const churchNo = await prisma.user.count({ where: { attendsChurch: false } });

    return NextResponse.json({
      totalUsers,
      totalPosts,
      totalComments,
      activeToday,
      avgAge,
      churchAttendance: { yes: churchYes, no: churchNo },
      topDenominations: topDenominations.map(d => ({ name: d.denomination, count: d._count._all })),
      topCities: topCities.map(c => ({ name: c.city, count: c._count._all })),
    });
  } catch (err) {
    console.error("Stats error:", err);
    return NextResponse.json({
      totalUsers: 0,
      totalPosts: 0,
      totalComments: 0,
      activeToday: 0,
      avgAge: 0,
      churchAttendance: { yes: 0, no: 0 },
      topDenominations: [],
      topCities: [],
    });
  }
}
