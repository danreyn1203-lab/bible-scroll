import { auth } from "../../auth";
import { prisma } from "../../lib/prisma";
import { logoutAction } from "../actions";

export default async function Home() {
  const session = await auth();

  const items = await prisma.content.findMany({
    take: 8,
    include: { entityLinks: { include: { entity: true } } },
    orderBy: { id: "asc" },
  });

  const userLikes = session?.user?.id
    ? new Set((await prisma.userLike.findMany({ where: { userId: session.user.id } })).map(l => l.contentId))
    : new Set<string>();

  return (
    <main className="flex flex-1 flex-col items-center py-12 px-6 bg-zinc-50">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">bible-scroll — Phase 1 feed</h1>
          {session?.user ? (
            <div className="flex items-center gap-3 text-sm">
              <span>Hi, {session.user.name || session.user.email}</span>
              <form action={logoutAction}>
                <button type="submit" className="underline">Log out</button>
              </form>
            </div>
          ) : (
            <div className="flex gap-3 text-sm">
              <a href="/login" className="underline">Log in</a>
              <a href="/signup" className="underline">Sign up</a>
            </div>
          )}
        </header>

        <p className="text-sm text-zinc-600">
          Reading straight from Postgres via Prisma — {items.length} of 77 content items shown.
          {session?.user ? " Liked items below reflect your account, not a browser's localStorage." : " Log in to see personal likes."}
        </p>

        <div className="flex flex-col gap-4">
          {items.map(item => (
            <article key={item.id} className="bg-white border rounded-xl p-4 shadow-sm">
              <div className="text-xs uppercase tracking-wide text-zinc-500 mb-1">
                {item.category} {userLikes.has(item.id) && <span className="text-red-500">♥ liked</span>}
              </div>
              <div
                className="text-base mb-2"
                dangerouslySetInnerHTML={{ __html: item.text }}
              />
              {item.answer && <div className="text-sm text-zinc-600 italic mb-2">Answer: {item.answer}</div>}
              <div className="text-xs text-zinc-500 mb-2">{item.ref}</div>
              <div className="flex gap-1 flex-wrap">
                {item.entityLinks.map(l => (
                  <span key={l.entityId} className="text-xs bg-zinc-100 rounded-full px-2 py-0.5">
                    {l.entity.label}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
