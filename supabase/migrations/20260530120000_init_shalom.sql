-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'LEARNER');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "brandColor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'LEARNER',
    "xp" INTEGER NOT NULL DEFAULT 0,
    "streakCount" INTEGER NOT NULL DEFAULT 0,
    "lastActiveOn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "level" TEXT,
    "coverColor" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Module" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "aiSourceText" TEXT,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "bodyNe" TEXT,
    "bodyEn" TEXT,
    "videoUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mcq" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "promptNe" TEXT NOT NULL,
    "hebrewText" TEXT,
    "explanationNe" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Mcq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "McqOption" (
    "id" TEXT NOT NULL,
    "mcqId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "McqOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quiz" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "promptNe" TEXT NOT NULL,
    "hebrewText" TEXT,
    "explanationNe" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "QuizOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlashcardDeck" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',

    CONSTRAINT "FlashcardDeck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flashcard" (
    "id" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "front" TEXT NOT NULL,
    "back" TEXT NOT NULL,
    "transliteration" TEXT,
    "exampleHe" TEXT,
    "exampleNe" TEXT,

    CONSTRAINT "Flashcard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "ease" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "intervalDays" INTEGER NOT NULL DEFAULT 0,
    "dueOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reps" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CardState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "score" INTEGER,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "McqAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mcqId" TEXT NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "McqAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrollmentCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "redeemedBy" TEXT,
    "redeemedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnrollmentCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scenario" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "setting" TEXT,
    "aiRolePrompt" TEXT NOT NULL,
    "level" TEXT,
    "icon" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Scenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Phrase" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "hebrew" TEXT NOT NULL,
    "english" TEXT NOT NULL,
    "transliteration" TEXT,
    "whenToUse" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Phrase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleplayConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoleplayConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleplayMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoleplayMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- CreateIndex
CREATE INDEX "Course_tenantId_idx" ON "Course"("tenantId");

-- CreateIndex
CREATE INDEX "Module_courseId_idx" ON "Module"("courseId");

-- CreateIndex
CREATE INDEX "Lesson_moduleId_idx" ON "Lesson"("moduleId");

-- CreateIndex
CREATE INDEX "Mcq_lessonId_idx" ON "Mcq"("lessonId");

-- CreateIndex
CREATE INDEX "McqOption_mcqId_idx" ON "McqOption"("mcqId");

-- CreateIndex
CREATE INDEX "Quiz_moduleId_idx" ON "Quiz"("moduleId");

-- CreateIndex
CREATE INDEX "QuizQuestion_quizId_idx" ON "QuizQuestion"("quizId");

-- CreateIndex
CREATE INDEX "QuizOption_questionId_idx" ON "QuizOption"("questionId");

-- CreateIndex
CREATE INDEX "FlashcardDeck_moduleId_idx" ON "FlashcardDeck"("moduleId");

-- CreateIndex
CREATE INDEX "Flashcard_deckId_idx" ON "Flashcard"("deckId");

-- CreateIndex
CREATE INDEX "CardState_userId_idx" ON "CardState"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CardState_userId_cardId_key" ON "CardState"("userId", "cardId");

-- CreateIndex
CREATE INDEX "Enrollment_userId_idx" ON "Enrollment"("userId");

-- CreateIndex
CREATE INDEX "Enrollment_courseId_idx" ON "Enrollment"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_userId_courseId_key" ON "Enrollment"("userId", "courseId");

-- CreateIndex
CREATE INDEX "LessonProgress_userId_idx" ON "LessonProgress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonProgress_userId_lessonId_key" ON "LessonProgress"("userId", "lessonId");

-- CreateIndex
CREATE INDEX "McqAttempt_userId_createdAt_idx" ON "McqAttempt"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "McqAttempt_userId_mcqId_idx" ON "McqAttempt"("userId", "mcqId");

-- CreateIndex
CREATE UNIQUE INDEX "EnrollmentCode_code_key" ON "EnrollmentCode"("code");

-- CreateIndex
CREATE INDEX "EnrollmentCode_courseId_idx" ON "EnrollmentCode"("courseId");

-- CreateIndex
CREATE INDEX "Scenario_tenantId_idx" ON "Scenario"("tenantId");

-- CreateIndex
CREATE INDEX "Phrase_scenarioId_idx" ON "Phrase"("scenarioId");

-- CreateIndex
CREATE INDEX "RoleplayConversation_userId_scenarioId_idx" ON "RoleplayConversation"("userId", "scenarioId");

-- CreateIndex
CREATE INDEX "RoleplayMessage_conversationId_idx" ON "RoleplayMessage"("conversationId");

-- CreateIndex
CREATE INDEX "QuizAttempt_userId_quizId_idx" ON "QuizAttempt"("userId", "quizId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Module" ADD CONSTRAINT "Module_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mcq" ADD CONSTRAINT "Mcq_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "McqOption" ADD CONSTRAINT "McqOption_mcqId_fkey" FOREIGN KEY ("mcqId") REFERENCES "Mcq"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizOption" ADD CONSTRAINT "QuizOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlashcardDeck" ADD CONSTRAINT "FlashcardDeck_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flashcard" ADD CONSTRAINT "Flashcard_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "FlashcardDeck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardState" ADD CONSTRAINT "CardState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardState" ADD CONSTRAINT "CardState_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Flashcard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "McqAttempt" ADD CONSTRAINT "McqAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "McqAttempt" ADD CONSTRAINT "McqAttempt_mcqId_fkey" FOREIGN KEY ("mcqId") REFERENCES "Mcq"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentCode" ADD CONSTRAINT "EnrollmentCode_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scenario" ADD CONSTRAINT "Scenario_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Phrase" ADD CONSTRAINT "Phrase_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleplayConversation" ADD CONSTRAINT "RoleplayConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleplayConversation" ADD CONSTRAINT "RoleplayConversation_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleplayMessage" ADD CONSTRAINT "RoleplayMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "RoleplayConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
