import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TopNav } from "@/components/top-nav";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Volume2 } from "lucide-react";
import { ListenRunner } from "./listen-runner";

export default async function ListenDrillPage({
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
  if (deck.cards.length < 4) {
    return (
      <>
        <TopNav />
        <main className="container-tight py-10 text-center">
          <h1 className="font-display text-2xl font-bold">Not enough cards</h1>
          <p className="mt-2 text-sm text-muted">
            Listening drill needs at least 4 cards in the deck. This deck has{" "}
            {deck.cards.length}.
          </p>
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
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
            <Volume2 className="h-3.5 w-3.5" />
            Listening drill
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {deck.title}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Tap the speaker, listen to the Hebrew word, then pick its English meaning.
          </p>
        </header>

        <ListenRunner
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
