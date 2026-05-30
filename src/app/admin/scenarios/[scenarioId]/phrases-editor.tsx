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
import { savePhrase, deletePhrase } from "../actions";

type Phrase = {
  id: string;
  hebrew: string;
  english: string;
  transliteration: string | null;
  whenToUse: string | null;
};

export function PhrasesEditor({
  scenarioId,
  phrases,
}: {
  scenarioId: string;
  phrases: Phrase[];
}) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">Phrasebook</h2>
        <PhraseDialog scenarioId={scenarioId} />
      </div>

      {phrases.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-bg/40 p-6 text-center text-sm text-muted">
          No phrases yet — add the first one.
        </p>
      ) : (
        <ul className="space-y-2">
          {phrases.map((p) => (
            <li
              key={p.id}
              className="flex items-start gap-3 rounded-xl border border-border bg-surface p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="he text-xl font-bold text-ink" style={{ direction: "rtl" }}>
                  {p.hebrew}
                </p>
                <p className="text-sm text-ink/85">{p.english}</p>
                {p.transliteration && (
                  <p className="font-mono text-xs text-muted">{p.transliteration}</p>
                )}
                {p.whenToUse && (
                  <p className="mt-1 text-xs italic text-muted">— {p.whenToUse}</p>
                )}
              </div>
              <PhraseDialog scenarioId={scenarioId} phrase={p} />
              <DeletePhraseBtn id={p.id} hebrew={p.hebrew} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function DeletePhraseBtn({ id, hebrew }: { id: string; hebrew: string }) {
  const router = useRouter();
  return (
    <ConfirmAction
      title="Delete this phrase?"
      description={`Remove "${hebrew}" from the phrasebook.`}
      confirmLabel="Delete"
      trigger={
        <Button variant="ghost" size="icon" aria-label="Delete">
          <Trash2 className="h-3.5 w-3.5 text-danger" />
        </Button>
      }
      onConfirm={async () => {
        await deletePhrase(id);
        router.refresh();
      }}
    />
  );
}

function PhraseDialog({
  scenarioId,
  phrase,
}: {
  scenarioId: string;
  phrase?: Phrase;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const res = await savePhrase({
        id: phrase?.id,
        scenarioId,
        hebrew: String(fd.get("hebrew") ?? ""),
        english: String(fd.get("english") ?? ""),
        transliteration: String(fd.get("transliteration") ?? ""),
        whenToUse: String(fd.get("whenToUse") ?? ""),
      });
      if (!res.ok) {
        setError("Could not save.");
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {phrase ? (
          <Button variant="ghost" size="icon" aria-label="Edit phrase">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Add phrase
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{phrase ? "Edit phrase" : "New phrase"}</DialogTitle>
          <DialogDescription>
            Hebrew on top, English meaning below, transliteration optional but recommended.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="hebrew">Hebrew</Label>
            <Input
              id="hebrew"
              name="hebrew"
              required
              defaultValue={phrase?.hebrew ?? ""}
              className="he mt-1.5 text-xl"
              dir="rtl"
              placeholder="?כמה זה עולה"
            />
          </div>
          <div>
            <Label htmlFor="english">English</Label>
            <Input
              id="english"
              name="english"
              required
              defaultValue={phrase?.english ?? ""}
              className="mt-1.5"
              placeholder="How much does it cost?"
            />
          </div>
          <div>
            <Label htmlFor="transliteration">Transliteration</Label>
            <Input
              id="transliteration"
              name="transliteration"
              defaultValue={phrase?.transliteration ?? ""}
              className="mt-1.5 font-mono"
              placeholder="kama ze oleh?"
            />
          </div>
          <div>
            <Label htmlFor="whenToUse">When to use (1 line)</Label>
            <Textarea
              id="whenToUse"
              name="whenToUse"
              defaultValue={phrase?.whenToUse ?? ""}
              rows={2}
              className="mt-1.5"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={pending}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {phrase ? "Save changes" : "Add phrase"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
