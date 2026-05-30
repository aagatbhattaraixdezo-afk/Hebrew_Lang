import { PrismaClient, Role, ContentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction([
    prisma.cardState.deleteMany(),
    prisma.lessonProgress.deleteMany(),
    prisma.enrollment.deleteMany(),
    prisma.flashcard.deleteMany(),
    prisma.flashcardDeck.deleteMany(),
    prisma.quizOption.deleteMany(),
    prisma.quizQuestion.deleteMany(),
    prisma.quiz.deleteMany(),
    prisma.mcqOption.deleteMany(),
    prisma.mcq.deleteMany(),
    prisma.lesson.deleteMany(),
    prisma.module.deleteMany(),
    prisma.course.deleteMany(),
    prisma.user.deleteMany(),
    prisma.tenant.deleteMany(),
  ]);

  const tenant = await prisma.tenant.create({
    data: { name: "Demo Consultancy", brandColor: "#3F7D6E" },
  });

  const password = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: "admin@demo.test",
      passwordHash: password,
      name: "Admin",
      role: Role.ADMIN,
    },
  });

  const learners = await Promise.all(
    ["aarati", "binod", "chandra"].map((slug, i) =>
      prisma.user.create({
        data: {
          tenantId: tenant.id,
          email: `${slug}@demo.test`,
          passwordHash: password,
          name: slug[0].toUpperCase() + slug.slice(1),
          role: Role.LEARNER,
          xp: i === 0 ? 60 : 0,
          streakCount: i === 0 ? 2 : 0,
          lastActiveOn: i === 0 ? new Date() : null,
        },
      })
    )
  );

  const course = await prisma.course.create({
    data: {
      tenantId: tenant.id,
      title: "Survival Hebrew for Caregivers (A1)",
      description:
        "Starter Hebrew for Nepali workers heading to Israel — greetings, family, and caregiving vocabulary you'll use every day.",
      level: "A1 / Survival",
      coverColor: "#3F7D6E",
      order: 0,
      status: ContentStatus.PUBLISHED,
    },
  });

  // Module 1 — Greetings & Basics
  const m1 = await prisma.module.create({
    data: {
      courseId: course.id,
      title: "Greetings & Basics",
      description: "Hello, thank you, and good morning — the daily greetings that open every conversation.",
      order: 0,
    },
  });

  const m1Lesson = await prisma.lesson.create({
    data: {
      moduleId: m1.id,
      title: "Hello & Thank You",
      order: 0,
      bodyEn: `## Your first Hebrew words

The single most useful word in Hebrew is **שלום (shalom)** — it means "hello", "goodbye", *and* "peace", all at once.

- **שלום** (shalom) — hello / goodbye
- **תודה** (toda) — thank you
- **בוקר טוב** (boker tov) — good morning
- **לילה טוב** (laila tov) — good night
- **בבקשה** (bevakasha) — please / you're welcome

> Tip: Hebrew is written **right to left**. Notice the direction as you read each word above.`,
      videoUrl: null,
    },
  });

  const m1Mcqs = [
    {
      promptNe: 'What does "shalom" mean?',
      hebrewText: "שלום",
      explanationNe: 'Shalom (שלום) means hello, goodbye, and peace — all three.',
      options: [
        { text: "Hello (and goodbye)", isCorrect: true },
        { text: "Thank you", isCorrect: false },
        { text: "Good morning", isCorrect: false },
        { text: "Good night", isCorrect: false },
      ],
    },
    {
      promptNe: 'Which Hebrew word means "thank you"?',
      hebrewText: "תודה",
      explanationNe: 'Toda (תודה) is "thank you".',
      options: [
        { text: "Toda", isCorrect: true },
        { text: "Shalom", isCorrect: false },
        { text: "Bevakasha", isCorrect: false },
        { text: "Boker tov", isCorrect: false },
      ],
    },
    {
      promptNe: "How do you greet someone in the morning?",
      hebrewText: "בוקר טוב",
      explanationNe: 'Boker tov (בוקר טוב) literally means "good morning".',
      options: [
        { text: "Boker tov", isCorrect: true },
        { text: "Laila tov", isCorrect: false },
        { text: "Toda", isCorrect: false },
        { text: "Shalom", isCorrect: false },
      ],
    },
    {
      promptNe: 'Which Hebrew word means "please" (or "you\'re welcome")?',
      hebrewText: "בבקשה",
      explanationNe:
        'Bevakasha (בבקשה) means both "please" and "you\'re welcome", depending on context.',
      options: [
        { text: "Bevakasha", isCorrect: true },
        { text: "Toda", isCorrect: false },
        { text: "Shalom", isCorrect: false },
        { text: "Laila tov", isCorrect: false },
      ],
    },
    {
      promptNe: "How would you say goodnight to someone?",
      hebrewText: "לילה טוב",
      explanationNe: 'Laila tov (לילה טוב) literally means "good night".',
      options: [
        { text: "Laila tov", isCorrect: true },
        { text: "Boker tov", isCorrect: false },
        { text: "Toda", isCorrect: false },
        { text: "Bevakasha", isCorrect: false },
      ],
    },
  ];

  for (let i = 0; i < m1Mcqs.length; i++) {
    const q = m1Mcqs[i];
    await prisma.mcq.create({
      data: {
        lessonId: m1Lesson.id,
        promptNe: q.promptNe,
        hebrewText: q.hebrewText,
        explanationNe: q.explanationNe,
        order: i,
        options: { create: q.options },
      },
    });
  }

  await prisma.quiz.create({
    data: {
      moduleId: m1.id,
      title: "Greetings Quiz",
      questions: {
        create: m1Mcqs.map((q, i) => ({
          promptNe: q.promptNe,
          hebrewText: q.hebrewText,
          explanationNe: q.explanationNe,
          order: i,
          options: { create: q.options },
        })),
      },
    },
  });

  await prisma.flashcardDeck.create({
    data: {
      moduleId: m1.id,
      title: "Greetings Deck",
      cards: {
        create: [
          { front: "שלום", back: "hello / peace", transliteration: "shalom", exampleHe: "שלום, מה שלומך?", exampleNe: "Hello, how are you?" },
          { front: "תודה", back: "thank you", transliteration: "toda", exampleHe: "תודה רבה", exampleNe: "Thank you very much" },
          { front: "בוקר טוב", back: "good morning", transliteration: "boker tov" },
          { front: "לילה טוב", back: "good night", transliteration: "laila tov" },
          { front: "בבקשה", back: "please / you're welcome", transliteration: "bevakasha" },
          { front: "כן", back: "yes", transliteration: "ken" },
          { front: "לא", back: "no", transliteration: "lo" },
          { front: "סליחה", back: "excuse me / sorry", transliteration: "slicha" },
          { front: "מה שלומך?", back: "how are you?", transliteration: "ma shlomcha?" },
          { front: "להתראות", back: "see you later", transliteration: "lehitraot" },
        ],
      },
    },
  });

  // Module 2 — Caregiving words
  const m2 = await prisma.module.create({
    data: {
      courseId: course.id,
      title: "Caregiving words",
      description: "Water, medicine, food — the everyday vocabulary of caring for someone.",
      order: 1,
    },
  });

  const m2Lesson = await prisma.lesson.create({
    data: {
      moduleId: m2.id,
      title: "Daily Care Vocabulary",
      order: 0,
      bodyEn: `## Words you'll use every day

When caring for a patient or an elderly person, these are the words you'll reach for most often:

- **מים** (mayim) — water
- **תרופה** (terufa) — medicine
- **כאב** (ke'ev) — pain
- **אוכל** (okhel) — food

> Practice tip: say each word out loud five times a day. Repetition is how Hebrew sticks.`,
    },
  });

  const m2Mcqs = [
    {
      promptNe: 'Which Hebrew word means "water"?',
      hebrewText: "מים",
      explanationNe: 'Mayim (מים) means water.',
      options: [
        { text: "Mayim", isCorrect: true },
        { text: "Okhel", isCorrect: false },
        { text: "Terufa", isCorrect: false },
        { text: "Ke'ev", isCorrect: false },
      ],
    },
    {
      promptNe: 'What is the Hebrew word for "medicine"?',
      hebrewText: "תרופה",
      explanationNe: 'Terufa (תרופה) means medicine.',
      options: [
        { text: "Terufa", isCorrect: true },
        { text: "Mayim", isCorrect: false },
        { text: "Okhel", isCorrect: false },
        { text: "Shalom", isCorrect: false },
      ],
    },
    {
      promptNe: 'Which word means "pain"?',
      hebrewText: "כאב",
      explanationNe: "Ke'ev (כאב) means pain.",
      options: [
        { text: "Ke'ev", isCorrect: true },
        { text: "Toda", isCorrect: false },
        { text: "Okhel", isCorrect: false },
        { text: "Mayim", isCorrect: false },
      ],
    },
    {
      promptNe: 'Which Hebrew word means "food"?',
      hebrewText: "אוכל",
      explanationNe: 'Okhel (אוכל) means food.',
      options: [
        { text: "Okhel", isCorrect: true },
        { text: "Terufa", isCorrect: false },
        { text: "Mayim", isCorrect: false },
        { text: "Ke'ev", isCorrect: false },
      ],
    },
  ];

  for (let i = 0; i < m2Mcqs.length; i++) {
    const q = m2Mcqs[i];
    await prisma.mcq.create({
      data: {
        lessonId: m2Lesson.id,
        promptNe: q.promptNe,
        hebrewText: q.hebrewText,
        explanationNe: q.explanationNe,
        order: i,
        options: { create: q.options },
      },
    });
  }

  await prisma.quiz.create({
    data: {
      moduleId: m2.id,
      title: "Caregiving Quiz",
      questions: {
        create: m2Mcqs.map((q, i) => ({
          promptNe: q.promptNe,
          hebrewText: q.hebrewText,
          explanationNe: q.explanationNe,
          order: i,
          options: { create: q.options },
        })),
      },
    },
  });

  await prisma.flashcardDeck.create({
    data: {
      moduleId: m2.id,
      title: "Caregiving Deck",
      cards: {
        create: [
          { front: "מים", back: "water", transliteration: "mayim" },
          { front: "תרופה", back: "medicine", transliteration: "terufa" },
          { front: "כאב", back: "pain", transliteration: "ke'ev" },
          { front: "אוכל", back: "food", transliteration: "okhel" },
          { front: "רופא", back: "doctor", transliteration: "rofe" },
          { front: "מיטה", back: "bed", transliteration: "mita" },
          { front: "כיסא", back: "chair", transliteration: "kise" },
          { front: "חם", back: "hot", transliteration: "cham" },
        ],
      },
    },
  });

  for (const learner of learners) {
    await prisma.enrollment.create({
      data: { userId: learner.id, courseId: course.id },
    });
  }

  await prisma.lessonProgress.create({
    data: {
      userId: learners[0].id,
      lessonId: m1Lesson.id,
      completed: true,
      score: 80,
      xpEarned: 60,
    },
  });

  // --- Scenarios -----------------------------------------------------------

  const scenarios = [
    {
      title: "At the supermarket",
      icon: "🛒",
      setting: "Buying everyday groceries at a small Israeli supermarket.",
      level: "A1",
      description:
        "Practise asking for items, prices and where things are. The cashier is busy but friendly.",
      aiRolePrompt:
        "You are a friendly Israeli supermarket cashier in Tel Aviv. Greet the learner in Hebrew, help them find items and ring up their groceries. Use short, A1-level Hebrew. Always follow each Hebrew line with its English translation in parentheses on the same line. Keep replies under 3 sentences.",
      phrases: [
        { hebrew: "?כמה זה עולה", english: "How much does it cost?", transliteration: "kama ze oleh?", whenToUse: "Asking the price of an item." },
        { hebrew: "?איפה החלב", english: "Where is the milk?", transliteration: "eifo ha-chalav?", whenToUse: "Asking where something is on the shelves." },
        { hebrew: "אני רוצה לקנות לחם", english: "I want to buy bread.", transliteration: "ani rotzeh liknot lechem.", whenToUse: "Stating what you want to buy." },
        { hebrew: "?יש לכם ביצים", english: "Do you have eggs?", transliteration: "yesh lachem beytzim?", whenToUse: "Asking if they stock something." },
        { hebrew: "תודה רבה", english: "Thank you very much.", transliteration: "toda raba.", whenToUse: "Finishing the interaction politely." },
        { hebrew: "?אפשר שקית בבקשה", english: "Can I have a bag please?", transliteration: "efshar sakit bevakasha?", whenToUse: "Asking for a shopping bag." },
      ],
    },
    {
      title: "Asking for directions",
      icon: "🧭",
      setting: "Lost on a Tel Aviv street, asking a passerby for directions.",
      level: "A1",
      description: "Stop a stranger politely and ask the way to a landmark.",
      aiRolePrompt:
        "You are a helpful Israeli stranger on a Tel Aviv street. The learner is lost. Listen, give simple directions, and use short A1-level Hebrew. Every Hebrew line is followed by its English translation in parentheses on the same line.",
      phrases: [
        { hebrew: "?סליחה, איפה התחנה", english: "Excuse me, where is the station?", transliteration: "slicha, eifo ha-tachana?", whenToUse: "Asking the way to a place." },
        { hebrew: "?אפשר ללכת ברגל", english: "Can I walk there?", transliteration: "efshar lalechet baregel?", whenToUse: "Asking if the place is walkable." },
        { hebrew: "ימינה", english: "Right.", transliteration: "yamina.", whenToUse: "Direction." },
        { hebrew: "שמאלה", english: "Left.", transliteration: "smola.", whenToUse: "Direction." },
        { hebrew: "ישר", english: "Straight ahead.", transliteration: "yashar.", whenToUse: "Direction." },
        { hebrew: "?כמה זמן זה לוקח", english: "How long does it take?", transliteration: "kama zman ze lokeach?", whenToUse: "Asking how long the journey is." },
      ],
    },
    {
      title: "On the phone with the family",
      icon: "📞",
      setting: "Calling the Israeli family you work for to update them.",
      level: "A2",
      description: "Polite phone conversation: greetings, simple status update, ending the call.",
      aiRolePrompt:
        "You are the kind elderly Israeli woman the caregiver works for. The learner is the caregiver, calling to give an update. Reply in short, polite, slightly slow Hebrew suitable for A2. Always follow each Hebrew line with its English translation in parentheses on the same line. Be warm and patient — gently correct big mistakes.",
      phrases: [
        { hebrew: "?שלום, איך את מרגישה", english: "Hello, how are you feeling?", transliteration: "shalom, eich at margisha?", whenToUse: "Opening the call (when speaking to a woman)." },
        { hebrew: "הכל בסדר", english: "Everything is fine.", transliteration: "hakol beseder.", whenToUse: "Reassuring the family member." },
        { hebrew: "?לקחת את התרופה", english: "Did you take your medicine?", transliteration: "lakacht et ha-terufa?", whenToUse: "Asking about medication (to a woman)." },
        { hebrew: "אני קונה אוכל", english: "I am buying food.", transliteration: "ani koneh okhel.", whenToUse: "Telling them what you're doing." },
        { hebrew: "?צריך משהו", english: "Do you need anything?", transliteration: "tzarich mashehu?", whenToUse: "Offering help." },
        { hebrew: "להתראות", english: "See you later.", transliteration: "lehitraot.", whenToUse: "Ending the call." },
      ],
    },
    {
      title: "At the pharmacy",
      icon: "💊",
      setting: "Buying medicine at an Israeli pharmacy.",
      level: "A2",
      description: "Describe a symptom, ask for medicine, understand the pharmacist's instructions.",
      aiRolePrompt:
        "You are a calm Israeli pharmacist. The learner is buying medicine for the elderly person they care for. Use simple A2 Hebrew, ask clarifying questions, and always follow each Hebrew line with its English translation in parentheses on the same line. Mention basic dosage instructions in simple terms.",
      phrases: [
        { hebrew: "יש לי כאב ראש", english: "I have a headache.", transliteration: "yesh li ke'ev rosh.", whenToUse: "Describing a symptom." },
        { hebrew: "?יש משהו לכאב גרון", english: "Is there something for a sore throat?", transliteration: "yesh mashehu li-ke'ev garon?", whenToUse: "Asking for a remedy." },
        { hebrew: "?כמה פעמים ביום", english: "How many times a day?", transliteration: "kama pe'amim ba-yom?", whenToUse: "Asking dosage frequency." },
        { hebrew: "אחרי האוכל", english: "After meals.", transliteration: "acharei ha-okhel.", whenToUse: "Common dosage instruction." },
        { hebrew: "?יש מרשם", english: "Is there a prescription?", transliteration: "yesh mirsham?", whenToUse: "Pharmacist asking about a prescription." },
        { hebrew: "?זה בטוח לקשישים", english: "Is this safe for elderly people?", transliteration: "ze batuach li-keshishim?", whenToUse: "Caregiver checking suitability." },
      ],
    },
  ];

  for (let i = 0; i < scenarios.length; i++) {
    const s = scenarios[i];
    await prisma.scenario.create({
      data: {
        tenantId: tenant.id,
        title: s.title,
        description: s.description,
        setting: s.setting,
        aiRolePrompt: s.aiRolePrompt,
        level: s.level,
        icon: s.icon,
        order: i,
        phrases: { create: s.phrases.map((p, idx) => ({ ...p, order: idx })) },
      },
    });
  }

  console.log("Seed complete.");
  console.log(`  Tenant:   ${tenant.name}`);
  console.log(`  Admin:    admin@demo.test / password123`);
  console.log(`  Learners: aarati@demo.test, binod@demo.test, chandra@demo.test / password123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
