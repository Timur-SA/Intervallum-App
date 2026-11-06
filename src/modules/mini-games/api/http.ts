import { createLocalApi } from './local';
import { getTaskById } from '../data';
import { TaskAnswer } from '../domain/types';
import { GradeRequest, GradeResponse, MiniGamesApi } from './contracts';

const CORE_URL = (import.meta.env.VITE_CORE_API_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '');
const USER_KEY = 'intervallum:coreUserId';

export const getCoreUserId = (): string => {
  if (typeof window === 'undefined') return 'server-user';
  const existing = window.localStorage.getItem(USER_KEY);
  if (existing) return existing;
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `user-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(USER_KEY, id);
  return id;
};

const coreAnswer = (taskId: string, answer: TaskAnswer): unknown => {
  const task = getTaskById(taskId);
  if (!task) return answer;

  if (answer.type === 'single') return { optionId: answer.optionId };
  if (answer.type === 'multi') return { optionIds: answer.optionIds };
  if (answer.type === 'cards') return { selfAssessment: answer.selfAssessment };

  if (answer.type === 'matching' && task.type === 'matching') {
    const links: Record<string, string> = {};
    for (const [leftId, rightId] of Object.entries(answer.links)) {
      const pair = task.pairs.find(item => item.id === rightId);
      links[leftId] = pair?.right ?? rightId;
    }
    return { links };
  }
  return answer;
};

const appAnswer = (taskId: string, data: any): TaskAnswer | null => {
  const task = getTaskById(taskId);
  const correct = data.correct_answer;
  if (!correct) return null;
  if (task?.type === 'single' && correct.optionId) {
    return { type: 'single', optionId: correct.optionId };
  }
  if (task?.type === 'multi' && Array.isArray(correct.optionIds)) {
    return { type: 'multi', optionIds: correct.optionIds };
  }
  if (task?.type === 'matching' && correct.links) {
    const links: Record<string, string> = {};
    for (const [leftId, rightText] of Object.entries(correct.links as Record<string, string>)) {
      const pair = task.pairs.find(item => item.right === rightText);
      if (pair) links[leftId] = pair.id;
    }
    return { type: 'matching', links };
  }
  return null;
};

const toGradeResponse = (taskId: string, data: any): GradeResponse => ({
  outcome: data.outcome,
  score: data.score,
  xpByTopic: data.xp_by_topic ?? {},
  cardGrade: data.card_grade ?? undefined,
  correctAnswer: appAnswer(taskId, data),
});

export const createHttpApi = (): MiniGamesApi => ({
  async grade({ taskId, answer }: GradeRequest): Promise<GradeResponse> {
    const response = await fetch(`${CORE_URL}/v2/grade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: getCoreUserId(),
        task_id: taskId,
        answer: coreAnswer(taskId, answer),
      }),
    });
    if (!response.ok) {
      throw new Error(`[core] grade failed: ${response.status}`);
    }
    return toGradeResponse(taskId, await response.json());
  },
});

/** Core is the source of truth; local grading keeps the app usable offline. */
export const createResilientApi = (): MiniGamesApi => {
  const remote = createHttpApi();
  const local = createLocalApi();
  return {
    async grade(request) {
      try {
        return await remote.grade(request);
      } catch {
        return local.grade(request);
      }
    },
  };
};
