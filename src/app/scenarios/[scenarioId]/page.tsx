import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LearnerTopbar from "@/components/LearnerTopbar";
import SpeakButton from "@/components/SpeakButton";
import { ChevronLeft, MessageSquare, Sparkles } from "lucide-react";

export default async function ScenarioPage({
  params,
}: {
  params: Promise<{ scenarioId: string }>;
}) {
  const { scenarioId } = await params;
  const session = await auth();
  if (!session?.user) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, role: true },
  });

  if (!user) return null;

  const scenario = await prisma.scenario.findUnique({
    where: { id: scenarioId, status: "PUBLISHED", tenantId: session.user.tenantId },
    include: {
      phrases: { orderBy: { order: "asc" } },
      conversations: {
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 3,
        include: { _count: { select: { messages: true } } },
      },
    },
  });
  if (!scenario) notFound();

  return (
    <div className="min-h-screen bg-paper">
      <LearnerTopbar userName={user.name} isAdmin={user.role === "ADMIN"} />
      <main className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
        <div>
          <Link
            href="/scenarios"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline mb-2 transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
            All scenarios
          </Link>
        </div>

        <header
          className="card-base overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg, hsl(32 78% 56% / 0.08) 0%, hsl(170 28% 32% / 0.08) 100%)' }}
        >
          <div className="px-6 py-8 sm:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <span
                className="grid h-16 w-16 flex-shrink-0 place-items-center rounded-2xl bg-surface text-3xl shadow-soft border border-border"
                aria-hidden
              >
                {scenario.icon ?? "💬"}
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-accent">
                  {scenario.level ?? "Scenario"}
                </p>
                <h1 className="mt-1 font-display text-3xl font-extrabold text-ink">{scenario.title}</h1>
                {scenario.setting && (
                  <p className="mt-1.5 text-sm text-ink/80 leading-relaxed">{scenario.setting}</p>
                )}
              </div>
            </div>
            <Link
              href={`/scenarios/${scenario.id}/chat`}
              className="btn-primary text-sm h-11 px-5 gap-2 shrink-0 self-start sm:self-center"
            >
              <Sparkles className="h-4 w-4" />
              Start AI roleplay
            </Link>
          </div>
        </header>

        <section className="mt-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">Phrasebook</h2>
            <span className="text-xs font-semibold bg-secondary/50 text-muted px-2.5 py-1 rounded-lg">
              {scenario.phrases.length} phrases
            </span>
          </div>

          <ul className="space-y-4">
            {scenario.phrases.map((p) => (
              <li key={p.id} className="card-base p-5 hover:shadow-soft transition-all bg-surface">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p
                      className="he text-2xl font-bold text-ink leading-loose"
                      style={{ direction: "rtl", fontFamily: "var(--font-he)" }}
                    >
                      {p.hebrew}
                    </p>
                    {p.transliteration && (
                      <p className="mt-1 font-mono text-xs text-muted font-medium bg-secondary/35 inline-block px-1.5 py-0.5 rounded">
                        {p.transliteration}
                      </p>
                    )}
                    <p className="mt-2 text-ink/90 text-sm font-medium">{p.english}</p>
                    {p.whenToUse && (
                      <p className="mt-2.5 text-xs italic text-muted">— {p.whenToUse}</p>
                    )}
                  </div>
                  <div className="shrink-0 self-center">
                    <SpeakButton text={p.hebrew} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {scenario.conversations.length > 0 && (
          <section className="mt-6 border-t border-border pt-6">
            <h2 className="mb-4 text-lg font-bold text-ink">Your past conversations</h2>
            <ul className="space-y-3">
              {scenario.conversations.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/scenarios/${scenario.id}/chat?id=${c.id}`}
                    className="card-base flex items-center justify-between p-4 hover:-translate-y-0.5 hover:shadow-lift transition-all duration-300 bg-surface group"
                  >
                    <div>
                      <p className="font-semibold text-ink text-sm">
                        {new Date(c.createdAt).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted mt-1">
                        {c._count.messages} message{c._count.messages === 1 ? "" : "s"}
                      </p>
                    </div>
                    <MessageSquare className="h-4 w-4 text-muted group-hover:text-primary transition-colors" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
