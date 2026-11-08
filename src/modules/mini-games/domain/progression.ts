import { PracticeProgress } from '../../../shared/storage/progressStore';
import { TASK_BANK } from '../data';
import { SECTIONS, getSection } from './sections';
import { SectionId, TopicId } from './types';

/** Максимум опыта темы — сумма опыта всех её заданий, включая карточки. */
export const topicMaxXp = (topicId: TopicId): number =>
  TASK_BANK.filter(task => task.topic === topicId).reduce(
    (sum, task) => sum + 10 * task.difficulty,
    0,
  );

/** Опыт ограничен шкалой темы, в том числе для старых сохранений. */
export const topicXp = (progress: PracticeProgress, topicId: TopicId): number =>
  Math.max(0, Math.min(topicMaxXp(topicId), progress.xpByTopic[topicId] ?? 0));

export const topicMastery = (progress: PracticeProgress, topicId: TopicId): number => {
  const max = topicMaxXp(topicId);
  return max > 0 ? Math.floor(100 * topicXp(progress, topicId) / max) : 0;
};

export const isTopicComplete = (progress: PracticeProgress, topicId: TopicId): boolean =>
  topicMastery(progress, topicId) === 100;

/** Уровень считается «достаточно пройденным» с 80% своего опыта. */
export const topicUnlockXp = (topicId: TopicId): number =>
  Math.ceil(topicMaxXp(topicId) * 0.8);

/** Босс открывается после полного освоения всех тем раздела. */
export const bossXpRequired = (sectionId: SectionId): number => {
  const section = getSection(sectionId);
  if (!section) return 0;
  return section.topics.reduce((sum, topicId) => sum + topicMaxXp(topicId), 0);
};

export const isBossReady = (progress: PracticeProgress, sectionId: SectionId): boolean => {
  if (!isSectionUnlocked(progress, sectionId)) return false;
  if (isSectionDefeated(progress, sectionId)) return false;
  return getSection(sectionId)?.topics.every(topic => isTopicComplete(progress, topic)) ?? false;
};

/** Тренировка: 5–10 задач из спеки. */
export const TRAINING_TASKS = 7;

/** Дуэль с боссом. */
export const BOSS_TASK_COUNT = 20;
export const BOSS_TIME_SECONDS = 10 * 60;
export const BOSS_WIN_SCORE = 17;

export const sectionXp = (progress: PracticeProgress, sectionId: SectionId): number => {
  const section = getSection(sectionId);
  if (!section) return 0;
  return section.topics.reduce((sum, topicId) => sum + topicXp(progress, topicId), 0);
};

export const isSectionUnlocked = (
  progress: PracticeProgress,
  sectionId: SectionId,
): boolean => {
  const index = SECTIONS.findIndex(section => section.id === sectionId);
  if (index <= 0) return true;
  return progress.unlockedSections.includes(sectionId);
};

export const isSectionDefeated = (
  progress: PracticeProgress,
  sectionId: SectionId,
): boolean => progress.defeatedBosses.includes(sectionId);

export const isTopicUnlocked = (
  progress: PracticeProgress,
  sectionId: SectionId,
  topicId: TopicId,
): boolean => {
  const section = getSection(sectionId);
  if (!section) return false;
  if (!isSectionUnlocked(progress, sectionId)) return false;

  const index = section.topics.indexOf(topicId);
  if (index < 0) return false;
  if (index === 0 || progress.readTopicIds?.includes(topicId) || topicXp(progress, topicId) > 0) {
    return true;
  }

  const previousTopic = section.topics[index - 1];
  const previousPeak = Math.max(
    progress.xpByTopic[previousTopic] ?? 0,
    progress.peakXpByTopic?.[previousTopic] ?? 0,
  );
  return previousPeak >= topicUnlockXp(previousTopic);
};

export const openTopicsCount = (
  progress: PracticeProgress,
  sectionId: SectionId,
): number => {
  const section = getSection(sectionId);
  if (!section) return 0;
  return section.topics.filter(topicId => isTopicUnlocked(progress, sectionId, topicId)).length;
};

/** Первый ещё не открытый раздел — его предлагаем после победы над боссом. */
export const nextLockedSection = (
  progress: PracticeProgress,
): SectionId | null =>
  (SECTIONS.find(
    section => !isSectionUnlocked(progress, section.id) && section.id !== 'mechanics',
  )?.id as SectionId | undefined) ?? null;
