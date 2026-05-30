import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LearnerTopbar from "@/components/LearnerTopbar";
import { ChevronLeft } from "lucide-react";
import { ChatRunner } from "./chat-runner";

export default async function ChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ scenarioId: string }>;
  searchParams: Promise<{ id?: string }>;
}) {
  const { scenarioId } = await params;
  const sp = await searchParams;
  const session = await auth();
  if (!session?.user) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, role: true },
  });

  if (!user) return null;

  const scenario = await prisma.scenario.findUnique({
    where: { id: scenarioId, status: "PUBLISHED", tenantId: session.user.tenantId },
  });
  if (!scenario) notFound();

  // Resume an existing conversation if ?id=… is in the URL.
  let conversation: { id: string; messages: { id: string; role: string; content: string }[] } | null = null;
  if (sp.id) {
    const existing = await prisma.roleplayConversation.findUnique({
      where: { id: sp.id, userId: session.user.id, scenarioId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (existing) conversation = existing;
  }

  const hasApiKey = !!process.env.AI_API_KEY || !!process.env.GEMINI_API_KEY;

  return (
    <div className="min-h-screen bg-paper">
      <LearnerTopbar userName={user.name} isAdmin={user.role === "ADMIN"} />
      <main className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
        <div>
          <Link
            href={`/scenarios/${scenario.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline mb-2 transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to {scenario.title}
          </Link>
        </div>

        <header className="mb-2">
          <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-accent">
            {scenario.icon ?? "💬"} {scenario.level ?? "Scenario"}
          </p>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-ink">{scenario.title}</h1>
          {scenario.setting && (
            <p className="mt-1 text-sm text-muted">{scenario.setting}</p>
          )}
        </header>

        <ChatRunner
          scenarioId={scenario.id}
          existing={
            conversation
              ? {
                  id: conversation.id,
                  messages: conversation.messages.map((m) => ({
                    id: m.id,
                    role: m.role as "user" | "assistant",
                    content: m.content,
                  })),
                }
              : null
          }
          apiKeyConfigured={hasApiKey}
        />
      </main>
    </div>
  );
}
