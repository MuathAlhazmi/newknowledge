import { db } from "@/lib/db";

type SubmittedAnswer = { questionId: string; choiceId: string };
type CorrectChoiceRef = { questionId: string; correctChoiceId: string };

function scoreFromCorrectChoices(
  correctChoices: CorrectChoiceRef[],
  answers: SubmittedAnswer[],
) {
  if (correctChoices.length === 0) return 0;

  const answerMap = new Map(answers.map((a) => [a.questionId, a.choiceId]));
  let correct = 0;
  for (const row of correctChoices) {
    if (answerMap.get(row.questionId) === row.correctChoiceId) {
      correct += 1;
    }
  }
  return (correct / correctChoices.length) * 100;
}

export function calculateScoreFromCorrectChoices(
  correctChoices: CorrectChoiceRef[],
  answers: SubmittedAnswer[],
) {
  return scoreFromCorrectChoices(correctChoices, answers);
}

export async function calculateScore(examId: string, answers: SubmittedAnswer[]) {
  const questions = await db.question.findMany({
    where: { examId },
    select: {
      id: true,
      choices: {
        where: { isCorrect: true },
        select: { id: true },
        take: 1,
      },
    },
  });

  const correctChoices = questions
    .map((q) => {
      const rightChoice = q.choices[0];
      if (!rightChoice) return null;
      return { questionId: q.id, correctChoiceId: rightChoice.id };
    })
    .filter((row): row is CorrectChoiceRef => row !== null);

  return scoreFromCorrectChoices(correctChoices, answers);
}
