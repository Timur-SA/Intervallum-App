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
