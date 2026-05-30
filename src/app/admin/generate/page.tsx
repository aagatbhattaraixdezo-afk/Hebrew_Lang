import { prisma } from "@/lib/prisma";
import { Wand2, AlertTriangle, ExternalLink } from "lucide-react";
import { GenerateForm } from "./generate-form";

export default async function AdminGeneratePage() {
  const courses = await prisma.course.findMany({
    orderBy: { order: "asc" },
    select: { id: true, title: true },
  });

  const hasApiKey = !!process.env.AI_API_KEY;
  const provider = process.env.AI_PROVIDER || "gemini";
  const model = process.env.AI_MODEL || "gemini-2.0-flash";

  return (
    <div className="space-y-5">
      <header>
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-accent">
          <Wand2 className="h-3.5 w-3.5" />
          AI generator
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold">Draft a module from text</h1>
        <p className="mt-1.5 text-sm text-muted max-w-2xl">
          Paste a lesson transcript, your teaching notes, or a topic + vocabulary list.
          The AI returns MCQs, a quiz, and a flashcard deck as a <strong>draft</strong>{" "}
          module under the chosen course — you review and publish from the module editor.
        </p>
        <p className="mt-2 text-xs text-muted">
          Provider: <code className="rounded bg-bg px-1.5 py-0.5">{provider}</code> · Model:{" "}
          <code className="rounded bg-bg px-1.5 py-0.5">{model}</code>
        </p>
      </header>

      {!hasApiKey && (
        <div className="card flex items-start gap-3 border-accent/40 bg-accent/5 p-4">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-accent" />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-ink">
              No <code className="rounded bg-surface px-1.5 py-0.5">AI_API_KEY</code> set.
            </p>
            <p className="mt-1 text-muted">
              Grab a free Gemini key from Google AI Studio and add it to your{" "}
              <code className="rounded bg-surface px-1.5 py-0.5">.env</code> file:{" "}
              <code className="rounded bg-surface px-1.5 py-0.5">AI_API_KEY="..."</code>
            </p>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 font-semibold text-primary"
            >
              Open Google AI Studio
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      )}

      <GenerateForm courses={courses} apiKeyConfigured={hasApiKey} />
    </div>
  );
}
