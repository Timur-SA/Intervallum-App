export type MultiChoiceScore = 'full' | 'partial' | 'none';

/**
 * Звёзды за точность: 3 — от 90%, 2 — от 70%, 1 — при любом ненулевом результате.
 */
export const starsForRatio = (ratio: number): number => {
  if (!Number.isFinite(ratio) || ratio <= 0) return 0;
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.7) return 2;
  return 1;
};

export const starsForGame = (correct: number, total: number): number => {
  if (total <= 0) return 0;
  return starsForRatio(correct / total);
};

/**
 * Оценка задания с несколькими верными ответами.
 * partial — выбраны только верные варианты, но не все.
 */
export const scoreMultiChoice = (selected: string[], correct: string[]): MultiChoiceScore => {
  const correctSet = new Set(correct);
  const selectedSet = new Set(selected);

  let hits = 0;
  let wrong = 0;
  for (const id of selectedSet) {
    if (correctSet.has(id)) hits += 1;
    else wrong += 1;
  }

  if (wrong === 0 && hits === correctSet.size) return 'full';
  if (wrong === 0 && hits > 0) return 'partial';
  return 'none';
};

/** Частично верный ответ даёт половину балла. */
export const multiChoiceCredit = (score: MultiChoiceScore): number =>
  score === 'full' ? 1 : score === 'partial' ? 0.5 : 0;

/**
 * Детерминированное перемешивание: одинаковый порядок при повторном рендере,
 * но разный для разных заданий.
 */
export const shuffleBySeed = <T,>(items: T[], seed: string): T[] => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }

  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    hash = (hash * 1103515245 + 12345) | 0;
    const j = Math.abs(hash) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};
