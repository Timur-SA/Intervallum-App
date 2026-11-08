import type { PracticeProgress } from '../../../shared/storage/progressStore';
import { isSectionUnlocked, isTopicComplete, isTopicUnlocked, topicMastery, TRAINING_TASKS } from '../domain/progression';
import { getSection } from '../domain/sections';
import { isTheoryRead, needsReview } from '../domain/training';
import type { AnyTask, SectionId, TopicId } from '../domain/types';
import { selectTrain } from './select';

type RankedIds = (topic: TopicId, seed: string) => Promise<string[]>;
const CORE_USER_KEY = 'intervallum:coreUserId';

export const trainingTopics = (progress: PracticeProgress): TopicId[] =>
  [...new Set(['mechanics', ...progress.unlockedSections])]
    .map(section => getSection(section as SectionId))
    .flatMap(section => section && isSectionUnlocked(progress, section.id)
      ? section.topics.filter(topic => isTopicUnlocked(progress, section.id, topic) && isTheoryRead(progress, topic))
      : []);

export const availableTrainingTopics = (progress: PracticeProgress, now: number): TopicId[] =>
  trainingTopics(progress).filter(topic => !isTopicComplete(progress, topic) || needsReview(progress, topic, now));

async function rankWithCore(topic: TopicId, seed: string): Promise<string[]> {
  const coreUrl = import.meta.env.VITE_CORE_URL?.replace(/\/+$/, '');
  if (!coreUrl) return [];
  try {
    let userId = localStorage.getItem(CORE_USER_KEY);
    if (!userId) {
      userId = crypto.randomUUID();
      localStorage.setItem(CORE_USER_KEY, userId);
    }
    const response = await fetch(`${coreUrl}/v2/select/train`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, topic_id: topic, seed, count: 50 }),
      signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data?.tasks)
      ? data.tasks.flatMap((task: { id?: unknown } | null) => typeof task?.id === 'string' ? [task.id] : [])
      : [];
  } catch {
    return [];
  }
}

export async function selectPersonalTraining(
  progress: PracticeProgress,
  now = Date.now(),
  rankIds: RankedIds = rankWithCore,
): Promise<AnyTask[]> {
  const seed = String(now);
  const eligible = availableTrainingTopics(progress, now);
  const due = eligible.filter(topic => needsReview(progress, topic, now)).sort((a, b) =>
    (progress.reviewsByTopic?.[a]?.dueAt ?? 0) - (progress.reviewsByTopic?.[b]?.dueAt ?? 0),
  );
  const learning = eligible.filter(topic => !isTopicComplete(progress, topic));
  const latest = learning.at(-1);
  const gaps = learning.filter(topic => topic !== latest)
    .sort((a, b) => topicMastery(progress, a) - topicMastery(progress, b));

  const queues = new Map(await Promise.all(eligible.map(async topic => {
    const ids = await rankIds(topic, seed);
    const remoteOrder = new Map(ids.map((id, index) => [id, index]));
    const tasks = selectTrain({ topicId: topic, seed, count: 50 }, progress);
    tasks.sort((a, b) => {
      const aStat = progress.taskStats[a.id];
      const bStat = progress.taskStats[b.id];
      if (isTopicComplete(progress, topic)) {
        const age = (aStat?.lastAttemptAt ?? 0) - (bStat?.lastAttemptAt ?? 0);
        if (age) return age;
      } else {
        const gap = (aStat?.lastScore ?? aStat?.bestScore ?? 0) - (bStat?.lastScore ?? bStat?.bestScore ?? 0);
        if (gap) return gap;
      }
      return (remoteOrder.get(a.id) ?? ids.length) - (remoteOrder.get(b.id) ?? ids.length);
    });
    return [topic, tasks] as const;
  })));

  const picked: AnyTask[] = [];
  const take = (topics: TopicId[], targetCount: number) => {
    while (picked.length < targetCount) {
      let added = false;
      for (const topic of topics) {
        if (picked.length >= targetCount) break;
        const task = queues.get(topic)?.shift();
        if (!task) continue;
        picked.push(task);
        added = true;
      }
      if (!added) break;
    }
  };

  // Core reserves about 40% for reviews when there is still new material to learn.
  const reviewQuota = Math.round(TRAINING_TASKS * 0.4);
  const dueCount = due.reduce((count, topic) => count + (queues.get(topic)?.length ?? 0), 0);
  if (latest) take([latest], TRAINING_TASKS - Math.min(reviewQuota, dueCount));
  take(due, latest ? Math.min(TRAINING_TASKS, picked.length + reviewQuota) : TRAINING_TASKS);
  take(gaps, TRAINING_TASKS);
  take(due, TRAINING_TASKS);
  return picked;
}
