import { AnyTask } from '../domain/types';

/**
 * Звезда за каждое полностью верное задание, ещё одна — за новое или сложное.
 * Так прогрессия не «высыхает», когда все задачи уже видели.
 */
export const earnedStars = (
  task: Pick<AnyTask, 'isNew' | 'isHard'>,
  score: number,
): number => {
  if (score < 1) return 0;
  return 1 + (task.isNew || task.isHard ? 1 : 0);
};
