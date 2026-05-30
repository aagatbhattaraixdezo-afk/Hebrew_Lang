// Provider-agnostic adapter. Default = Google Gemini free tier. Swappable so a
// future Groq / OpenAI / OpenRouter implementation just adds a class here.

export class MissingApiKeyError extends Error {
  constructor() {
    super("AI_API_KEY is not configured");
    this.name = "MissingApiKeyError";
  }
}

export class AiProviderError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "AiProviderError";
  }
}

export type ChatTurn = { role: "user" | "assistant"; content: string };

export interface AiProvider {
  generateJSON(systemPrompt: string, userPrompt: string): Promise<string>;
  chat(systemPrompt: string, history: ChatTurn[]): Promise<string>;
}

export function getProvider(): AiProvider {
  const name = (process.env.AI_PROVIDER ?? "gemini").toLowerCase();
  switch (name) {
    case "gemini":
      return new GeminiProvider();
    default:
      throw new AiProviderError(`Unknown AI_PROVIDER: ${name}`);
  }
}

// --- Gemini ---

class GeminiProvider implements AiProvider {
  async generateJSON(systemPrompt: string, userPrompt: string): Promise<string> {
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) throw new MissingApiKeyError();
    const model = process.env.AI_MODEL || "gemini-2.0-flash";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      // Special-case the common 429 / 403 messages
      if (res.status === 403 || res.status === 401) {
        throw new AiProviderError(
          "Gemini rejected the API key (403/401). Get a free key at https://aistudio.google.com/apikey",
          res.status
        );
      }
      if (res.status === 429) {
        throw new AiProviderError(
          "Gemini rate-limited the request. Try again in a moment.",
          429
        );
      }
      throw new AiProviderError(
        `Gemini ${res.status}: ${body.slice(0, 400)}`,
        res.status
      );
    }

    const data = (await res.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
        finishReason?: string;
      }>;
    };

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new AiProviderError("Empty response from Gemini.");
    }
    return text;
  }

  async chat(systemPrompt: string, history: ChatTurn[]): Promise<string> {
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) throw new MissingApiKeyError();
    const model = process.env.AI_MODEL || "gemini-2.0-flash";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

    // Gemini uses "model" instead of "assistant"
    const contents = history.map((t) => ({
      role: t.role === "assistant" ? "model" : "user",
      parts: [{ text: t.content }],
    }));

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { temperature: 0.6, maxOutputTokens: 400 },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 401 || res.status === 403) {
        throw new AiProviderError(
          "Gemini rejected the API key (403/401). Get a free key at https://aistudio.google.com/apikey",
          res.status
        );
      }
      if (res.status === 429) {
        throw new AiProviderError("Gemini rate-limited the request. Try again in a moment.", 429);
      }
      throw new AiProviderError(`Gemini ${res.status}: ${body.slice(0, 400)}`, res.status);
    }

    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new AiProviderError("Empty reply from Gemini.");
    return text.trim();
  }
}
