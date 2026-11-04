import { PracticeProgress } from '../../../shared/storage/progressStore';
import { TASK_BANK } from '../data';
import { AnyTask, PlayableTaskType, SectionId, TopicId } from '../domain/types';
import { getSectionByTopic } from '../domain/sections';
import { BOSS_TASKS } from '../domain/progression';
import { shuffleBySeed } from '../engine/shuffle';

export interface SelectTrainRequest {
  count: number;
  sectionId?: SectionId;
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

/** Самые сложные задачи раздела для дуэли с боссом. */
export const selectBossTasks = (
  sectionId: SectionId,
  progress: PracticeProgress,
  count = BOSS_TASKS,
): AnyTask[] => {
  const candidates = TASK_BANK.filter(
    task => getSectionByTopic(task.topic)?.id === sectionId && task.type !== 'cards',
  ).map(task => decorateTask(task, progress));

  if (!candidates.length) return [];

  const sorted = [...candidates].sort((a, b) => {
    if (b.difficulty !== a.difficulty) return b.difficulty - a.difficulty;

    const aScore = progress.taskStats[a.id]?.bestScore ?? -1;
    const bScore = progress.taskStats[b.id]?.bestScore ?? -1;
    if (aScore !== bScore) return aScore - bScore;

    return a.id.localeCompare(b.id);
  });

  if (sorted.length >= count) return sorted.slice(0, count);

  // Если задач меньше, чем нужно, добираем повторами самого сложного пула.
  const result = [...sorted];
  let index = 0;
  while (result.length < count) {
    result.push(sorted[index % sorted.length]);
    index += 1;
  }
  return result;
};
