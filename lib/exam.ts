import { db } from "@/lib/db";

type SubmittedAnswer = { questionId: string; choiceId: string };

export async function calculateScore(examId: string, answers: SubmittedAnswer[]) {
  const questions = await db.question.findMany({
    where: { examId },
    include: { choices: true },
  });

  if (questions.length === 0) return 0;

  const answerMap = new Map(answers.map((a) => [a.questionId, a.choiceId]));
  let correct = 0;

  for (const q of questions) {
    const rightChoice = q.choices.find((c) => c.isCorrect);
    if (!rightChoice) continue;
    if (answerMap.get(q.id) === rightChoice.id) {
      correct += 1;
    }
  }

  return (correct / questions.length) * 100;
}
