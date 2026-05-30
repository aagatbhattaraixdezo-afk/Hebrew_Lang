"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { bumpXpAndStreak } from "../../../lessons/[lessonId]/actions";

const schema = z.object({
  xpEarned: z.number().int().min(0).max(200),
});

export async function awardDrillXp(
  input: z.infer<typeof schema>
): Promise<{ ok: boolean }> {
  const session = await auth();
  if (!session?.user) return { ok: false };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false };
  if (parsed.data.xpEarned > 0) {
    await bumpXpAndStreak(session.user.id, parsed.data.xpEarned);
  }
  return { ok: true };
}
