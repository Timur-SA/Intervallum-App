/** Русская плюрализация: 1 задание / 3 задания / 9 заданий. */
export const plural = (count: number, forms: [string, string, string]): string => {
  const abs = Math.abs(count) % 100;
  const last = abs % 10;

  if (abs > 10 && abs < 20) return forms[2];
  if (last > 1 && last < 5) return forms[1];
  if (last === 1) return forms[0];
  return forms[2];
};

export const tasksLabel = (count: number): string =>
  `${count} ${plural(count, ['задание', 'задания', 'заданий'])}`;
