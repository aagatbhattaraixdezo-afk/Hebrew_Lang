"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("forbidden");
  }
  return session.user;
}

const scenarioSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  setting: z.string().max(500).optional().nullable(),
  aiRolePrompt: z.string().min(20).max(4000),
  level: z.string().max(40).optional().nullable(),
  icon: z.string().max(20).optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("PUBLISHED"),
});

export async function saveScenario(input: z.infer<typeof scenarioSchema>) {
  const user = await requireAdmin();
  const parsed = scenarioSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid" };
  const data = parsed.data;

  if (data.id) {
    await prisma.scenario.update({
      where: { id: data.id },
      data: {
        title: data.title,
        description: data.description || null,
        setting: data.setting || null,
        aiRolePrompt: data.aiRolePrompt,
        level: data.level || null,
        icon: data.icon || null,
        status: data.status,
      },
    });
  } else {
    const count = await prisma.scenario.count({ where: { tenantId: user.tenantId } });
    await prisma.scenario.create({
      data: {
        tenantId: user.tenantId,
        title: data.title,
        description: data.description || null,
        setting: data.setting || null,
        aiRolePrompt: data.aiRolePrompt,
        level: data.level || null,
        icon: data.icon || null,
        status: data.status,
        order: count,
      },
    });
  }
  revalidatePath("/admin/scenarios");
  return { ok: true as const };
}

export async function deleteScenario(id: string) {
  await requireAdmin();
  await prisma.scenario.delete({ where: { id } });
  revalidatePath("/admin/scenarios");
}

const phraseSchema = z.object({
  id: z.string().optional(),
  scenarioId: z.string().min(1),
  hebrew: z.string().min(1).max(200),
  english: z.string().min(1).max(500),
  transliteration: z.string().max(200).optional().nullable(),
  whenToUse: z.string().max(500).optional().nullable(),
});

export async function savePhrase(input: z.infer<typeof phraseSchema>) {
  await requireAdmin();
  const parsed = phraseSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid" };
  const data = parsed.data;
  if (data.id) {
    await prisma.phrase.update({
      where: { id: data.id },
      data: {
        hebrew: data.hebrew,
        english: data.english,
        transliteration: data.transliteration || null,
        whenToUse: data.whenToUse || null,
      },
    });
  } else {
    const count = await prisma.phrase.count({ where: { scenarioId: data.scenarioId } });
    await prisma.phrase.create({
      data: {
        scenarioId: data.scenarioId,
        hebrew: data.hebrew,
        english: data.english,
        transliteration: data.transliteration || null,
        whenToUse: data.whenToUse || null,
        order: count,
      },
    });
  }
  revalidatePath(`/admin/scenarios/${data.scenarioId}`);
  return { ok: true as const };
}

export async function deletePhrase(id: string) {
  await requireAdmin();
  const p = await prisma.phrase.findUnique({ where: { id } });
  if (!p) return;
  await prisma.phrase.delete({ where: { id } });
  revalidatePath(`/admin/scenarios/${p.scenarioId}`);
}
