import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { DeckForm } from "./deck-form";
import { CardsEditor } from "./cards-editor";

export default async function AdminDeckPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = await params;
  const deck = await prisma.flashcardDeck.findUnique({
    where: { id: deckId },
    include: {
      module: { include: { course: { select: { id: true, title: true } } } },
      cards: { orderBy: { id: "asc" } },
    },
  });
  if (!deck) notFound();

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href={`/admin/courses/${deck.module.course.id}`}>
          <ChevronLeft className="h-4 w-4" />
          {deck.module.course.title}
        </Link>
      </Button>

      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          {deck.module.title} · Flashcard deck
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold">{deck.title}</h1>
      </header>

      <DeckForm deck={{ id: deck.id, title: deck.title, status: deck.status }} />

      <CardsEditor
        deckId={deck.id}
        cards={deck.cards.map((c) => ({
          id: c.id,
          front: c.front,
          back: c.back,
          transliteration: c.transliteration,
          exampleHe: c.exampleHe,
          exampleNe: c.exampleNe,
        }))}
      />
    </div>
  );
}
