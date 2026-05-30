"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scheduleNext, xpForGrade } from "@/lib/srs";
import { bumpXpAndStreak } from "../../lessons/[lessonId]/actions";

const gradeSchema = z.object({
  cardId: z.string().min(1),
  ease: z.number().min(1.3).max(5),
  intervalDays: z.number().int().min(0).max(3650),
  reps: z.number().int().min(0).max(10000),
  grade: z.enum(["again", "hard", "good", "easy"]),
});

export async function gradeCard(
  input: z.infer<typeof gradeSchema>
): Promise<
  | { ok: true; ease: number; intervalDays: number; reps: number; dueOn: string }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "unauthenticated" };
  const parsed = gradeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const { cardId, ease, intervalDays, reps, grade } = parsed.data;
  const userId = session.user.id;

  const card = await prisma.flashcard.findUnique({ where: { id: cardId } });
  if (!card) return { ok: false, error: "card not found" };

  const next = scheduleNext(
    { ease, intervalDays, reps, dueOn: new Date() },
    grade
  );

  await prisma.cardState.upsert({
    where: { userId_cardId: { userId, cardId } },
    create: {
      userId,
      cardId,
      ease: next.ease,
      intervalDays: next.intervalDays,
      reps: next.reps,
      dueOn: next.dueOn,
    },
    update: {
      ease: next.ease,
      intervalDays: next.intervalDays,
      reps: next.reps,
      dueOn: next.dueOn,
    },
  });

  const xp = xpForGrade(grade);
  if (xp > 0) await bumpXpAndStreak(userId, xp);

  return {
    ok: true,
    ease: next.ease,
    intervalDays: next.intervalDays,
    reps: next.reps,
    dueOn: next.dueOn.toISOString(),
  };
}
