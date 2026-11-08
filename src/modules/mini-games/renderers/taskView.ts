import { ComponentType, ReactNode } from 'react';
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
  /** Сид сессии: меняет порядок вариантов при каждом заходе. */
  seed?: string;
  /** Для карточной фазы: номер карточки и общее число карточек. */
  cardIndex?: number;
  cardTotal?: number;
  /** Вызывается, когда задание оценено и пользователь готов идти дальше. */
  onDone: (grade: GradeResponse) => void;
}

/** Единый контракт рендерера задания для реестра. */
export type TaskRenderer = ComponentType<TaskViewProps<any>>;

export const sumXp = (xp: Record<string, number | undefined>): number =>
  Object.values(xp).reduce((sum: number, value) => sum + (value ?? 0), 0);
