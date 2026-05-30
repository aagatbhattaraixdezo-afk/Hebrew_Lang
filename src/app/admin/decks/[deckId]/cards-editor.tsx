"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ConfirmAction } from "@/components/ui/confirm-action";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { saveCard, deleteCard } from "../actions";

type Card = {
  id: string;
  front: string;
  back: string;
  transliteration: string | null;
  exampleHe: string | null;
  exampleNe: string | null;
};

export function CardsEditor({ deckId, cards }: { deckId: string; cards: Card[] }) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold">Cards</h2>
          <p className="text-sm text-muted">
            Front is the Hebrew word, back is its English meaning.
          </p>
        </div>
        <CardDialog deckId={deckId} />
      </div>

      {cards.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-bg/40 p-6 text-center text-sm text-muted">
          No cards yet — add your first card.
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {cards.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3"
            >
              <p className="he flex-shrink-0 text-2xl font-bold text-ink">{c.front}</p>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink truncate">{c.back}</p>
                {c.transliteration && (
                  <p className="font-mono text-xs text-muted truncate">{c.transliteration}</p>
                )}
              </div>
              <CardDialog deckId={deckId} card={c} />
              <DeleteCardBtn id={c.id} front={c.front} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function DeleteCardBtn({ id, front }: { id: string; front: string }) {
  const router = useRouter();
  return (
    <ConfirmAction
      title="Delete this card?"
      description={`Remove "${front}" from this deck.`}
      confirmLabel="Delete"
      trigger={
        <Button variant="ghost" size="icon" aria-label="Delete">
          <Trash2 className="h-3.5 w-3.5 text-danger" />
        </Button>
      }
      onConfirm={async () => {
        await deleteCard(id);
        router.refresh();
      }}
    />
  );
}

function CardDialog({ deckId, card }: { deckId: string; card?: Card }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const res = await saveCard({
        id: card?.id,
        deckId,
        front: String(fd.get("front") ?? ""),
        back: String(fd.get("back") ?? ""),
        transliteration: String(fd.get("transliteration") ?? ""),
        exampleHe: String(fd.get("exampleHe") ?? ""),
        exampleNe: String(fd.get("exampleNe") ?? ""),
      });
      if (!res.ok) {
        setError(res.error ?? "Could not save.");
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {card ? (
          <Button variant="ghost" size="icon" aria-label="Edit card">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Add card
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{card ? "Edit card" : "New card"}</DialogTitle>
          <DialogDescription>
            Hebrew goes on the front, English on the back.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="front">Front (Hebrew)</Label>
              <Input
                id="front"
                name="front"
                required
                defaultValue={card?.front ?? ""}
                className="he mt-1.5 text-xl"
                dir="rtl"
                placeholder="שלום"
              />
            </div>
            <div>
              <Label htmlFor="back">Back (English)</Label>
              <Input
                id="back"
                name="back"
                required
                defaultValue={card?.back ?? ""}
                className="mt-1.5"
                placeholder="hello / peace"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="transliteration">Transliteration (Latin)</Label>
            <Input
              id="transliteration"
              name="transliteration"
              defaultValue={card?.transliteration ?? ""}
              className="mt-1.5 font-mono"
              placeholder="shalom"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="exampleHe">Example (Hebrew)</Label>
              <Textarea
                id="exampleHe"
                name="exampleHe"
                defaultValue={card?.exampleHe ?? ""}
                rows={2}
                className="he mt-1.5"
                dir="rtl"
              />
            </div>
            <div>
              <Label htmlFor="exampleNe">Example (English)</Label>
              <Textarea
                id="exampleNe"
                name="exampleNe"
                defaultValue={card?.exampleNe ?? ""}
                rows={2}
                className="mt-1.5"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={pending}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {card ? "Save changes" : "Add card"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
