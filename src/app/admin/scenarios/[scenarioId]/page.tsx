import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { ScenarioFormDialog } from "../scenario-form";
import { PhrasesEditor } from "./phrases-editor";

export default async function AdminScenarioPage({
  params,
}: {
  params: Promise<{ scenarioId: string }>;
}) {
  const { scenarioId } = await params;
  const session = await auth();
  if (!session?.user) return null;

  const s = await prisma.scenario.findUnique({
    where: { id: scenarioId, tenantId: session.user.tenantId },
    include: { phrases: { orderBy: { order: "asc" } } },
  });
  if (!s) notFound();

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/admin/scenarios">
          <ChevronLeft className="h-4 w-4" />
          All scenarios
        </Link>
      </Button>

      <header className="card overflow-hidden">
        <div
          className="px-6 py-7"
          style={{
            background:
              "linear-gradient(135deg, hsl(var(--accent) / 0.15), hsl(var(--primary) / 0.10))",
          }}
        >
          <div className="flex items-start gap-4">
            <span
              className="grid h-14 w-14 flex-shrink-0 place-items-center rounded-2xl bg-surface text-3xl shadow-soft"
              aria-hidden
            >
              {s.icon ?? "💬"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                {s.level ?? "Scenario"} · {s.status}
              </p>
              <h1 className="mt-1 font-display text-3xl font-bold">{s.title}</h1>
              {s.setting && <p className="mt-1 text-sm text-ink/80">{s.setting}</p>}
            </div>
            <ScenarioFormDialog
              scenario={{
                id: s.id,
                title: s.title,
                description: s.description,
                setting: s.setting,
                aiRolePrompt: s.aiRolePrompt,
                level: s.level,
                icon: s.icon,
                status: s.status,
              }}
            />
          </div>
        </div>
        <div className="border-t border-border bg-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            AI role prompt
          </p>
          <pre className="mt-1.5 whitespace-pre-wrap rounded-xl bg-bg p-3 font-mono text-[0.85rem] text-ink/85">
            {s.aiRolePrompt}
          </pre>
        </div>
      </header>

      <PhrasesEditor
        scenarioId={s.id}
        phrases={s.phrases.map((p) => ({
          id: p.id,
          hebrew: p.hebrew,
          english: p.english,
          transliteration: p.transliteration,
          whenToUse: p.whenToUse,
        }))}
      />
    </div>
  );
}
