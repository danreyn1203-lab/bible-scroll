// Server-authoritative streak logic — the same "engagement, not just opening
// the app" philosophy as Manna's retention.js, but computed from real
// per-user data (UserLike/UserSave timestamps) instead of localStorage.

import { prisma } from "./prisma";

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD, UTC calendar day
}

export async function getStreak(userId: string) {
  const [likes, saves] = await Promise.all([
    prisma.userLike.findMany({ where: { userId }, select: { createdAt: true } }),
    prisma.userSave.findMany({ where: { userId }, select: { createdAt: true } }),
  ]);

  const engagedDays = new Set(
    [...likes, ...saves].map(e => dayKey(e.createdAt))
  );

  if (engagedDays.size === 0) {
    return { current: 0, longest: 0, totalDaysEngaged: 0 };
  }

  const sortedDays = Array.from(engagedDays).sort(); // ascending YYYY-MM-DD strings sort correctly

  let longest = 1;
  let run = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(sortedDays[i - 1]);
    const curr = new Date(sortedDays[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    run = diffDays === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  // current streak: walk backward from today/yesterday
  const today = dayKey(new Date());
  const yesterday = dayKey(new Date(Date.now() - 86400000));
  let current = 0;
  if (engagedDays.has(today) || engagedDays.has(yesterday)) {
    let cursor = engagedDays.has(today) ? new Date() : new Date(Date.now() - 86400000);
    while (engagedDays.has(dayKey(cursor))) {
      current++;
      cursor = new Date(cursor.getTime() - 86400000);
    }
  }

  return { current, longest, totalDaysEngaged: engagedDays.size };
}
