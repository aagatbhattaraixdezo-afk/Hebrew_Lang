import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LearnerTopbar from "@/components/LearnerTopbar";
import { ChevronRight, MessageSquare, BookOpen } from "lucide-react";

export const metadata = { title: "Real-world scenarios — Shalom" };

export default async function ScenariosPage() {
  const session = await auth();
  if (!session?.user) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, role: true },
  });

  if (!user) return null;

  const scenarios = await prisma.scenario.findMany({
    where: { status: "PUBLISHED", tenantId: session.user.tenantId },
    orderBy: { order: "asc" },
    include: {
      _count: { select: { phrases: true, conversations: { where: { userId: session.user.id } } } },
    },
  });

  return (
    <div className="min-h-screen bg-paper">
      <LearnerTopbar userName={user.name} isAdmin={user.role === "ADMIN"} />
      <main className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16 py-8 flex flex-col gap-8">
        <header className="mb-2">
          <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-accent">
            <MessageSquare className="h-3.5 w-3.5" />
            Practice scenarios
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Real conversations, before you need them
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Each scenario gives you a phrasebook of useful lines — and an AI partner you can
            practice the conversation with, in your own time, as many times as you want.
          </p>
        </header>

        <section className="grid gap-6 sm:grid-cols-2">
          {scenarios.length === 0 && (
            <div className="card-base p-8 text-center text-muted sm:col-span-2">
              No scenarios published yet.
            </div>
          )}
          {scenarios.map((s) => (
            <Link
              key={s.id}
              href={`/scenarios/${s.id}`}
              className="card-base group relative overflow-hidden p-6 hover:-translate-y-0.5 hover:shadow-lift transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <span
                  className="grid h-14 w-14 flex-shrink-0 place-items-center rounded-2xl bg-accent/10 text-3xl"
                  aria-hidden
                >
                  {s.icon ?? "💬"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                    {s.level ?? "Conversation"}
                  </p>
                  <h2 className="mt-1 font-display text-xl font-bold text-ink group-hover:text-primary transition-colors">{s.title}</h2>
                  {s.description && (
                    <p className="mt-1.5 text-sm text-muted line-clamp-2 leading-relaxed">{s.description}</p>
                  )}
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted">
                    <span className="inline-flex items-center gap-1.5 bg-secondary/50 px-2.5 py-1 rounded-lg">
                      <BookOpen className="h-3.5 w-3.5 text-primary" />
                      {s._count.phrases} phrases
                    </span>
                    {s._count.conversations > 0 && (
                      <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary font-semibold px-2.5 py-1 rounded-lg">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {s._count.conversations} conversation
                        {s._count.conversations === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary self-center" />
              </div>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
