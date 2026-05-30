"use server";

import { redirect } from "next/navigation";
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

export async function addLessonOrQuizOrDeck(
  moduleId: string,
  kind: "lesson" | "quiz" | "deck"
) {
  await requireAdmin();
  const m = await prisma.module.findUnique({ where: { id: moduleId } });
  if (!m) return;

  if (kind === "lesson") {
    const count = await prisma.lesson.count({ where: { moduleId } });
    const lesson = await prisma.lesson.create({
      data: {
        moduleId,
        title: "Untitled lesson",
        order: count,
        status: "DRAFT",
      },
    });
    revalidatePath(`/admin/courses/${m.courseId}`);
    redirect(`/admin/lessons/${lesson.id}`);
  }

  if (kind === "quiz") {
    const quiz = await prisma.quiz.create({
      data: { moduleId, title: "Untitled quiz", status: "DRAFT" },
    });
    revalidatePath(`/admin/courses/${m.courseId}`);
    redirect(`/admin/quizzes/${quiz.id}`);
  }

  if (kind === "deck") {
    const deck = await prisma.flashcardDeck.create({
      data: { moduleId, title: "Untitled deck", status: "DRAFT" },
    });
    revalidatePath(`/admin/courses/${m.courseId}`);
    redirect(`/admin/decks/${deck.id}`);
  }
}
