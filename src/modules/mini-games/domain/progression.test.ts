import { describe, expect, it } from 'vitest';
import { PracticeProgress } from '../../../shared/storage/progressStore';
import {
  bossStarsRequired,
  sectionMaxStars,
  isBossReady,
  isSectionDefeated,
  isSectionUnlocked,
  isTopicUnlocked,
  openTopicsCount,
  sectionStars,
  sectionXp,
  TOPIC_XP_THRESHOLD,
} from './progression';

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

  it('босс открывается по звёздам раздела', () => {
    const required = bossStarsRequired('thermal');
    const almost = makeProgress({
      unlockedSections: ['thermal'],
      starsBySection: { thermal: required - 1 },
    });
    expect(isBossReady(almost, 'thermal')).toBe(false);

    const ready = makeProgress({
      unlockedSections: ['thermal'],
      starsBySection: { thermal: required },
    });
    expect(isBossReady(ready, 'thermal')).toBe(true);
  });

  it('порог босса требует почти весь раздел', () => {
    for (const sectionId of ['mechanics', 'thermal', 'electromagnetism'] as const) {
      const max = sectionMaxStars(sectionId);
      expect(max).toBeGreaterThan(0);
      expect(bossStarsRequired(sectionId)).toBeGreaterThanOrEqual(Math.ceil(max * 0.7));
    }
  });

  it('побеждённый босс больше не открывается', () => {
    const defeated = makeProgress({
      starsBySection: { mechanics: bossStarsRequired('mechanics') },
      defeatedBosses: ['mechanics'],
    });
    expect(isBossReady(defeated, 'mechanics')).toBe(false);
    expect(isSectionDefeated(defeated, 'mechanics')).toBe(true);
  });

  it('считает звёзды и опыт раздела', () => {
    const progress = makeProgress({
      starsBySection: { mechanics: 4 },
      xpByTopic: { 'uniform-motion': 10, momentum: 20, ohm: 100 },
    });
    expect(sectionStars(progress, 'mechanics')).toBe(4);
    expect(sectionXp(progress, 'mechanics')).toBe(30);
  });
});

describe('темы', () => {
  it('первые две темы открыты сразу', () => {
    const progress = makeProgress();
    expect(isTopicUnlocked(progress, 'mechanics', 'uniform-motion')).toBe(true);
    expect(isTopicUnlocked(progress, 'mechanics', 'relativity')).toBe(true);
    expect(openTopicsCount(progress, 'mechanics')).toBe(2);
  });

  it('третья тема открывается по порогу опыта предыдущей', () => {
    const before = makeProgress({ xpByTopic: { relativity: TOPIC_XP_THRESHOLD - 1 } });
    expect(isTopicUnlocked(before, 'mechanics', 'accelerated-motion')).toBe(false);

    const after = makeProgress({ xpByTopic: { relativity: TOPIC_XP_THRESHOLD } });
    expect(isTopicUnlocked(after, 'mechanics', 'accelerated-motion')).toBe(true);
  });

  it('в закрытом разделе темы закрыты', () => {
    expect(isTopicUnlocked(makeProgress(), 'thermal', 'heat-amount')).toBe(false);
  });
});
