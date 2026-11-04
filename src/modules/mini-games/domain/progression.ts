import { PracticeProgress } from '../../../shared/storage/progressStore';
import { TASK_BANK } from '../data';
import { SECTIONS, getSection } from './sections';
import { SectionId, TopicId } from './types';

/** Максимум опыта темы — сумма опыта всех её заданий. */
export const topicMaxXp = (topicId: TopicId): number =>
  TASK_BANK.filter(task => task.topic === topicId).reduce(
    (sum, task) => sum + 10 * task.difficulty,
    0,
  );

/** Полностью пройденный уровень — 100% опыта темы. */
export const isTopicComplete = (progress: PracticeProgress, topicId: TopicId): boolean =>
  (progress.xpByTopic[topicId] ?? 0) >= topicMaxXp(topicId);

/** Для босса достаточно 75% опыта на каждом уровне раздела. */
export const bossXpRequired = (topicId: TopicId): number =>
  Math.ceil(topicMaxXp(topicId) * 0.75);

export const isBossReady = (progress: PracticeProgress, sectionId: SectionId): boolean => {
  const section = getSection(sectionId);
  if (!section || !isSectionUnlocked(progress, sectionId)) return false;
  if (isSectionDefeated(progress, sectionId)) return false;
  return section.topics.every(
    topicId => (progress.xpByTopic[topicId] ?? 0) >= bossXpRequired(topicId),
  );
};

/** Следующий уровень открывается, когда предыдущий добрал до порога босса. */

/** Тренировка: 5–10 задач из спеки. */
export const TRAINING_TASKS = 7;

/** Дуэль с боссом. */
export const BOSS_TASKS = 20;
export const BOSS_TIME_SECONDS = 10 * 60;
export const BOSS_WIN_SCORE = 17;

export const sectionXp = (progress: PracticeProgress, sectionId: SectionId): number => {
  const section = getSection(sectionId);
  if (!section) return 0;
  return section.topics.reduce((sum, topicId) => sum + (progress.xpByTopic[topicId] ?? 0), 0);
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
  if (index <= 1) return true;

  const previousTopic = section.topics[index - 1];
  return (progress.xpByTopic[previousTopic] ?? 0) >= bossXpRequired(previousTopic);
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
