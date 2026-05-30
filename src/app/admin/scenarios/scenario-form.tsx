"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { saveScenario } from "./actions";

type Scenario = {
  id: string;
  title: string;
  description: string | null;
  setting: string | null;
  aiRolePrompt: string;
  level: string | null;
  icon: string | null;
  status: "DRAFT" | "PUBLISHED";
};

export function ScenarioFormDialog({ scenario }: { scenario?: Scenario }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!scenario;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const res = await saveScenario({
        id: scenario?.id,
        title: String(fd.get("title") ?? ""),
        description: String(fd.get("description") ?? ""),
        setting: String(fd.get("setting") ?? ""),
        aiRolePrompt: String(fd.get("aiRolePrompt") ?? ""),
        level: String(fd.get("level") ?? ""),
        icon: String(fd.get("icon") ?? ""),
        status: (fd.get("status") as "DRAFT" | "PUBLISHED") ?? "PUBLISHED",
      });
      if (!res.ok) {
        setError("Could not save — the AI role prompt must be at least 20 characters.");
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="outline" size="sm">
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4" />
            New scenario
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit scenario" : "New scenario"}</DialogTitle>
          <DialogDescription>
            The AI role prompt drives the roleplay chat — describe the character the AI
            should play, the setting, the tone, and any rules.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required defaultValue={scenario?.title ?? ""} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="icon">Icon (emoji)</Label>
              <Input id="icon" name="icon" defaultValue={scenario?.icon ?? "💬"} className="mt-1.5 text-center text-lg" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="level">Level</Label>
              <Input id="level" name="level" defaultValue={scenario?.level ?? "A1"} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={scenario?.status ?? "PUBLISHED"}
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="setting">Setting (1 line, shown to learners)</Label>
            <Input id="setting" name="setting" defaultValue={scenario?.setting ?? ""} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={scenario?.description ?? ""}
              rows={2}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="aiRolePrompt">AI role prompt (drives the chat)</Label>
            <Textarea
              id="aiRolePrompt"
              name="aiRolePrompt"
              required
              defaultValue={scenario?.aiRolePrompt ?? ""}
              rows={6}
              className="mt-1.5 font-mono text-[0.85rem]"
              placeholder={`You are a friendly Israeli pharmacist...\nThe learner is buying medicine.\nReply in short, A2-level Hebrew, with English translations in parentheses.`}
            />
          </div>

          {error && <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={pending}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create scenario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
