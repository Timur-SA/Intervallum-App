import { getTaskById } from '../data';
import { GradeResult, TaskAnswer, TopicId } from '../domain/types';
import {
  cardScore,
  gradeMatching,
  gradeMulti,
  gradeSingle,
  outcomeFromScore,
  xpForScore,
} from '../engine/grading';
import { GradeRequest, GradeResponse, MiniGamesApi } from './contracts';

const withXp = (
  result: Omit<GradeResult, 'xpByTopic'>,
  topic: TopicId,
  difficulty: 1 | 2 | 3,
): GradeResult => {
  const xp = xpForScore(result.score, difficulty);
  return {
    ...result,
    xpByTopic: xp > 0 ? { [topic]: xp } : {},
  };
};

/**
 * Локальная реализация v2/grade: считает оценку по правилам Core
 * и начисляет опыт. Заменяется HTTP-адаптером без изменения UI.
 */
export const createLocalApi = (): MiniGamesApi => ({
  async grade({ taskId, answer }: GradeRequest): Promise<GradeResponse> {
    const task = getTaskById(taskId);

    if (!task) {
      throw new Error(`[mini-games] Неизвестная задача: ${taskId}`);
    }

    if (task.type === 'single') {
      const selected = answer.type === 'single' ? answer.optionId : null;
      const score = gradeSingle(selected, task.correctOptionId);
      const result = withXp(
        { outcome: outcomeFromScore(score), score },
        task.topic,
        task.difficulty,
      );

      return {
        ...result,
        correctAnswer: { type: 'single', optionId: task.correctOptionId },
      };
    }

    if (task.type === 'multi') {
      const selected = answer.type === 'multi' ? answer.optionIds : [];
      const score = gradeMulti(selected, task.correctOptionIds);
      const result = withXp(
        { outcome: outcomeFromScore(score), score },
        task.topic,
        task.difficulty,
      );

      return {
        ...result,
        correctAnswer: { type: 'multi', optionIds: task.correctOptionIds },
      };
    }

    if (task.type === 'matching') {
      const links = answer.type === 'matching' ? answer.links : {};
      const wrongPairs = task.pairs.filter(pair => links[pair.id] !== pair.id).length;
      const score = gradeMatching(wrongPairs, task.pairs.length);
      const result = withXp(
        { outcome: outcomeFromScore(score), score },
        task.topic,
        task.difficulty,
      );

      const correctLinks: Record<string, string> = {};
      for (const pair of task.pairs) correctLinks[pair.id] = pair.id;

      return {
        ...result,
        correctAnswer: { type: 'matching', links: correctLinks },
      };
    }

    const selfAssessment = answer.type === 'cards' ? answer.selfAssessment : 0;
    const score = cardScore(selfAssessment);

    return {
      outcome: outcomeFromScore(score),
      score,
      cardGrade: selfAssessment,
      // Карточки — учебный материал, опыт за них не начисляется.
      xpByTopic: {},
      correctAnswer: null,
    };
  },
});

export type { TaskAnswer };
