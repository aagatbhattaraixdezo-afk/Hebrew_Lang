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

const deckSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("PUBLISHED"),
});

export async function saveDeckMeta(input: z.infer<typeof deckSchema>) {
  await requireAdmin();
  const parsed = deckSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid" };
  await prisma.flashcardDeck.update({
    where: { id: parsed.data.id },
    data: { title: parsed.data.title, status: parsed.data.status },
  });
  revalidatePath(`/admin/decks/${parsed.data.id}`);
  return { ok: true as const };
}

export async function deleteDeck(id: string) {
  await requireAdmin();
  const d = await prisma.flashcardDeck.findUnique({
    where: { id },
    include: { module: { select: { courseId: true } } },
  });
  if (!d) return;
  await prisma.flashcardDeck.delete({ where: { id } });
  revalidatePath(`/admin/courses/${d.module.courseId}`);
  redirect(`/admin/courses/${d.module.courseId}`);
}

const cardSchema = z.object({
  id: z.string().optional(),
  deckId: z.string().min(1),
  front: z.string().min(1).max(200),
  back: z.string().min(1).max(500),
  transliteration: z.string().max(200).optional().nullable(),
  exampleHe: z.string().max(500).optional().nullable(),
  exampleNe: z.string().max(500).optional().nullable(),
});

export async function saveCard(input: z.infer<typeof cardSchema>) {
  await requireAdmin();
  const parsed = cardSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid" };
  const data = parsed.data;

  if (data.id) {
    await prisma.flashcard.update({
      where: { id: data.id },
      data: {
        front: data.front,
        back: data.back,
        transliteration: data.transliteration || null,
        exampleHe: data.exampleHe || null,
        exampleNe: data.exampleNe || null,
      },
    });
  } else {
    await prisma.flashcard.create({
      data: {
        deckId: data.deckId,
        front: data.front,
        back: data.back,
        transliteration: data.transliteration || null,
        exampleHe: data.exampleHe || null,
        exampleNe: data.exampleNe || null,
      },
    });
  }

  revalidatePath(`/admin/decks/${data.deckId}`);
  return { ok: true as const };
}

export async function deleteCard(id: string) {
  await requireAdmin();
  const c = await prisma.flashcard.findUnique({ where: { id } });
  if (!c) return;
  await prisma.flashcard.delete({ where: { id } });
  revalidatePath(`/admin/decks/${c.deckId}`);
}
