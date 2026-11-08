/**
 * Development-only time travel.
 *
 * The rest of the app should always ask for "now" through this module.
 * In normal mode it returns the real local date. In the sandbox, DevPanel can
 * pin an artificial date to test Daily Streak and activity calendar states.
 */

const STORAGE_KEY = 'intervallum:dev:date';

const pad = (value: number): string => String(value).padStart(2, '0');

export const toDateKey = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parseDateKey = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day, 12, 0, 0, 0);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

const canUseStorage = (): boolean =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

/** Искусственная дата в формате YYYY-MM-DD, либо null. */
export const getArtificialDate = (): string | null => {
  if (!canUseStorage()) return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw && parseDateKey(raw) ? raw : null;
};

/** Текущая дата приложения. В песочнице может быть подменена DevPanel. */
export const getNow = (): Date => {
  const artificial = getArtificialDate();
  const parsed = artificial ? parseDateKey(artificial) : null;
  return parsed ?? new Date();
};

export const getDateKey = (date: Date = getNow()): string => toDateKey(date);

export const shiftDateKey = (dateKey: string, days: number): string => {
  const date = parseDateKey(dateKey) ?? getNow();
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return toDateKey(next);
};

const saveArtificialDate = (date: Date | null): void => {
  if (!canUseStorage()) return;

  if (date) {
    window.localStorage.setItem(STORAGE_KEY, toDateKey(date));
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }

  window.dispatchEvent(new CustomEvent('intervallum:time-changed'));
};

/** Задать конкретную дату (YYYY-MM-DD). Пустая строка сбрасывает override. */
export const setArtificialDate = (value: string | null): void => {
  if (!value) {
    saveArtificialDate(null);
    return;
  }

  const parsed = parseDateKey(value);
  if (parsed) saveArtificialDate(parsed);
};

export const shiftDays = (days: number): void => {
  const next = new Date(getNow());
  next.setDate(next.getDate() + days);
  saveArtificialDate(next);
};

export const shiftMonths = (months: number): void => {
  const base = getNow();
  const day = base.getDate();
  const next = new Date(base.getFullYear(), base.getMonth() + months, 1, 12, 0, 0, 0);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(day, lastDay));
  saveArtificialDate(next);
};

export const resetTimeTravel = (): void => {
  saveArtificialDate(null);
};

export const getTimeTravelLabel = (): string => {
  const artificial = getArtificialDate();
  if (!artificial) return 'реальное время';
  return artificial;
};

export const getDaysInMonth = (date: Date = getNow()): number =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

export const getMonthDateKey = (date: Date = getNow()): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;

export const getMonthLabel = (date: Date = getNow()): string => {
  const label = new Intl.DateTimeFormat('ru-RU', {
    month: 'long',
    year: 'numeric',
  }).format(date);

  return label.charAt(0).toUpperCase() + label.slice(1);
};
