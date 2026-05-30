import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProvider, MissingApiKeyError, AiProviderError, type ChatTurn } from "@/lib/ai/provider";

export const runtime = "nodejs";
export const maxDuration = 30;

const requestSchema = z.object({
  scenarioId: z.string().min(1),
  conversationId: z.string().nullish(),
  message: z.string().min(1).max(2000),
});

const MAX_HISTORY = 16; // turns sent to the model (keeps token cost down)

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON body" }, { status: 400 });
  }
  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid input" }, { status: 400 });
  }
  const { scenarioId, message } = parsed.data;

  const scenario = await prisma.scenario.findUnique({
    where: {
      id: scenarioId,
      status: "PUBLISHED",
      tenantId: session.user.tenantId,
    },
    select: { id: true, aiRolePrompt: true },
  });
  if (!scenario) {
    return NextResponse.json({ ok: false, error: "scenario not found" }, { status: 404 });
  }

  // Get or create the conversation
  let conversationId = parsed.data.conversationId ?? null;
  if (conversationId) {
    const existing = await prisma.roleplayConversation.findUnique({
      where: { id: conversationId },
      select: { id: true, userId: true, scenarioId: true },
    });
    if (!existing || existing.userId !== session.user.id || existing.scenarioId !== scenarioId) {
      conversationId = null; // fall through to creating fresh
    }
  }
  if (!conversationId) {
    const created = await prisma.roleplayConversation.create({
      data: { userId: session.user.id, scenarioId },
      select: { id: true },
    });
    conversationId = created.id;
  }

  // Persist the user message immediately
  await prisma.roleplayMessage.create({
    data: { conversationId, role: "user", content: message },
  });

  // Load the recent history (after writing user message)
  const recent = await prisma.roleplayMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: MAX_HISTORY,
    select: { role: true, content: true },
  });
  const history: ChatTurn[] = recent
    .reverse()
    .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));

  const systemPrompt = `${scenario.aiRolePrompt}

Style rules:
- Speak in character.
- Every Hebrew line MUST be followed by its English translation in parentheses on the same line, e.g. "שלום (Hello)".
- Keep replies short (1–3 sentences).
- If the learner says something incorrect, gently model the correct Hebrew.
- Don't break character to lecture about grammar — just naturally model good phrasing.
- Never reveal you are an AI. Stay in role.`;

  let reply: string;
  try {
    const provider = getProvider();
    reply = await provider.chat(systemPrompt, history);
  } catch (e) {
    if (e instanceof MissingApiKeyError) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "AI_API_KEY is not configured. Add a free Gemini key from https://aistudio.google.com/apikey to your .env.",
        },
        { status: 500 }
      );
    }
    if (e instanceof AiProviderError) {
      return NextResponse.json({ ok: false, error: e.message }, { status: 502 });
    }
    return NextResponse.json(
      { ok: false, error: "AI request failed unexpectedly." },
      { status: 502 }
    );
  }

  await prisma.roleplayMessage.create({
    data: { conversationId, role: "assistant", content: reply },
  });

  return NextResponse.json({ ok: true, conversationId, reply });
}
