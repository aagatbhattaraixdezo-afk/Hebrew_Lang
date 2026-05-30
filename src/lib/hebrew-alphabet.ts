// The 22 letters of the Hebrew alphabet in alef-bet order.
// Each entry includes the letter name (English transliteration), the
// phonetic transliteration, a short pronunciation hint aimed at a
// Nepali/English speaker, and a concrete example word.

export type HebrewLetter = {
  letter: string;
  name: string;
  transliteration: string;
  sound: string;
  finalForm?: string; // letters that have a different shape at word-end
  example: { he: string; trans: string; en: string };
};

export const hebrewAlphabet: HebrewLetter[] = [
  {
    letter: "א",
    name: "Alef",
    transliteration: "ʾ / silent",
    sound: "Usually silent — it carries the vowel that comes with it.",
    example: { he: "אבא", trans: "aba", en: "father" },
  },
  {
    letter: "ב",
    name: "Bet",
    transliteration: "b / v",
    sound: "Like English ‘b’. Without the dot inside (ב without dagesh) it becomes a soft ‘v’.",
    example: { he: "בית", trans: "bayit", en: "house" },
  },
  {
    letter: "ג",
    name: "Gimel",
    transliteration: "g",
    sound: "Hard ‘g’ as in ‘go’.",
    example: { he: "גמל", trans: "gamal", en: "camel" },
  },
  {
    letter: "ד",
    name: "Dalet",
    transliteration: "d",
    sound: "Like English ‘d’.",
    example: { he: "דג", trans: "dag", en: "fish" },
  },
  {
    letter: "ה",
    name: "He",
    transliteration: "h",
    sound: "Soft ‘h’ as in ‘hello’. Often silent at the end of a word.",
    example: { he: "הוא", trans: "hu", en: "he" },
  },
  {
    letter: "ו",
    name: "Vav",
    transliteration: "v / o / u",
    sound: "Usually ‘v’. Can also act as the vowels ‘o’ or ‘u’.",
    example: { he: "ורד", trans: "vered", en: "rose" },
  },
  {
    letter: "ז",
    name: "Zayin",
    transliteration: "z",
    sound: "Like the ‘z’ in ‘zebra’.",
    example: { he: "זהב", trans: "zahav", en: "gold" },
  },
  {
    letter: "ח",
    name: "Het",
    transliteration: "ḥ",
    sound: "Throaty ‘h’ — like the ‘ch’ in Scottish ‘loch’. Comes from the back of the throat.",
    example: { he: "חם", trans: "cham", en: "hot" },
  },
  {
    letter: "ט",
    name: "Tet",
    transliteration: "t",
    sound: "Like English ‘t’. (Same sound as ת in modern Hebrew.)",
    example: { he: "טוב", trans: "tov", en: "good" },
  },
  {
    letter: "י",
    name: "Yod",
    transliteration: "y / i",
    sound: "Like ‘y’ in ‘yes’, or the vowel ‘ee’.",
    example: { he: "ילד", trans: "yeled", en: "child" },
  },
  {
    letter: "כ",
    name: "Kaf",
    transliteration: "k / kh",
    sound: "‘k’ with the dot, soft ‘kh’ (like German ‘Bach’) without.",
    finalForm: "ך",
    example: { he: "כן", trans: "ken", en: "yes" },
  },
  {
    letter: "ל",
    name: "Lamed",
    transliteration: "l",
    sound: "Like English ‘l’.",
    example: { he: "לחם", trans: "lechem", en: "bread" },
  },
  {
    letter: "מ",
    name: "Mem",
    transliteration: "m",
    sound: "Like English ‘m’.",
    finalForm: "ם",
    example: { he: "מים", trans: "mayim", en: "water" },
  },
  {
    letter: "נ",
    name: "Nun",
    transliteration: "n",
    sound: "Like English ‘n’.",
    finalForm: "ן",
    example: { he: "נר", trans: "ner", en: "candle" },
  },
  {
    letter: "ס",
    name: "Samekh",
    transliteration: "s",
    sound: "Like English ‘s’.",
    example: { he: "ספר", trans: "sefer", en: "book" },
  },
  {
    letter: "ע",
    name: "Ayin",
    transliteration: "ʿ",
    sound: "Usually silent in modern Hebrew — historically a deep throat sound.",
    example: { he: "עץ", trans: "etz", en: "tree" },
  },
  {
    letter: "פ",
    name: "Pe",
    transliteration: "p / f",
    sound: "‘p’ with the dot, ‘f’ without.",
    finalForm: "ף",
    example: { he: "פה", trans: "po", en: "here / mouth" },
  },
  {
    letter: "צ",
    name: "Tsadi",
    transliteration: "ts",
    sound: "‘ts’ as in ‘pizza’ — one sound, not two.",
    finalForm: "ץ",
    example: { he: "צהריים", trans: "tsohorayim", en: "noon" },
  },
  {
    letter: "ק",
    name: "Qof",
    transliteration: "q / k",
    sound: "Like ‘k’ (same sound as כ with the dot in modern Hebrew).",
    example: { he: "קר", trans: "kar", en: "cold" },
  },
  {
    letter: "ר",
    name: "Resh",
    transliteration: "r",
    sound: "A rolled ‘r’ at the back of the throat — closer to French ‘r’ than English.",
    example: { he: "רוח", trans: "ruach", en: "wind / spirit" },
  },
  {
    letter: "ש",
    name: "Shin",
    transliteration: "sh / s",
    sound: "‘sh’ with the dot on the right (שׁ); ‘s’ with the dot on the left (שׂ).",
    example: { he: "שלום", trans: "shalom", en: "hello / peace" },
  },
  {
    letter: "ת",
    name: "Tav",
    transliteration: "t",
    sound: "Like English ‘t’. (Same sound as ט in modern Hebrew.)",
    example: { he: "תודה", trans: "toda", en: "thank you" },
  },
];
