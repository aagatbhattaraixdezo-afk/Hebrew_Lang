"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bumpXpAndStreak } from "../lessons/[lessonId]/actions";

const schema = z.object({
  mcqId: z.string().min(1),
  correct: z.boolean(),
});

export async function recordMistakeAttempt(
  input: z.infer<typeof schema>
): Promise<{ ok: boolean }> {
  const session = await auth();
  if (!session?.user) return { ok: false };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false };

  const { mcqId, correct } = parsed.data;
  const userId = session.user.id;

  await prisma.mcqAttempt.create({
    data: { userId, mcqId, correct },
  });

  if (correct) {
    // Bonus XP for fixing a previously-missed question.
    await bumpXpAndStreak(userId, 5);
  }

  return { ok: true };
}
