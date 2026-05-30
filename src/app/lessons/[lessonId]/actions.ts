"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const attemptSchema = z.object({
  mcqId: z.string().min(1),
  correct: z.boolean(),
});

const completeSchema = z.object({
  lessonId: z.string().min(1),
  score: z.number().int().min(0).max(100),
  xpEarned: z.number().int().min(0).max(500),
  attempts: z.array(attemptSchema).max(50).optional(),
});

export async function completeLesson(input: z.infer<typeof completeSchema>) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, error: "unauthenticated" };
  const parsed = completeSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid" };

  const { lessonId, score, xpEarned, attempts } = parsed.data;
  const userId = session.user.id;

  // Record per-question attempts (powers mistakes queue + analytics).
  if (attempts && attempts.length > 0) {
    await prisma.mcqAttempt.createMany({
      data: attempts.map((a) => ({
        userId,
        mcqId: a.mcqId,
        correct: a.correct,
      })),
    });
  }

  const existing = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
  });
  const alreadyCompleted = !!existing?.completed;

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: {
      userId,
      lessonId,
      completed: true,
      score,
      xpEarned,
    },
    update: alreadyCompleted
      ? { score: Math.max(existing!.score ?? 0, score) }
      : { completed: true, score, xpEarned },
  });

  if (!alreadyCompleted) {
    await bumpXpAndStreak(userId, xpEarned);
  }

  return { ok: true as const };
}

// Shared helper used by lesson + quiz + flashcard finish flows.
export async function bumpXpAndStreak(userId: string, xpEarned: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastActiveOn: true, streakCount: true },
  });
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let nextStreak = user?.streakCount ?? 0;
  if (user?.lastActiveOn) {
    const last = new Date(user.lastActiveOn);
    const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
    const diffDays = Math.round((today.getTime() - lastDay.getTime()) / 86_400_000);
    if (diffDays === 0) nextStreak = user.streakCount;
    else if (diffDays === 1) nextStreak = user.streakCount + 1;
    else nextStreak = 1;
  } else {
    nextStreak = 1;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      xp: xpEarned > 0 ? { increment: xpEarned } : undefined,
      streakCount: nextStreak,
      lastActiveOn: now,
    },
  });
}
