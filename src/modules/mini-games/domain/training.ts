import {
  loadUserProgress,
  recordPracticeAttempt,
  saveUserProgress,
  type PracticeProgress,
} from '../../../shared/storage/progressStore';
import { TASK_BANK } from '../data';
import { BASE_XP } from '../engine/grading';
import { isTopicComplete, topicMaxXp, topicXp } from './progression';
import type { AnyTask, TopicId } from './types';

const DAY_MS = 86_400_000;
const GOOD_REVIEW_FACTOR = 1.8;
const MAX_REVIEW_INTERVAL_DAYS = 36500;

export interface TopicXpChange {
  topicId: TopicId;
  before: number;
  after: number;
  max: number;
}

export const isTheoryRead = (progress: PracticeProgress, topicId: TopicId): boolean =>
  Boolean(progress.readTopicIds?.includes(topicId)) ||
  topicXp(progress, topicId) > 0 ||
  TASK_BANK.some(task => task.topic === topicId && Boolean(progress.taskStats[task.id]?.attempts));

export const needsReview = (progress: PracticeProgress, topicId: TopicId, now: number): boolean =>
  isTopicComplete(progress, topicId) && (progress.reviewsByTopic?.[topicId]?.dueAt ?? 0) <= now;

export const nextTrainingReview = (progress: PracticeProgress, topics: TopicId[], now: number): number | undefined =>
  topics.reduce<number | undefined>((earliest, topic) => {
    const dueAt = progress.reviewsByTopic?.[topic]?.dueAt;
    return dueAt && dueAt > now && isTopicComplete(progress, topic)
      ? Math.min(earliest ?? dueAt, dueAt)
      : earliest;
  }, undefined);

export function applyTrainingResult(
  progress: PracticeProgress,
  task: AnyTask,
  score: number,
  now: number,
): TopicXpChange {
  const topicId = task.topic;
  const before = topicXp(progress, topicId);
  const max = topicMaxXp(topicId);
  const taskMaxXp = BASE_XP * task.difficulty;
  const previous = progress.taskStats[task.id];
  const wasMastered = Math.max(before, progress.peakXpByTopic?.[topicId] ?? 0) >= max;
  const legacyXp = progress.bestXpByTask[task.id] ?? Math.round((previous?.bestScore ?? 0) * taskMaxXp);
  const previousXp = previous?.creditedXp ?? (wasMastered ? taskMaxXp : Math.min(taskMaxXp, legacyXp));
  const stat = recordPracticeAttempt(progress, task.id, task.type, score, now);
  const creditedXp = Math.round((stat.lastScore ?? 0) * taskMaxXp);
  const after = Math.max(0, Math.min(max, before + creditedXp - previousXp));
  stat.creditedXp = creditedXp;

  (progress.readTopicIds ??= []);
  if (!progress.readTopicIds.includes(topicId)) progress.readTopicIds.push(topicId);
  progress.xpByTopic[topicId] = after;
  const peaks = progress.peakXpByTopic ??= {};
  peaks[topicId] = Math.max(peaks[topicId] ?? 0, before, after);

  const reviews = progress.reviewsByTopic ??= {};
  const review = reviews[topicId];
  if (after < max) {
    delete reviews[topicId];
  } else if (!review || review.dueAt <= now) {
    const intervalDays = Math.min(
      MAX_REVIEW_INTERVAL_DAYS,
      review ? review.intervalDays * GOOD_REVIEW_FACTOR : 1,
    );
    reviews[topicId] = { intervalDays, dueAt: now + intervalDays * DAY_MS };
  }

  return { topicId, before, after, max };
}

export function recordTrainingResult(task: AnyTask, score: number): TopicXpChange {
  const current = loadUserProgress();
  const change = applyTrainingResult(current.practice, task, score, Date.now());
  saveUserProgress(current);
  return change;
}
