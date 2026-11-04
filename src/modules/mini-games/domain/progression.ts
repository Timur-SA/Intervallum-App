import { PracticeProgress } from '../../../shared/storage/progressStore';
import { TASK_BANK } from '../data';
import { SECTIONS, getSection, getSectionByTopic } from './sections';
import { SectionId, TopicId } from './types';

/**
 * Максимум звёзд раздела: по одной за каждую практическую задачу
 * и ещё по одной за задачи повышенной сложности.
 */
export const sectionMaxStars = (sectionId: SectionId): number =>
  TASK_BANK.filter(
    task => task.type !== 'cards' && getSectionByTopic(task.topic)?.id === sectionId,
  ).reduce((sum, task) => sum + (task.difficulty === 3 ? 2 : 1), 0);

/** Чтобы открыть босса, нужно пройти почти весь раздел — 75% звёзд. */
export const bossStarsRequired = (sectionId: SectionId): number =>
  Math.max(1, Math.ceil(sectionMaxStars(sectionId) * 0.75));

/** Порог опыта на предыдущей теме, чтобы открыть следующую. */
export const TOPIC_XP_THRESHOLD = 20;

/** Тренировка: 5–10 задач из спеки. */
export const TRAINING_TASKS = 7;

/** Дуэль с боссом. */
export const BOSS_TASKS = 10;
export const BOSS_TIME_SECONDS = 6 * 60;
export const BOSS_WIN_SCORE = 9;

export const sectionStars = (progress: PracticeProgress, sectionId: SectionId): number =>
  progress.starsBySection[sectionId] ?? 0;

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

export const isBossReady = (progress: PracticeProgress, sectionId: SectionId): boolean =>
  isSectionUnlocked(progress, sectionId) &&
  !isSectionDefeated(progress, sectionId) &&
  sectionStars(progress, sectionId) >= bossStarsRequired(sectionId);

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
  return (progress.xpByTopic[previousTopic] ?? 0) >= TOPIC_XP_THRESHOLD;
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
