import { AnyTask } from '../domain/types';

/**
 * Звезда начисляется за полностью верное решение новой или сложной задачи
 * и только в режимах, где звёзды предусмотрены (Тренировка).
 */
export const earnedStars = (
  task: Pick<AnyTask, 'isNew' | 'isHard'>,
  score: number,
  awardStars: boolean,
): number => (awardStars && score >= 1 && (task.isNew || task.isHard) ? 1 : 0);
