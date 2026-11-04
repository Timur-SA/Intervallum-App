import { describe, expect, it } from 'vitest';
import { PracticeProgress } from '../../../shared/storage/progressStore';
import { selectBossTasks, selectTrain } from './select';
import { getSectionByTopic } from '../domain/sections';
import { BOSS_TASKS } from '../domain/progression';

const makeProgress = (overrides: Partial<PracticeProgress> = {}): PracticeProgress => ({
  xpByTopic: {},
  exploredTypes: [],
  bestScoreByType: {},
  taskStats: {},
  stars: 0,
  starsBySection: {},
  defeatedBosses: [],
  unlockedSections: [],
  items: [],
  ...overrides,
});

describe('selectTrain', () => {
  it('возвращает запрошенное количество задач', () => {
    const tasks = selectTrain({ count: 5, seed: 'seed' }, makeProgress());
    expect(tasks).toHaveLength(5);
  });

  it('не повторяет задачи', () => {
    const tasks = selectTrain({ count: 8, seed: 'seed' }, makeProgress());
    const ids = tasks.map(task => task.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('берёт задачи с разных тем', () => {
    const tasks = selectTrain({ count: 5, seed: 'seed' }, makeProgress());
    const topics = tasks.map(task => task.topic);
    expect(new Set(topics).size).toBe(topics.length);
  });

  it('фильтрует по типу', () => {
    const tasks = selectTrain({ count: 4, type: 'multi', seed: 'seed' }, makeProgress());
    expect(tasks.every(task => task.type === 'multi')).toBe(true);
  });

  it('исключает указанные типы', () => {
    const tasks = selectTrain(
      { count: 5, topicId: 'heat-amount', excludeTypes: ['cards'], seed: 'seed' },
      makeProgress(),
    );
    expect(tasks.every(task => task.type !== 'cards')).toBe(true);
  });

  it('помечает новые и сложные задачи', () => {
    const progress = makeProgress({
      taskStats: { 'single-uniform-motion': { attempts: 3, bestScore: 1 } },
    });
    const tasks = selectTrain({ count: 19, type: 'single', seed: 'seed' }, progress);

    const seen = tasks.find(task => task.id === 'single-uniform-motion');
    expect(seen?.isNew).toBe(false);

    const fresh = tasks.find(task => task.id === 'single-coulomb');
    expect(fresh?.isNew).toBe(true);

    const hard = tasks.find(task => task.difficulty === 3);
    expect(hard?.isHard).toBe(true);
  });

  it('возвращает пустой массив, если задач нет', () => {
    const tasks = selectTrain({ count: 5, topicId: 'coulomb', type: 'single', seed: 's' }, makeProgress());
    expect(tasks.length).toBeLessThanOrEqual(1);
  });
});

describe('selectBossTasks', () => {
  it('даёт ровно 10 задач раздела', () => {
    for (const sectionId of ['mechanics', 'thermal', 'electromagnetism'] as const) {
      const tasks = selectBossTasks(sectionId, makeProgress());
      expect(tasks).toHaveLength(BOSS_TASKS);
      expect(tasks.every(task => getSectionByTopic(task.topic)?.id === sectionId)).toBe(true);
      expect(tasks.every(task => task.type !== 'cards')).toBe(true);
    }
  });

  it('ставит самые сложные задачи первыми', () => {
    const tasks = selectBossTasks('mechanics', makeProgress());
    for (let i = 1; i < tasks.length; i += 1) {
      expect(tasks[i - 1].difficulty).toBeGreaterThanOrEqual(tasks[i].difficulty);
    }
  });
});
