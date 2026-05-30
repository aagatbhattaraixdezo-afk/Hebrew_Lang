// Lenient comparison for Hebrew text typed by learners.
// Strips nikud (vowel marks U+0591–U+05C7), surrounding whitespace, and common
// punctuation that learners may or may not include. Compares Unicode-normalized.

export function normalizeHebrew(s: string): string {
  return s
    .normalize("NFC")
    .replace(/[֑-ׇ]/g, "") // nikud + cantillation marks
    .replace(/[\s.,!?'"`׳״־]/g, "") // whitespace + ASCII + Hebrew punctuation
    .toLowerCase()
    .trim();
}

export function hebrewMatches(input: string, expected: string): boolean {
  return normalizeHebrew(input) === normalizeHebrew(expected);
}

// Pick N random distractors from a list of cards, excluding the correct one.
// Used by the listening drill to build the multiple-choice options.
export function pickDistractors<T extends { id: string; back: string }>(
  pool: T[],
  correctId: string,
  count: number
): T[] {
  const candidates = pool.filter((c) => c.id !== correctId);
  // Fisher–Yates partial shuffle
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  return candidates.slice(0, count);
}
