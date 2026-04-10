-- CreateEnum
CREATE TYPE "QuestionKind" AS ENUM ('MCQ', 'SHORT_ANSWER');

-- CreateEnum
CREATE TYPE "ExamAttemptStatus" AS ENUM ('DRAFT', 'PENDING_MANUAL', 'COMPLETE');

-- CreateEnum
CREATE TYPE "ShowSolutionsAfter" AS ENUM ('NEVER', 'AFTER_SUBMIT', 'AFTER_ATTEMPT_END');

-- AlterTable Exam
ALTER TABLE "Exam" ADD COLUMN     "shuffleQuestions" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Exam" ADD COLUMN     "shuffleChoices" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Exam" ADD COLUMN     "maxAttempts" INTEGER;
ALTER TABLE "Exam" ADD COLUMN     "reviewWindowMinutes" INTEGER;
ALTER TABLE "Exam" ADD COLUMN     "showSolutionsAfter" "ShowSolutionsAfter" NOT NULL DEFAULT 'NEVER';
ALTER TABLE "Exam" ADD COLUMN     "allowReviewWhileAttempt" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable Question
ALTER TABLE "Question" ADD COLUMN     "kind" "QuestionKind" NOT NULL DEFAULT 'MCQ';
ALTER TABLE "Question" ADD COLUMN     "points" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Question" ADD COLUMN     "rubric" TEXT;

-- AlterTable ExamAttempt
ALTER TABLE "ExamAttempt" ADD COLUMN     "attemptNumber" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "ExamAttempt" ADD COLUMN     "status" "ExamAttemptStatus" NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "ExamAttempt" ADD COLUMN     "manualScore" DOUBLE PRECISION;
ALTER TABLE "ExamAttempt" ADD COLUMN     "shortAnswerScoresJson" TEXT;
ALTER TABLE "ExamAttempt" ADD COLUMN     "shuffleSeed" TEXT;
ALTER TABLE "ExamAttempt" ADD COLUMN     "layoutJson" TEXT;

CREATE INDEX "ExamAttempt_userId_examId_idx" ON "ExamAttempt"("userId", "examId");

-- Backfill existing attempts (all were submitted before draft flow)
UPDATE "ExamAttempt" SET "status" = 'COMPLETE' WHERE "submittedAt" IS NOT NULL;
UPDATE "ExamAttempt" SET "attemptNumber" = 1 WHERE "attemptNumber" IS NULL;
