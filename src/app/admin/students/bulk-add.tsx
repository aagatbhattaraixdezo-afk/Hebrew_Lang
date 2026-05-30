"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { bulkCreateStudents } from "./actions";

export function BulkAddDialog({
  courses,
}: {
  courses: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const csv = String(fd.get("csv") ?? "").trim();
    const courseId = String(fd.get("courseId") ?? "") || undefined;
    setError(null);
    setResult(null);

    const rows = csv
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => !line.toLowerCase().startsWith("name,"))
      .map((line) => {
        const parts = line.split(",").map((p) => p.trim());
        if (parts.length < 3) return null;
        const [name, email, password] = parts;
        if (!name || !email || !password || password.length < 6) return null;
        return { name, email, password };
      })
      .filter((r): r is { name: string; email: string; password: string } => !!r);

    if (rows.length === 0) {
      setError("No valid rows. Each line needs: name,email,password (min 6 chars).");
      return;
    }

    startTransition(async () => {
      const res = await bulkCreateStudents({ rows, courseId });
      if (!res.ok) {
        setError(res.error ?? "Could not import.");
        return;
      }
      setResult({ created: res.created, skipped: res.skipped });
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4" />
          Bulk add
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk add students</DialogTitle>
          <DialogDescription>
            Paste one student per line: <code>name,email,password</code>. The first row
            can be a header (it&apos;s skipped). Existing emails are skipped.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="csv">CSV</Label>
            <Textarea
              id="csv"
              name="csv"
              required
              rows={10}
              className="mt-1.5 font-mono text-[0.85rem]"
              placeholder={"name,email,password\nAarati Sharma,aarati@example.com,password123\nBinod KC,binod@example.com,password123"}
            />
          </div>
          <div>
            <Label htmlFor="courseId">Auto-enrol into (optional)</Label>
            <select
              id="courseId"
              name="courseId"
              className="mt-1.5 h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            >
              <option value="">— Don&apos;t auto-enrol —</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
          )}
          {result && (
            <p className="rounded-xl bg-success/10 px-3 py-2 text-sm text-success">
              <CheckCircle2 className="mr-1.5 inline h-4 w-4" />
              Created {result.created} · skipped {result.skipped} (already existed).
            </p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={pending}>
                Close
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Import
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
