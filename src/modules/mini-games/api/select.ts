import { PracticeProgress } from '../../../shared/storage/progressStore';
import { TASK_BANK, getTaskById } from '../data';
import { AnyTask, PlayableTaskType, SectionId, TopicId } from '../domain/types';
import { getSectionByTopic } from '../domain/sections';
import { getCoreUserId } from './http';
import { BOSS_TASK_COUNT } from '../domain/progression';
import { BOSS_TASKS } from '../data/bossTasks';
import { shuffleBySeed } from '../engine/shuffle';
import { CORE_URL, fetchWithTimeout, setCoreStatus } from './status';

export interface SelectTrainRequest {
  count: number;
  sectionId?: SectionId;
  /** Ограничить выборку списком разделов (например, только открытыми). */
  sectionIds?: SectionId[];
  topicId?: TopicId;
  type?: PlayableTaskType;
  /** Исключить типы, например карточки из практики по теме. */
  excludeTypes?: AnyTask['type'][];
  /** Для детерминированных тестов. */
  seed?: string;
}

/** Помечает задачи так, как это делал бы Core. */
export const decorateTask = (task: AnyTask, progress: PracticeProgress): AnyTask => {
  const stat = progress.taskStats[task.id];
  return {
    ...task,
    isNew: !stat,
    isHard: task.difficulty === 3 || (stat ? stat.bestScore < 0.7 : false),
  };
};

const matches = (
  task: AnyTask,
  request: SelectTrainRequest,
): boolean => {
  if (request.type && task.type !== request.type) return false;
  if (request.excludeTypes?.includes(task.type)) return false;
  if (request.topicId && task.topic !== request.topicId) return false;
  if (request.sectionId && getSectionByTopic(task.topic)?.id !== request.sectionId) return false;
  if (request.sectionIds) {
    const sectionId = getSectionByTopic(task.topic)?.id;
    if (!sectionId || !request.sectionIds.includes(sectionId)) return false;
  }
  return true;
};

/**
 * Локальная реализация v2/select/train.
 * Старается дать задачи на разные темы: сначала по одной задаче с темы,
 * затем добирает остаток из общего пула.
 */
export const selectTrain = (
  request: SelectTrainRequest,
  progress: PracticeProgress,
): AnyTask[] => {
  const seed = request.seed ?? String(Date.now());
  const candidates = TASK_BANK.filter(task => matches(task, request)).map(task =>
    decorateTask(task, progress),
  );

  if (!candidates.length) return [];

  const byTopic = new Map<TopicId, AnyTask[]>();
  for (const task of candidates) {
    const list = byTopic.get(task.topic) ?? [];
    list.push(task);
    byTopic.set(task.topic, list);
  }

  const topics = shuffleBySeed([...byTopic.keys()], `${seed}:topics`);
  const queues = new Map<TopicId, AnyTask[]>();

  for (const topicId of topics) {
    const list = byTopic.get(topicId) ?? [];
    const preferred = list.filter(task => task.isNew || task.isHard);
    const rest = list.filter(task => !(task.isNew || task.isHard));
    queues.set(topicId, [
      ...shuffleBySeed(preferred, `${seed}:${topicId}:preferred`),
      ...shuffleBySeed(rest, `${seed}:${topicId}:rest`),
    ]);
  }

  const picked: AnyTask[] = [];
  let exhausted = false;

  while (picked.length < request.count && !exhausted) {
    exhausted = true;
    for (const topicId of topics) {
      if (picked.length >= request.count) break;
      const queue = queues.get(topicId);
      const next = queue?.shift();
      if (next) {
        picked.push(next);
        exhausted = false;
      }
    }
  }

  return picked;
};

/** Отдельные задачи дуэли: сложность растёт по ходу боя. */
export const selectBossTasks = (
  sectionId: SectionId,
  progress: PracticeProgress,
  count = BOSS_TASK_COUNT,
): AnyTask[] =>
  [...(BOSS_TASKS[sectionId] ?? [])]
    .sort((a, b) => a.difficulty - b.difficulty)
    .slice(0, count)
    .map(task => decorateTask(task, progress));


/**
 * v2/select/train from Intervallum-Core.
 * Falls back to the local selector when Core is unavailable.
 */
export const selectTrainRemote = async (
  request: SelectTrainRequest,
  progress: PracticeProgress,
): Promise<AnyTask[]> => {
  try {
    const response = await fetchWithTimeout(
      `${CORE_URL}/v2/select/train`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: getCoreUserId(),
          count: request.count,
          section_id: request.sectionId,
          topic_id: request.topicId,
          type: request.type,
          exclude_types: request.excludeTypes ?? [],
          seed: request.seed,
        }),
      },
      2500,
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = (await response.json()) as { tasks?: Array<{ id: string; isNew?: boolean; isHard?: boolean }> };
    setCoreStatus('online', 'подключён');
    const tasks: AnyTask[] = [];
    for (const row of payload.tasks ?? []) {
      const local = getTaskById(row.id);
      if (local) {
        tasks.push({ ...local, isNew: row.isNew, isHard: row.isHard });
      }
    }
    return tasks.length ? tasks : selectTrain(request, progress);
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'нет ответа';
    setCoreStatus('offline', `локальный режим · ${reason}`);
    return selectTrain(request, progress);
  }
};
