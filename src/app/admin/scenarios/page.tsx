import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { ChevronRight, Trash2 } from "lucide-react";
import { ScenarioFormDialog } from "./scenario-form";
import { DeleteScenarioBtn } from "./delete-scenario-btn";

export default async function AdminScenariosPage() {
  const session = await auth();
  if (!session?.user) return null;

  const scenarios = await prisma.scenario.findMany({
    where: { tenantId: session.user.tenantId },
    orderBy: { order: "asc" },
    include: { _count: { select: { phrases: true, conversations: true } } },
  });

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Scenarios</h1>
          <p className="text-sm text-muted">
            Real-world conversation practice — each scenario has phrases and an AI role.
          </p>
        </div>
        <ScenarioFormDialog />
      </header>

      {scenarios.length === 0 ? (
        <div className="card p-10 text-center text-muted">
          No scenarios yet. Use “New scenario” to add the first one.
        </div>
      ) : (
        <div className="card divide-y divide-border">
          {scenarios.map((s) => (
            <div key={s.id} className="flex items-center gap-4 p-4">
              <span
                className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-accent/15 text-2xl"
                aria-hidden
              >
                {s.icon ?? "💬"}
              </span>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/scenarios/${s.id}`}
                  className="font-display text-lg font-semibold hover:underline"
                >
                  {s.title}
                </Link>
                <p className="text-xs text-muted">
                  {s._count.phrases} phrases · {s._count.conversations} conversations ·{" "}
                  {s.status}
                  {s.level && <> · {s.level}</>}
                </p>
              </div>
              <Link
                href={`/admin/scenarios/${s.id}`}
                className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-primary"
              >
                Manage
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
              <ScenarioFormDialog scenario={s} />
              <DeleteScenarioBtn id={s.id} title={s.title} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
