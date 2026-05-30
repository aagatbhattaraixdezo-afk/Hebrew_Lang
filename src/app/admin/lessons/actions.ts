"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("forbidden");
  }
  return session.user;
}

const lessonSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  bodyEn: z.string().max(20000).optional().nullable(),
  videoUrl: z.string().url().optional().or(z.literal("")).nullable(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("PUBLISHED"),
});

export async function saveLesson(input: z.infer<typeof lessonSchema>) {
  await requireAdmin();
  const parsed = lessonSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid" };
  const data = parsed.data;
  await prisma.lesson.update({
    where: { id: data.id },
    data: {
      title: data.title,
      bodyEn: data.bodyEn || null,
      videoUrl: data.videoUrl || null,
      status: data.status,
    },
  });
  revalidatePath(`/admin/lessons/${data.id}`);
  return { ok: true as const };
}

export async function deleteLesson(id: string) {
  await requireAdmin();
  const l = await prisma.lesson.findUnique({
    where: { id },
    include: { module: { select: { courseId: true } } },
  });
  if (!l) return;
  await prisma.lesson.delete({ where: { id } });
  revalidatePath(`/admin/courses/${l.module.courseId}`);
  redirect(`/admin/courses/${l.module.courseId}`);
}

// ---------- MCQs ----------

const optionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1).max(500),
  isCorrect: z.boolean(),
});

const mcqSchema = z.object({
  id: z.string().optional(),
  lessonId: z.string().min(1),
  promptNe: z.string().min(1).max(1000),
  hebrewText: z.string().max(200).optional().nullable(),
  explanationNe: z.string().max(2000).optional().nullable(),
  options: z.array(optionSchema).min(2).max(6),
});

export async function saveMcq(input: z.infer<typeof mcqSchema>) {
  await requireAdmin();
  const parsed = mcqSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid" };
  const data = parsed.data;
  const correctCount = data.options.filter((o) => o.isCorrect).length;
  if (correctCount !== 1) {
    return { ok: false as const, error: "exactly one option must be marked correct" };
  }

  if (data.id) {
    // Replace options atomically.
    await prisma.$transaction([
      prisma.mcq.update({
        where: { id: data.id },
        data: {
          promptNe: data.promptNe,
          hebrewText: data.hebrewText || null,
          explanationNe: data.explanationNe || null,
        },
      }),
      prisma.mcqOption.deleteMany({ where: { mcqId: data.id } }),
      prisma.mcqOption.createMany({
        data: data.options.map((o) => ({
          mcqId: data.id!,
          text: o.text,
          isCorrect: o.isCorrect,
        })),
      }),
    ]);
  } else {
    const count = await prisma.mcq.count({ where: { lessonId: data.lessonId } });
    await prisma.mcq.create({
      data: {
        lessonId: data.lessonId,
        promptNe: data.promptNe,
        hebrewText: data.hebrewText || null,
        explanationNe: data.explanationNe || null,
        order: count,
        options: {
          create: data.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
        },
      },
    });
  }

  revalidatePath(`/admin/lessons/${data.lessonId}`);
  return { ok: true as const };
}

export async function deleteMcq(id: string) {
  await requireAdmin();
  const m = await prisma.mcq.findUnique({ where: { id } });
  if (!m) return;
  await prisma.mcq.delete({ where: { id } });
  revalidatePath(`/admin/lessons/${m.lessonId}`);
}
