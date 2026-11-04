import { SECTIONS } from '../../modules/mini-games/domain/sections';
import {
  isSectionDefeated,
  isSectionUnlocked,
  topicMaxXp,
} from '../../modules/mini-games/domain/progression';
import { PracticeProgress } from '../storage/progressStore';

const currentSection = (practice: PracticeProgress) =>
  SECTIONS.find(
    section => isSectionUnlocked(practice, section.id) && !isSectionDefeated(practice, section.id),
  ) ?? SECTIONS[SECTIONS.length - 1];

export const completeCurrentLevel = (practice: PracticeProgress): void => {
  const section = currentSection(practice);
  const topicId =
    section.topics.find(topic => (practice.xpByTopic[topic] ?? 0) < topicMaxXp(topic)) ??
    section.topics[section.topics.length - 1];
  practice.xpByTopic[topicId] = topicMaxXp(topicId);
};

export const completeCurrentSection = (practice: PracticeProgress): void => {
  const section = currentSection(practice);
  for (const topic of section.topics) {
    practice.xpByTopic[topic] = topicMaxXp(topic);
  }
};

export const currentSectionId = (practice: PracticeProgress) => currentSection(practice).id;
