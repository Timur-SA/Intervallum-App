import { ReactNode } from 'react';
import { AnyTask } from '../domain/types';
import { GradeResponse } from '../api/contracts';

export interface TaskViewProps<T extends AnyTask = AnyTask> {
  task: T;
  step: number;
  total: number;
  /** Серия верных ответов; для карточек не используется. */
  streak?: number;
  /** Слот справа в шапке — например, таймер босса. */
  headerRight?: ReactNode;
  /** Вызывается, когда задание оценено и пользователь готов идти дальше. */
  onDone: (grade: GradeResponse) => void;
}

export const sumXp = (xp: Record<string, number | undefined>): number =>
  Object.values(xp).reduce((sum: number, value) => sum + (value ?? 0), 0);
