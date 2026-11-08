import { describe, expect, it } from 'vitest';
import { PracticeProgress } from '../../../shared/storage/progressStore';
import { TASK_BANK } from '../data';
import {
  bossXpRequired,
  topicUnlockXp,
  isBossReady,
  isSectionDefeated,
  isSectionUnlocked,
  isTopicComplete,
  isTopicUnlocked,
  openTopicsCount,
  sectionXp,
  topicMaxXp,
} from './progression';
import { getSection } from './sections';

const makeProgress = (overrides: Partial<PracticeProgress> = {}): PracticeProgress => ({
  xpByTopic: {},
  exploredTypes: [],
  bestScoreByType: {},
  taskStats: {},
  bestXpByTask: {},
  defeatedBosses: [],
  unlockedSections: [],
  items: [],
  ...overrides,
});

describe('разделы', () => {
  it('первый раздел открыт всегда', () => {
    expect(isSectionUnlocked(makeProgress(), 'mechanics')).toBe(true);
  });

  it('остальные разделы закрыты до победы над боссом', () => {
    expect(isSectionUnlocked(makeProgress(), 'thermal')).toBe(false);
    expect(
      isSectionUnlocked(makeProgress({ unlockedSections: ['thermal'] }), 'thermal'),
    ).toBe(true);
  });

  it('босс открывается только при 100% по каждой теме', () => {
    const section = getSection('thermal')!;
    const xpByTopic = Object.fromEntries(section.topics.map(topic => [topic, topicMaxXp(topic)]));
    const unlockedSections = ['thermal'];
    expect(isBossReady(makeProgress({ unlockedSections, xpByTopic }), 'thermal')).toBe(true);

    const [first, second] = section.topics;
    const unbalanced = { ...xpByTopic, [first]: xpByTopic[first] - 1, [second]: xpByTopic[second] + 100 };
    expect(isBossReady(makeProgress({ unlockedSections, xpByTopic: unbalanced }), 'thermal')).toBe(false);
  });

  it('побеждённый босс больше не открывается', () => {
    const section = getSection('mechanics')!;
    const xpByTopic: Record<string, number> = {};
    for (const topicId of section.topics) xpByTopic[topicId] = topicUnlockXp(topicId);

    const defeated = makeProgress({ xpByTopic, defeatedBosses: ['mechanics'] });
    expect(isBossReady(defeated, 'mechanics')).toBe(false);
    expect(isSectionDefeated(defeated, 'mechanics')).toBe(true);
  });

  it('считает опыт раздела', () => {
    const progress = makeProgress({
      xpByTopic: { 'uniform-motion': 10, momentum: 20, ohm: 100 },
    });
    expect(sectionXp(progress, 'mechanics')).toBe(30);
  });
});

describe('темы', () => {
  it('максимум опыта темы положительный', () => {
    for (const topicId of getSection('mechanics')!.topics) {
      expect(topicMaxXp(topicId)).toBeGreaterThan(0);
    }
  });

  it('уровень считается пройденным на 100% опыта', () => {
    const max = topicMaxXp('uniform-motion');
    expect(isTopicComplete(makeProgress({ xpByTopic: { 'uniform-motion': max - 1 } }), 'uniform-motion')).toBe(false);
    expect(isTopicComplete(makeProgress({ xpByTopic: { 'uniform-motion': max } }), 'uniform-motion')).toBe(true);
  });

  it('максимум темы включает опыт карточек', () => {
    const topic = 'uniform-motion';
    const cards = TASK_BANK.filter(task => task.topic === topic && task.type === 'cards');
    const practice = TASK_BANK.filter(task => task.topic === topic && task.type !== 'cards');

    expect(cards.length).toBeGreaterThan(0);
    expect(topicMaxXp(topic)).toBe(
      [...practice, ...cards].reduce((sum, task) => sum + 10 * task.difficulty, 0),
    );
  });

  it('сразу открыта только первая тема', () => {
    const progress = makeProgress();
    const section = getSection('mechanics')!;
    expect(isTopicUnlocked(progress, 'mechanics', section.topics[0])).toBe(true);
    expect(isTopicUnlocked(progress, 'mechanics', section.topics[1])).toBe(false);
    expect(openTopicsCount(progress, 'mechanics')).toBe(1);
  });

  it('следующая тема открывается по опыту предыдущей', () => {
    const section = getSection('mechanics')!;
    const previous = section.topics[0];
    const next = section.topics[1];
    const required = topicUnlockXp(previous);

    expect(
      isTopicUnlocked(makeProgress({ xpByTopic: { [previous]: required - 1 } }), 'mechanics', next),
    ).toBe(false);
    expect(
      isTopicUnlocked(makeProgress({ xpByTopic: { [previous]: required } }), 'mechanics', next),
    ).toBe(true);
  });
});
