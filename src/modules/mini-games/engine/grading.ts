import { CardGrade, Difficulty, Outcome } from '../domain/types';

/** Базовая награда за полностью верное задание первой сложности. */
export const BASE_XP = 10;

/**
 * Доля засчитанного ответа для задания с одним верным вариантом.
 * По Core — бинарная оценка.
 */
export const gradeSingle = (selected: string | null, correct: string): number =>
  selected === correct ? 1 : 0;

/**
 * Доля засчитанного ответа для множественного выбора.
 * По Core штрафуются и пропущенные верные (FN), и лишние неверные (FP):
 * score = max(0, 1 − (FN + FP) / число верных вариантов).
 */
export const gradeMulti = (selected: string[], correct: string[]): number => {
  const correctSet = new Set(correct);
  const selectedSet = new Set(selected);

  if (correctSet.size === 0) return 0;

  let missed = 0;
  let extra = 0;

  for (const id of correctSet) {
    if (!selectedSet.has(id)) missed += 1;
  }
  for (const id of selectedSet) {
    if (!correctSet.has(id)) extra += 1;
  }

  return Math.max(0, 1 - (missed + extra) / correctSet.size);
};

/**
 * Доля засчитанного ответа для соответствия.
 * По Core — штраф за каждую неверную пару.
 */
export const gradeMatching = (wrongPairs: number, totalPairs: number): number => {
  if (totalPairs <= 0) return 0;
  const wrong = Math.max(0, Math.min(wrongPairs, totalPairs));
  return Math.max(0, 1 - wrong / totalPairs);
};

// Значения API исторические: 1 — легко, 2 — нормально, 3 — с трудом.
const CARD_SCORES: Record<CardGrade, number> = { 0: 0, 1: 1, 2: 2 / 3, 3: 1 / 3 };

export const cardScore = (grade: CardGrade): number => CARD_SCORES[grade];

export const outcomeFromScore = (score: number): Outcome => {
  if (score >= 1) return 'correct';
  if (score > 0) return 'partial';
  return 'wrong';
};

/** Опыт за задание: доля ответа × база × сложность. */
export const xpForScore = (score: number, difficulty: Difficulty): number =>
  Math.round(score * BASE_XP * difficulty);
