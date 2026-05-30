"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bumpXpAndStreak } from "../../lessons/[lessonId]/actions";

const schema = z.object({
  quizId: z.string().min(1),
  score: z.number().int().min(0).max(100),
  xpEarned: z.number().int().min(0).max(200),
});

export async function submitQuizAttempt(
  input: z.infer<typeof schema>
): Promise<
  | { ok: true; score: number; xpEarned: number }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "unauthenticated" };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const { quizId, score, xpEarned } = parsed.data;
  const userId = session.user.id;

  // Award XP only if it beats the user's best previous attempt.
  const best = await prisma.quizAttempt.findFirst({
    where: { userId, quizId },
    orderBy: { score: "desc" },
    select: { score: true },
  });
  const earn = !best || score > best.score ? xpEarned : 0;

  await prisma.quizAttempt.create({
    data: { userId, quizId, score, xpEarned: earn },
  });

  if (earn > 0) await bumpXpAndStreak(userId, earn);

  return { ok: true, score, xpEarned: earn };
}
