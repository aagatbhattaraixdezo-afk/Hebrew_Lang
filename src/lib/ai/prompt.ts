// Prompt builder for the module generator. The schema description here is
// authoritative — it must match src/lib/ai/schemas.ts exactly.

type Input = {
  sourceText: string;
  moduleTitle: string;
  videoUrl?: string | null;
  mcqCount: number;
  quizQuestionCount: number;
  flashcardCount: number;
  level: "A1" | "A2";
};

export function buildPrompt(input: Input): {
  systemPrompt: string;
  userPrompt: string;
} {
  const systemPrompt = `You are an expert Hebrew language teacher building learning content for English-speaking adults preparing to live and work in Israel. Many of your learners are Nepali workers; English is the shared instruction language.

You MUST respond with ONLY a single JSON object — no markdown fences, no comments, no prose around it.

JSON schema (all fields required unless marked optional):

{
  "moduleTitle": string,           // a clear title for the lesson module
  "moduleDescription": string,     // 1–2 sentences describing what's covered
  "mcqs": [                        // multiple-choice practice questions
    {
      "promptNe": string,          // the question, written in clear English
      "hebrewText": string | null, // optional Hebrew word/phrase being tested, in Hebrew script
      "options": [                 // EXACTLY 4 options
        { "text": string, "isCorrect": true },
        { "text": string, "isCorrect": false },
        { "text": string, "isCorrect": false },
        { "text": string, "isCorrect": false }
      ],
      "explanationNe": string      // 1–2 sentence explanation in English
    }
  ],
  "quiz": {
    "title": string,
    "questions": [ /* same shape as mcqs items */ ]
  },
  "flashcards": [
    {
      "front": string,             // Hebrew text in Hebrew script
      "back": string,              // English meaning
      "transliteration": string,   // Latin-script transliteration (e.g. "shalom")
      "exampleHe": string | null,  // short Hebrew example sentence, optional
      "exampleNe": string | null   // English translation of the example, optional
    }
  ]
}

Hard rules:
- EXACTLY 4 options on every question, with EXACTLY 1 marked isCorrect: true.
- All questions and explanations are in clear, simple English.
- Hebrew strings use Hebrew script (right-to-left).
- Transliterations use Latin script.
- Keep difficulty appropriate for level ${input.level}.
- Derive every question and flashcard from the supplied source text. Do not invent vocabulary that isn't covered there.
- Do NOT include the legacy "Ne" suffix in field name explanations to the learner — just deliver clear English text in those fields.`;

  const counts = [
    `${input.mcqCount} MCQs (in mcqs[])`,
    `${input.quizQuestionCount} quiz questions (in quiz.questions[])`,
    `${input.flashcardCount} flashcards (in flashcards[])`,
  ].join(", ");

  const userPrompt = `Module title (suggested): ${input.moduleTitle}
Level: ${input.level}
Generate: ${counts}.
${input.videoUrl ? `Reference video (context only): ${input.videoUrl}\n` : ""}
Source material (use this and only this to derive your output):

${input.sourceText}`;

  return { systemPrompt, userPrompt };
}
