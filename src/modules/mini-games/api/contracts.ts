import { GradeResult, TaskAnswer, TopicId } from '../domain/types';

/**
 * Контракт с Intervallum-Core (v2/grade).
 * Сейчас реализуется локальным моком, позже — HTTP-адаптером.
 */
export interface GradeRequest {
  taskId: string;
  answer: TaskAnswer;
}

export interface GradeResponse extends GradeResult {
  correctAnswer: TaskAnswer | null;
}

export interface MiniGamesApi {
  grade(request: GradeRequest): Promise<GradeResponse>;
}

export type XpByTopic = Partial<Record<TopicId, number>>;
