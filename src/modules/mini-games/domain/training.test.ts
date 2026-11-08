import { describe, expect, it, vi } from 'vitest';
import type { PracticeProgress } from '../../../shared/storage/progressStore';
import { availableTrainingTopics, selectPersonalTraining } from '../api/personalTraining';
import { TASK_BANK } from '../data';
import { isTopicUnlocked, topicMastery, topicMaxXp } from './progression';
import { applyTrainingResult, needsReview } from './training';

const first = 'uniform-motion';
const next = 'relativity';
const firstTasks = TASK_BANK.filter(task => task.topic === first);
const day = 86_400_000;
const localRank = async () => [];
const fresh = (extra: Partial<PracticeProgress> = {}): PracticeProgress => ({
  xpByTopic: {}, taskStats: {}, bestXpByTask: {}, exploredTypes: [],
  bestScoreByType: {}, defeatedBosses: [], unlockedSections: [], items: [],
  ...extra,
});

const masterFirst = (progress: PracticeProgress, now = 0) => {
  for (const task of firstTasks) applyTrainingResult(progress, task, 1, now);
};

describe('персональная тренировка', () => {
  it('открытие кружка не добавляет задачи до прочтения теории', async () => {
    const progress = fresh({ xpByTopic: { [first]: topicMaxXp(first) } });
    expect(isTopicUnlocked(progress, 'mechanics', next)).toBe(true);
    const rank = vi.fn(async () => []);
    const tasks = await selectPersonalTraining(progress, day, rank);
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks.every(task => task.topic === first)).toBe(true);
    expect(rank).toHaveBeenCalledTimes(1);
    expect(rank.mock.calls[0]).toEqual([first, String(day)]);
    expect(await selectPersonalTraining(fresh(), day, localRank)).toEqual([]);
  });

  it('после 100% откладывает тему и удлиняет интервал после повторения', async () => {
    const progress = fresh({ readTopicIds: [first] });
    masterFirst(progress);
    expect(topicMastery(progress, first)).toBe(100);
    expect(await selectPersonalTraining(progress, day - 1, localRank)).toEqual([]);
    expect(await selectPersonalTraining(progress, day, localRank)).toHaveLength(firstTasks.length);
    applyTrainingResult(progress, firstTasks[0], 1, day);
    applyTrainingResult(progress, firstTasks[1], 1, day);
    expect(progress.reviewsByTopic?.[first]).toEqual({ dueAt: day + 1.8 * day, intervalDays: 1.8 });
    expect(needsReview(progress, first, day + 1.8 * day)).toBe(true);
  });

  it('ошибка снимает ранее заработанный XP и не закрывает следующую тему', () => {
    const progress = fresh();
    masterFirst(progress);
    const task = firstTasks.find(item => item.difficulty > 1)!;
    const max = topicMaxXp(first);
    const failed = applyTrainingResult(progress, task, 0, day);
    expect(failed).toEqual({ topicId: first, before: max, after: max - 10 * task.difficulty, max });
    expect(progress.reviewsByTopic?.[first]).toBeUndefined();
    expect(availableTrainingTopics(progress, day)).toEqual([first]);
    expect(isTopicUnlocked(progress, 'mechanics', next)).toBe(true);
    expect(applyTrainingResult(progress, task, 1, day).after).toBe(max);
  });

  it('сохраняет исторический XP и не начисляет его повторно за ту же попытку', () => {
    const task = firstTasks[0];
    const progress = fresh({
      xpByTopic: { [first]: 10 * task.difficulty },
      bestXpByTask: { [task.id]: 10 * task.difficulty },
    });
    const retry = applyTrainingResult(progress, task, 1, day);
    expect(retry.after).toBe(retry.before);
    expect(applyTrainingResult(progress, task, 0, day).after).toBe(0);
    expect(applyTrainingResult(progress, task, 0, day).after).toBe(0);
  });

  it('выбирает новые задачи и просроченное повторение, сверяя идентификаторы Core с банком', async () => {
    const progress = fresh({ readTopicIds: [first, next] });
    masterFirst(progress);
    const nextTasks = TASK_BANK.filter(task => task.topic === next);
    const ranked = nextTasks.at(-1)!;
    const rank = async (topic: string) => topic === next ? ['unknown-core-task', ranked.id] : [];
    const tasks = await selectPersonalTraining(progress, day, rank);
    expect(tasks[0].id).toBe(ranked.id);
    expect(tasks.map(task => task.topic)).toContain(first);
    expect(tasks.map(task => task.topic)).toContain(next);
    expect(tasks.length).toBeLessThanOrEqual(7);
    expect(new Set(tasks.map(task => task.id)).size).toBe(tasks.length);
    expect(tasks.some(task => task.id === 'unknown-core-task')).toBe(false);
  });
});
