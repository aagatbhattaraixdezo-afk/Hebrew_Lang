import { z } from "zod";

// Each option must have non-empty text and a boolean correct flag.
const optionSchema = z.object({
  text: z.string().min(1).max(500),
  isCorrect: z.boolean(),
});

// MCQ item schema. The DB column names use the legacy "Ne" suffix; the *content*
// is now English (we shifted in Phase 1.5). The AI prompt makes that explicit.
const mcqItemSchema = z
  .object({
    promptNe: z.string().min(1).max(1000),
    hebrewText: z
      .string()
      .max(200)
      .nullable()
      .optional()
      .transform((v) => v || null),
    options: z.array(optionSchema).length(4),
    explanationNe: z.string().min(1).max(2000),
  })
  .refine(
    (m) => m.options.filter((o) => o.isCorrect).length === 1,
    { message: "exactly one option must be marked isCorrect: true" }
  );

const flashcardItemSchema = z.object({
  front: z.string().min(1).max(200),
  back: z.string().min(1).max(500),
  transliteration: z
    .string()
    .max(200)
    .nullable()
    .optional()
    .transform((v) => v || ""),
  exampleHe: z
    .string()
    .max(500)
    .nullable()
    .optional()
    .transform((v) => v || null),
  exampleNe: z
    .string()
    .max(500)
    .nullable()
    .optional()
    .transform((v) => v || null),
});

export const aiResponseSchema = z.object({
  moduleTitle: z.string().min(1).max(200),
  moduleDescription: z.string().min(1).max(2000),
  mcqs: z.array(mcqItemSchema).min(1).max(20),
  quiz: z.object({
    title: z.string().min(1).max(200),
    questions: z.array(mcqItemSchema).min(1).max(20),
  }),
  flashcards: z.array(flashcardItemSchema).min(1).max(50),
});

export type AiResponse = z.infer<typeof aiResponseSchema>;
