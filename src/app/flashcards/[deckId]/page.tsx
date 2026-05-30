import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LearnerTopbar from "@/components/LearnerTopbar";
import { DeckDrill } from "./deck-drill";

export const metadata = {
  title: "Flashcard Practice — Shalom",
};

export default async function FlashcardDeckPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = await params;
  const session = await auth();
  if (!session?.user) return null;

  const deck = await prisma.flashcardDeck.findUnique({
    where: { id: deckId, status: "PUBLISHED" },
    include: {
      cards: { orderBy: { id: "asc" } },
      module: { include: { course: { select: { id: true, title: true } } } },
    },
  });
  if (!deck) notFound();

  const states = await prisma.cardState.findMany({
    where: {
      userId: session.user.id,
      cardId: { in: deck.cards.map((c) => c.id) },
    },
  });
  const stateById = new Map(states.map((s) => [s.cardId, s]));

  const now = new Date();
  const cardsWithState = deck.cards.map((c) => {
    const s = stateById.get(c.id);
    return {
      id: c.id,
      front: c.front,
      back: c.back,
      transliteration: c.transliteration,
      exampleHe: c.exampleHe,
      exampleNe: c.exampleNe,
      isNew: !s,
      isDue: !s || s.dueOn <= now,
      ease: s?.ease ?? 2.5,
      intervalDays: s?.intervalDays ?? 0,
      reps: s?.reps ?? 0,
      dueOn: (s?.dueOn ?? now).toISOString(),
    };
  });

  const dueCount = cardsWithState.filter((c) => c.isDue).length;
  const newCount = cardsWithState.filter((c) => c.isNew).length;

  return (
    <div className="min-h-screen bg-paper">
      <LearnerTopbar userName={session.user.name || undefined} isAdmin={session.user.role === "ADMIN"} />
      <main className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16 py-8">
        <DeckDrill
          cards={cardsWithState}
          deckId={deck.id}
          deckTitle={deck.title}
          moduleTitle={deck.module.title}
          dueCount={dueCount}
          newCount={newCount}
        />
      </main>
    </div>
  );
}
