import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  acknowledgeStreakBreak,
  acknowledgeStreakCelebration,
  activeDaysCount,
  loadUserProgress,
  prepareStreakOnLaunch,
  recordTaskResult,
  resetUserProgress,
} from './progressStore';
import { resetTimeTravel, setArtificialDate } from '../dev/timeTravel';

const memory = new Map<string, string>();

const storage = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => memory.set(key, value),
  removeItem: (key: string) => memory.delete(key),
  clear: () => memory.clear(),
  key: (index: number) => [...memory.keys()][index] ?? null,
  get length() {
    return memory.size;
  },
};

const task = (taskId: string) => ({
  taskId,
  taskType: 'single',
  topicId: 'uniform-motion',
  sectionId: 'mechanics',
  xp: 10,
  score: 1,
});

describe('Daily Streak и ежедневная активность', () => {
  beforeEach(() => {
    memory.clear();
    vi.stubGlobal('localStorage', storage);
    vi.stubGlobal('window', {
      localStorage: storage,
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    resetTimeTravel();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('считает первый активный день и задания за день', () => {
    setArtificialDate('2026-11-08');
    recordTaskResult(task('task-1'));

    const data = loadUserProgress();
    expect(data.activity.counts['2026-11-08']).toBe(1);
    expect(data.activity.currentStreak).toBe(1);
    expect(data.activity.bestStreak).toBe(1);
    expect(data.activity.pendingCelebrationDate).toBe('2026-11-08');
  });

  it('не увеличивает серию повторно в один день', () => {
    setArtificialDate('2026-11-08');
    recordTaskResult(task('task-1'));
    recordTaskResult(task('task-2'));

    const data = loadUserProgress();
    expect(data.activity.counts['2026-11-08']).toBe(2);
    expect(data.activity.currentStreak).toBe(1);
    expect(activeDaysCount(data.activity)).toBe(1);
  });

  it('продолжает серию на следующий день', () => {
    setArtificialDate('2026-11-08');
    recordTaskResult(task('task-1'));
    setArtificialDate('2026-11-09');
    prepareStreakOnLaunch();
    expect(loadUserProgress().activity.pendingBreakDate).toBeNull();

    recordTaskResult(task('task-2'));
    const data = loadUserProgress();
    expect(data.activity.currentStreak).toBe(2);
    expect(data.activity.bestStreak).toBe(2);
    expect(activeDaysCount(data.activity)).toBe(2);
  });

  it('фиксирует потерю серии после пропуска дня', () => {
    setArtificialDate('2026-11-08');
    recordTaskResult(task('task-1'));
    setArtificialDate('2026-11-09');
    recordTaskResult(task('task-2'));
    setArtificialDate('2026-11-11');

    const prepared = prepareStreakOnLaunch();
    expect(prepared.activity.pendingBreakDate).toBe('2026-11-11');
    expect(prepared.activity.pendingBreakLostDays).toBe(2);
    expect(prepared.activity.currentStreak).toBe(0);
    expect(prepared.activity.bestStreak).toBe(2);

    acknowledgeStreakBreak();
    expect(loadUserProgress().activity.pendingBreakDate).toBeNull();
  });

  it('начинает новую серию после пропуска', () => {
    setArtificialDate('2026-11-08');
    recordTaskResult(task('task-1'));
    setArtificialDate('2026-11-10');
    prepareStreakOnLaunch();
    recordTaskResult(task('task-2'));

    const data = loadUserProgress();
    expect(data.activity.currentStreak).toBe(1);
    expect(data.activity.bestStreak).toBe(1);
    expect(data.activity.pendingBreakDate).toBeNull();
    expect(data.activity.pendingCelebrationDate).toBe('2026-11-10');
  });

  it('сбрасывает учебный прогресс, но не настройки', () => {
    setArtificialDate('2026-11-08');
    recordTaskResult(task('task-1'));
    acknowledgeStreakCelebration();
    resetUserProgress();

    const data = loadUserProgress();
    expect(data.practice.xpByTopic).toEqual({});
    expect(data.activity.counts).toEqual({});
    expect(data.activity.currentStreak).toBe(0);
    expect(data.settings.haptics).toBe(true);
  });
});
