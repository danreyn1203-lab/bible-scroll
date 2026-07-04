import { NextResponse } from "next/server";
import { requireStaff } from "../../../../lib/adminGuard";
import { prisma } from "../../../../lib/prisma";

// Real demographics aggregates for the admin Overview tab.
// All grouped counts ignore nulls so "not specified" doesn't dominate.
export async function GET() {
  const guard = await requireStaff();
  if (!guard.ok) return guard.response;

  const [
    byDenomination,
    byCountry,
    byCity,
    attendanceYes,
    attendanceNo,
    attendanceUnknown,
    ageStats,
    totalProfiled,
  ] = await Promise.all([
    prisma.user.groupBy({ by: ["denomination"], where: { denomination: { not: null } }, _count: { _all: true }, orderBy: { _count: { denomination: "desc" } }, take: 10 }),
    prisma.user.groupBy({ by: ["country"], where: { country: { not: null } }, _count: { _all: true }, orderBy: { _count: { country: "desc" } }, take: 10 }),
    prisma.user.groupBy({ by: ["city"], where: { city: { not: null } }, _count: { _all: true }, orderBy: { _count: { city: "desc" } }, take: 10 }),
    prisma.user.count({ where: { attendsChurch: true } }),
    prisma.user.count({ where: { attendsChurch: false } }),
    prisma.user.count({ where: { attendsChurch: null } }),
    prisma.user.aggregate({ where: { age: { not: null } }, _avg: { age: true }, _min: { age: true }, _max: { age: true }, _count: { age: true } }),
    prisma.user.count({ where: { OR: [{ age: { not: null } }, { city: { not: null } }, { denomination: { not: null } }] } }),
  ]);

  // Bucket ages for a histogram
  const ageBuckets: Record<string, number> = { "13-17": 0, "18-24": 0, "25-34": 0, "35-49": 0, "50-64": 0, "65+": 0 };
  const ageRows = await prisma.user.findMany({ where: { age: { not: null } }, select: { age: true } });
  for (const r of ageRows) {
    const a = r.age!;
    if (a < 18) ageBuckets["13-17"]++;
    else if (a < 25) ageBuckets["18-24"]++;
    else if (a < 35) ageBuckets["25-34"]++;
    else if (a < 50) ageBuckets["35-49"]++;
    else if (a < 65) ageBuckets["50-64"]++;
    else ageBuckets["65+"]++;
  }

  return NextResponse.json({
    totalProfiled,
    age: {
      avg: ageStats._avg.age ? Math.round(ageStats._avg.age * 10) / 10 : null,
      min: ageStats._min.age,
      max: ageStats._max.age,
      count: ageStats._count.age,
      buckets: ageBuckets,
    },
    denomination: byDenomination.map(d => ({ value: d.denomination, count: d._count._all })),
    country: byCountry.map(c => ({ value: c.country, count: c._count._all })),
    city: byCity.map(c => ({ value: c.city, count: c._count._all })),
    churchAttendance: { yes: attendanceYes, no: attendanceNo, unknown: attendanceUnknown },
  });
}
