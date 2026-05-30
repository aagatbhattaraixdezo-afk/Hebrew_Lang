import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProvider, MissingApiKeyError, AiProviderError } from "@/lib/ai/provider";
import { buildPrompt } from "@/lib/ai/prompt";
import { aiResponseSchema } from "@/lib/ai/schemas";

export const runtime = "nodejs";
export const maxDuration = 60;

const requestSchema = z.object({
  courseId: z.string().min(1),
  moduleTitle: z.string().min(1).max(200),
  sourceText: z.string().min(50).max(20000),
  videoUrl: z
    .string()
    .url()
    .optional()
    .or(z.literal(""))
    .transform((v) => v || null),
  mcqCount: z.coerce.number().int().min(1).max(15).default(5),
  quizQuestionCount: z.coerce.number().int().min(1).max(15).default(5),
  flashcardCount: z.coerce.number().int().min(1).max(30).default(10),
  level: z.enum(["A1", "A2"]).default("A1"),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON body" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const input = parsed.data;

  // Verify the course exists and belongs to this admin's tenant.
  const course = await prisma.course.findUnique({
    where: { id: input.courseId },
    select: { id: true, tenantId: true },
  });
  if (!course || course.tenantId !== session.user.tenantId) {
    return NextResponse.json({ ok: false, error: "course not found" }, { status: 404 });
  }

  // Run the AI with one retry on malformed JSON.
  let aiText: string;
  let aiData: unknown;
  const provider = (() => {
    try {
      return getProvider();
    } catch (e) {
      return null;
    }
  })();
  if (!provider) {
    return NextResponse.json(
      { ok: false, error: "AI provider unavailable. Check AI_PROVIDER env var." },
      { status: 500 }
    );
  }

  const { systemPrompt, userPrompt } = buildPrompt(input);

  async function callOnce(extraReminder?: string) {
    const sp = extraReminder ? `${systemPrompt}\n\n${extraReminder}` : systemPrompt;
    return provider!.generateJSON(sp, userPrompt);
  }

  try {
    aiText = await callOnce();
    aiData = JSON.parse(aiText);
  } catch (e) {
    if (e instanceof MissingApiKeyError) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "AI_API_KEY is not configured. Get a free Gemini key from https://aistudio.google.com/apikey and set it in your .env.",
        },
        { status: 500 }
      );
    }
    if (e instanceof AiProviderError) {
      return NextResponse.json({ ok: false, error: e.message }, { status: 502 });
    }
    // Retry once with reminder if JSON parsing failed.
    try {
      aiText = await callOnce(
        "REMINDER: Your previous response was not valid JSON. Respond with ONLY a single JSON object matching the schema. No markdown, no fences, no commentary."
      );
      aiData = JSON.parse(aiText);
    } catch (e2) {
      const msg =
        e2 instanceof AiProviderError
          ? e2.message
          : "AI returned a response that wasn't valid JSON. Try a shorter or clearer source text.";
      return NextResponse.json({ ok: false, error: msg }, { status: 502 });
    }
  }

  const validated = aiResponseSchema.safeParse(aiData);
  if (!validated.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "AI output didn't match the required schema (expected 4 options per question, exactly one correct, etc.).",
        details: validated.error.flatten(),
      },
      { status: 502 }
    );
  }
  const data = validated.data;

  // Persist everything as DRAFT.
  const moduleCount = await prisma.module.count({ where: { courseId: input.courseId } });

  const mod = await prisma.module.create({
    data: {
      courseId: input.courseId,
      title: data.moduleTitle || input.moduleTitle,
      description: data.moduleDescription || null,
      aiSourceText: input.sourceText,
      status: "DRAFT",
      order: moduleCount,
    },
  });

  await prisma.lesson.create({
    data: {
      moduleId: mod.id,
      title: data.moduleTitle || input.moduleTitle,
      bodyEn: input.sourceText,
      videoUrl: input.videoUrl,
      status: "DRAFT",
      order: 0,
      mcqs: {
        create: data.mcqs.map((m, i) => ({
          promptNe: m.promptNe,
          hebrewText: m.hebrewText,
          explanationNe: m.explanationNe,
          order: i,
          options: {
            create: m.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
          },
        })),
      },
    },
  });

  await prisma.quiz.create({
    data: {
      moduleId: mod.id,
      title: data.quiz.title,
      status: "DRAFT",
      questions: {
        create: data.quiz.questions.map((q, i) => ({
          promptNe: q.promptNe,
          hebrewText: q.hebrewText,
          explanationNe: q.explanationNe,
          order: i,
          options: {
            create: q.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
          },
        })),
      },
    },
  });

  await prisma.flashcardDeck.create({
    data: {
      moduleId: mod.id,
      title: `${data.moduleTitle || input.moduleTitle} — Flashcards`,
      status: "DRAFT",
      cards: {
        create: data.flashcards.map((f) => ({
          front: f.front,
          back: f.back,
          transliteration: f.transliteration || null,
          exampleHe: f.exampleHe,
          exampleNe: f.exampleNe,
        })),
      },
    },
  });

  return NextResponse.json({
    ok: true,
    courseId: input.courseId,
    moduleId: mod.id,
    stats: {
      mcqs: data.mcqs.length,
      quizQuestions: data.quiz.questions.length,
      flashcards: data.flashcards.length,
    },
  });
}
