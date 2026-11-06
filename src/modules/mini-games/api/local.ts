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

    if (task.type === 'forces' && answer.type === 'forces') {
      const refTypes = new Set<string>(task.forceTask.refs.map(ref => ref.type));
      const drawnTypes = new Set<string>(answer.vectors.map(vector => vector.type));
      const bad = [...refTypes].filter(type => !drawnTypes.has(type)).length +
        [...drawnTypes].filter(type => !refTypes.has(type)).length;
      let score = refTypes.size ? Math.max(0, 1 - bad / refTypes.size) : 0;
      const attempts = answer.attempts ?? 1;
      if (score > 0 && attempts > 1) score = Math.max(0, score - 0.25 * (attempts - 1));
      return {
        ...withXp({ outcome: outcomeFromScore(score), score }, task.topic, task.difficulty),
        correctAnswer: null,
      };
    }

    if (task.type === 'interactive' && answer.type === 'interactive') {
      const expected = task.physicsTask.find.value;
      const tolerance = Math.max(1e-6, Math.abs(expected) * 1e-3);
      let score = Math.abs(answer.value - expected) <= tolerance ? 1 : 0;
      const attempts = answer.attempts ?? 1;
      if (score > 0 && attempts > 1) score = Math.max(0, score - 0.25 * (attempts - 1));
      return {
        ...withXp({ outcome: outcomeFromScore(score), score }, task.topic, task.difficulty),
        correctAnswer: null,
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
