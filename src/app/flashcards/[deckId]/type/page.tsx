import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TopNav } from "@/components/top-nav";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Keyboard } from "lucide-react";
import { TypeRunner } from "./type-runner";

export default async function TypeDrillPage({
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
  if (deck.cards.length === 0) {
    return (
      <>
        <TopNav />
        <main className="container-tight py-10 text-center">
          <h1 className="font-display text-2xl font-bold">No cards in this deck</h1>
          <Button asChild className="mt-5">
            <Link href={`/flashcards/${deck.id}`}>Back to deck</Link>
          </Button>
        </main>
      </>
    );
  }

  return (
    <>
      <TopNav />
      <main className="container-tight py-6 sm:py-10">
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
          <Link href={`/flashcards/${deck.id}`}>
            <ChevronLeft className="h-4 w-4" />
            {deck.title}
          </Link>
        </Button>

        <header className="mb-6">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-accent">
            <Keyboard className="h-3.5 w-3.5" />
            Typing drill
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {deck.title}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Read the English, type the Hebrew. Vowel marks (nikud) are optional — we match
            leniently.
          </p>
        </header>

        <TypeRunner
          cards={deck.cards.map((c) => ({
            id: c.id,
            front: c.front,
            back: c.back,
            transliteration: c.transliteration,
          }))}
        />
      </main>
    </>
  );
}
