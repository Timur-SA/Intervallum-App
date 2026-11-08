import { PracticeProgress, completedTasksCount } from '../storage/progressStore';

export type BadgeId = 'first-step' | 'mechanic';

export interface BadgeDefinition {
  id: BadgeId;
  title: string;
  description: string;
  icon: 'star' | 'gear';
  tone: 'sky' | 'amber';
}

export const BADGES: BadgeDefinition[] = [
  {
    id: 'first-step',
    title: 'Первый шаг',
    description:
      'За первое выполненное задание. С него начинается путь к уверенной физике.',
    icon: 'star',
    tone: 'sky',
  },
  {
    id: 'mechanic',
    title: 'Покоритель механики',
    description:
      'За победу над Ньютоном и завершение раздела «Механика». Медаль за настоящую дуэль.',
    icon: 'gear',
    tone: 'amber',
  },
];

export const getBadge = (id: string | null): BadgeDefinition | null =>
  BADGES.find(badge => badge.id === id) ?? null;

export const isBadgeUnlocked = (
  badgeId: BadgeId,
  progress: PracticeProgress,
): boolean => {
  if (badgeId === 'first-step') {
    return completedTasksCount(progress) > 0;
  }

  return progress.defeatedBosses.includes('mechanics');
};

export const unlockedBadgeCount = (progress: PracticeProgress): number =>
  BADGES.filter(badge => isBadgeUnlocked(badge.id, progress)).length;
