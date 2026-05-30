"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Send, Loader2, AlertTriangle, Sparkles } from "lucide-react";
import SpeakButton from "@/components/SpeakButton";
import { cn } from "@/lib/utils";

type Msg = { id?: string; role: "user" | "assistant"; content: string };

export function ChatRunner({
  scenarioId,
  existing,
  apiKeyConfigured,
}: {
  scenarioId: string;
  existing: { id: string; messages: Msg[] } | null;
  apiKeyConfigured: boolean;
}) {
  const [conversationId, setConversationId] = useState<string | null>(existing?.id ?? null);
  const [messages, setMessages] = useState<Msg[]>(existing?.messages ?? []);
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function send() {
    const text = input.trim();
    if (!text || pending) return;
    setError(null);
    // Optimistic user message
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");

    startTransition(async () => {
      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scenarioId, conversationId, message: text }),
        });
        const data = await res.json();
        if (!data.ok) {
          setError(data.error ?? "Could not reach the AI.");
          // Roll back the optimistic message
          setMessages((prev) => prev.slice(0, -1));
          setInput(text);
          return;
        }
        if (data.conversationId && !conversationId) setConversationId(data.conversationId);
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } catch (e) {
        setError("Network error.");
        setMessages((prev) => prev.slice(0, -1));
        setInput(text);
      }
    });
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="card-base flex flex-col bg-surface shadow-soft border border-border/80" style={{ minHeight: "65vh" }}>
      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto px-4 py-6 sm:px-6"
        style={{ maxHeight: "55vh" }}
      >
        {messages.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/85 bg-paper/40 p-6 text-center text-sm text-muted">
            <Sparkles className="mx-auto mb-2 h-5 w-5 text-accent" />
            Say something to start the conversation. The AI will reply in Hebrew with an
            English translation in parentheses.
          </div>
        )}
        {messages.map((m, i) => (
          <Bubble key={m.id ?? `${i}-${m.role}`} message={m} />
        ))}
        {pending && (
          <div className="flex items-center gap-2.5 text-sm text-muted bg-secondary/35 px-4 py-2.5 rounded-2xl w-fit">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Thinking…
          </div>
        )}
      </div>

      {!apiKeyConfigured && (
        <div className="flex items-start gap-2 border-t border-border/80 bg-accent/5 px-4 py-3.5 text-sm text-accent-foreground sm:px-6">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent animate-pulse" />
          <span className="text-ink/85 text-xs font-semibold">
            <code className="rounded bg-surface px-1.5 py-0.5">AI_API_KEY</code> isn&apos;t
            set — chat replies won&apos;t work. Grab a free Gemini key from Google AI Studio
            and add it to your <code>.env</code>.
          </span>
        </div>
      )}

      {error && (
        <div className="border-t border-border/80 bg-danger/10 px-4 py-3 text-sm text-danger font-semibold sm:px-6">
          {error}
        </div>
      )}

      <div className="flex items-end gap-2 border-t border-border/80 p-3 sm:p-4 bg-paper/40">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
          placeholder="Type your reply… (Enter to send, Shift+Enter for newline)"
          className="input-base min-h-[44px] max-h-32 resize-none py-2.5 flex-1"
          disabled={pending || !apiKeyConfigured}
        />
        <button
          onClick={send}
          className="btn-primary p-0 flex items-center justify-center shrink-0 w-11 h-11"
          aria-label="Send"
          disabled={!input.trim() || pending || !apiKeyConfigured}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

function Bubble({ message }: { message: Msg }) {
  const isUser = message.role === "user";
  // Parse assistant content for Hebrew text — convention from prompt:
  // each line is "<hebrew> (<english translation>)". Pull the Hebrew part out
  // to make a Listen button work without TTS-reading the English parens.
  const hebrewParts: string[] = [];
  if (!isUser) {
    const re = /[֐-׿][֐-׿\s'"".,!?]+/g;
    const matches = message.content.match(re);
    if (matches) hebrewParts.push(...matches.map((s) => s.trim()).filter(Boolean));
  }

  return (
    <div className={cn("flex items-end gap-2.5", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <span
          className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-xl bg-accent/15 font-display text-sm font-bold text-accent border border-accent/20"
          aria-hidden
        >
          ש
        </span>
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-white shadow-soft"
            : "card-base bg-surface text-ink px-4 py-3"
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {hebrewParts.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border/50 pt-2.5">
            {hebrewParts.slice(0, 3).map((he, i) => (
              <SpeakButton key={i} text={he} size={14} />
            ))}
          </div>
        )}
      </div>
      {isUser && (
        <span
          className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-xl bg-secondary/80 font-display text-[10px] font-bold text-muted border border-border"
          aria-hidden
        >
          YOU
        </span>
      )}
    </div>
  );
}
