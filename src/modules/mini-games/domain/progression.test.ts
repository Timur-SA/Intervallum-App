import { describe, expect, it } from 'vitest';
import { PracticeProgress } from '../../../shared/storage/progressStore';
import {
  bossXpRequired,
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

  it('босс открывается, когда все темы добрали порог опыта', () => {
    const section = getSection('thermal')!;
    const xpByTopic: Record<string, number> = {};
    for (const topicId of section.topics) {
      xpByTopic[topicId] = bossXpRequired(topicId);
    }

    const progress = makeProgress({ unlockedSections: ['thermal'], xpByTopic });
    expect(isBossReady(progress, 'thermal')).toBe(true);

    const almost = makeProgress({
      unlockedSections: ['thermal'],
      xpByTopic: { ...xpByTopic, [section.topics[0]]: bossXpRequired(section.topics[0]) - 1 },
    });
    expect(isBossReady(almost, 'thermal')).toBe(false);
  });

  it('побеждённый босс больше не открывается', () => {
    const section = getSection('mechanics')!;
    const xpByTopic: Record<string, number> = {};
    for (const topicId of section.topics) xpByTopic[topicId] = bossXpRequired(topicId);

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

  it('первые две темы открыты сразу', () => {
    const progress = makeProgress();
    const section = getSection('mechanics')!;
    expect(isTopicUnlocked(progress, 'mechanics', section.topics[0])).toBe(true);
    expect(isTopicUnlocked(progress, 'mechanics', section.topics[1])).toBe(true);
    expect(openTopicsCount(progress, 'mechanics')).toBe(2);
  });

  it('следующая тема открывается по опыту предыдущей', () => {
    const section = getSection('mechanics')!;
    const previous = section.topics[1];
    const next = section.topics[2];
    const required = bossXpRequired(previous);

    expect(
      isTopicUnlocked(makeProgress({ xpByTopic: { [previous]: required - 1 } }), 'mechanics', next),
    ).toBe(false);
    expect(
      isTopicUnlocked(makeProgress({ xpByTopic: { [previous]: required } }), 'mechanics', next),
    ).toBe(true);
  });
});
