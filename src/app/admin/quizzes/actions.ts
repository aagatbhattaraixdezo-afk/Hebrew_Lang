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

const quizSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("PUBLISHED"),
});

export async function saveQuizMeta(input: z.infer<typeof quizSchema>) {
  await requireAdmin();
  const parsed = quizSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid" };
  await prisma.quiz.update({
    where: { id: parsed.data.id },
    data: { title: parsed.data.title, status: parsed.data.status },
  });
  revalidatePath(`/admin/quizzes/${parsed.data.id}`);
  return { ok: true as const };
}

export async function deleteQuiz(id: string) {
  await requireAdmin();
  const q = await prisma.quiz.findUnique({
    where: { id },
    include: { module: { select: { courseId: true } } },
  });
  if (!q) return;
  await prisma.quiz.delete({ where: { id } });
  revalidatePath(`/admin/courses/${q.module.courseId}`);
  redirect(`/admin/courses/${q.module.courseId}`);
}

const optionSchema = z.object({
  text: z.string().min(1).max(500),
  isCorrect: z.boolean(),
});
const questionSchema = z.object({
  id: z.string().optional(),
  quizId: z.string().min(1),
  promptNe: z.string().min(1).max(1000),
  hebrewText: z.string().max(200).optional().nullable(),
  explanationNe: z.string().max(2000).optional().nullable(),
  options: z.array(optionSchema).min(2).max(6),
});

export async function saveQuizQuestion(input: z.infer<typeof questionSchema>) {
  await requireAdmin();
  const parsed = questionSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid" };
  const data = parsed.data;
  const correctCount = data.options.filter((o) => o.isCorrect).length;
  if (correctCount !== 1) {
    return { ok: false as const, error: "exactly one option must be marked correct" };
  }

  if (data.id) {
    await prisma.$transaction([
      prisma.quizQuestion.update({
        where: { id: data.id },
        data: {
          promptNe: data.promptNe,
          hebrewText: data.hebrewText || null,
          explanationNe: data.explanationNe || null,
        },
      }),
      prisma.quizOption.deleteMany({ where: { questionId: data.id } }),
      prisma.quizOption.createMany({
        data: data.options.map((o) => ({
          questionId: data.id!,
          text: o.text,
          isCorrect: o.isCorrect,
        })),
      }),
    ]);
  } else {
    const count = await prisma.quizQuestion.count({ where: { quizId: data.quizId } });
    await prisma.quizQuestion.create({
      data: {
        quizId: data.quizId,
        promptNe: data.promptNe,
        hebrewText: data.hebrewText || null,
        explanationNe: data.explanationNe || null,
        order: count,
        options: { create: data.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })) },
      },
    });
  }

  revalidatePath(`/admin/quizzes/${data.quizId}`);
  return { ok: true as const };
}

export async function deleteQuizQuestion(id: string) {
  await requireAdmin();
  const q = await prisma.quizQuestion.findUnique({ where: { id } });
  if (!q) return;
  await prisma.quizQuestion.delete({ where: { id } });
  revalidatePath(`/admin/quizzes/${q.quizId}`);
}
