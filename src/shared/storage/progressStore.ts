import { getDateKey, shiftDateKey } from '../dev/timeTravel';

/**
 * Unified Progress & Session persistence store
 * Force lab и тренажёр формул награждают звёздами, практика ОГЭ — опытом и звёздами.
 */

const STORAGE_KEY = 'intervallum:progress:v2';

export interface ForceVectorSave {
  type: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
}

export interface TaskStat {
  attempts: number;
  bestScore: number;
  lastScore?: number;
  lastAttemptAt?: number;
  creditedXp?: number;
}

export interface TopicReview {
  dueAt: number;
  intervalDays: number;
}

/** Прогресс трека ОГЭ: опыт по темам, звёзды, боссы и предметы. */
export interface PracticeProgress {
  xpByTopic: Record<string, number>;
  peakXpByTopic?: Record<string, number>;
  readTopicIds?: string[];
  introducedTypes?: string[];
  reviewsByTopic?: Record<string, TopicReview>;
  /** Типы мини-игр, которые пользователь уже проходил. */
  exploredTypes: string[];
  /** Лучшая доля верного ответа по типу задачи, 0..1. */
  bestScoreByType: Record<string, number>;
  /** История ответов по задачам: попытки и лучший результат. */
  taskStats: Record<string, TaskStat>;
  /** Лучший начисленный опыт по каждой задаче. */
  bestXpByTask: Record<string, number>;
  /** Побеждённые боссы (id разделов). */
  defeatedBosses: string[];
  /** Дополнительно открытые разделы. */
  unlockedSections: string[];
  /** Полученные предметы боссов. */
  items: string[];
}

export type ThemePreference = 'auto' | 'light' | 'dark';

export interface AppSettings {
  theme: ThemePreference;
  sound: boolean;
  haptics: boolean;
}

export interface UserProfileData {
  avatarDataUrl: string | null;
  badgeId: string | null;
}

/**
 * Активность по дням и Daily Streak.
 * Ключи дат — локальные YYYY-MM-DD.
 */
export interface DailyActivityState {
  counts: Record<string, number>;
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: string | null;
  /** Нужно показать анимацию обновления серии. */
  pendingCelebrationDate: string | null;
  /** Пользователь пропустил день; нужно показать сообщение о потере серии. */
  pendingBreakDate: string | null;
  pendingBreakLostDays: number;
}

export interface UserProgressData {
  onboarding?: 'started' | 'skipped' | 'completed';
  forceGuideDismissed?: true;
  formulaGuideDismissed?: true;
  forceLab: {
    completedTaskIds: string[];
    savedVectors: Record<string, ForceVectorSave[]>;
    stars: number;
  };
  formulaTrainer: {
    completedTaskIds: string[];
    stars: number;
  };
  practice: PracticeProgress;
  activity: DailyActivityState;
  profile: UserProfileData;
  settings: AppSettings;
}

export const FORCE_DIFFICULTIES: Record<string, number> = {
  table: 1,
  hanging: 1,
  incline: 2,
  lever: 2,
  magnetic: 2,
  sail: 3,
};

export const FORMULA_DIFFICULTIES: Record<string, number> = {
  task_ohm_resistance: 1,
  task_newton_accel: 1,
  task_electric_current_power: 1,
  task_density_volume: 2,
  task_ampere_conductor: 2,
  task_work_and_power: 3,
};

export const calcForceStars = (taskIds: string[]): number =>
  taskIds.reduce((sum, id) => sum + (FORCE_DIFFICULTIES[id] || 1), 0);

export const totalXp = (practice: PracticeProgress): number =>
  Object.values(practice.xpByTopic).reduce((sum, value) => sum + value, 0);

export const calcFormulaStars = (taskIds: string[]): number =>
  taskIds.reduce((sum, id) => sum + (FORMULA_DIFFICULTIES[id] || 1), 0);

export const activeDaysCount = (activity: DailyActivityState): number =>
  Object.values(activity.counts).filter(count => count > 0).length;

/** Уникальные задания, которые пользователь хотя бы раз выполнял. */
export const completedTasksCount = (practice: PracticeProgress): number =>
  Object.values(practice.taskStats).filter(stat => stat.attempts > 0).length;

const createDefaultPractice = (): PracticeProgress => ({
  xpByTopic: {},
  exploredTypes: [],
  bestScoreByType: {},
  taskStats: {},
  bestXpByTask: {},
  defeatedBosses: [],
  unlockedSections: [],
  items: [],
});

const createDefaultActivity = (): DailyActivityState => ({
  counts: {},
  currentStreak: 0,
  bestStreak: 0,
  lastActiveDate: null,
  pendingCelebrationDate: null,
  pendingBreakDate: null,
  pendingBreakLostDays: 0,
});

const createDefaultProfile = (): UserProfileData => ({
  avatarDataUrl: null,
  badgeId: null,
});

const createDefaultSettings = (): AppSettings => ({
  theme: 'light',
  sound: true,
  haptics: true,
});

const createDefaultProgress = (): UserProgressData => ({
  forceLab: {
    completedTaskIds: [],
    savedVectors: {},
    stars: 0,
  },
  formulaTrainer: {
    completedTaskIds: [],
    stars: 0,
  },
  practice: createDefaultPractice(),
  activity: createDefaultActivity(),
  profile: createDefaultProfile(),
  settings: createDefaultSettings(),
});

const numericRecord = (value: unknown): Record<string, number> => {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(
      (entry): entry is [string, number] =>
        typeof entry[1] === 'number' && Number.isFinite(entry[1]),
    ),
  );
};

const positiveIntegerRecord = (value: unknown): Record<string, number> => {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(
        (entry): entry is [string, number] =>
          typeof entry[1] === 'number' && Number.isFinite(entry[1]) && entry[1] > 0,
      )
      .map(([key, count]) => [key, Math.floor(count)]),
  );
};

const stringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const stringOrNull = (value: unknown): string | null =>
  typeof value === 'string' && value.length > 0 ? value : null;

const nonNegativeInteger = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : 0;

const booleanValue = (value: unknown, fallback: boolean): boolean =>
  typeof value === 'boolean' ? value : fallback;

const themePreference = (value: unknown): ThemePreference =>
  value === 'light' || value === 'dark' || value === 'auto' ? value : 'light';

const reviewsRecord = (value: unknown): Record<string, TopicReview> => {
  if (!value || typeof value !== 'object') return {};
  const result: Record<string, TopicReview> = {};
  for (const [topic, raw] of Object.entries(value)) {
    if (!raw || !Number.isFinite(raw.dueAt) || !Number.isFinite(raw.intervalDays)) continue;
    result[topic] = { dueAt: raw.dueAt, intervalDays: raw.intervalDays };
  }
  return result;
};

const taskStatsRecord = (value: unknown): Record<string, TaskStat> => {
  if (!value || typeof value !== 'object') return {};

  const result: Record<string, TaskStat> = {};
  for (const [taskId, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!raw || typeof raw !== 'object') continue;
    const stat = raw as Partial<TaskStat>;
    result[taskId] = {
      attempts: typeof stat.attempts === 'number' ? stat.attempts : 0,
      bestScore: typeof stat.bestScore === 'number' ? stat.bestScore : 0,
      lastScore: Number.isFinite(stat.lastScore) ? stat.lastScore : undefined,
      lastAttemptAt: Number.isFinite(stat.lastAttemptAt) ? stat.lastAttemptAt : undefined,
      creditedXp: Number.isFinite(stat.creditedXp) ? stat.creditedXp : undefined,
    };
  }
  return result;
};

const emitProgressChanged = (): void => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('intervallum:progress-changed'));
};

export const loadUserProgress = (): UserProgressData => {
  const fallback = createDefaultProgress();
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    const onboarding = parsed?.onboarding;

    const forceCompleted = stringArray(parsed?.forceLab?.completedTaskIds);
    const formulaCompleted = stringArray(parsed?.formulaTrainer?.completedTaskIds);

    const practice: PracticeProgress = {
      xpByTopic: numericRecord(parsed?.practice?.xpByTopic),
      peakXpByTopic: numericRecord(parsed?.practice?.peakXpByTopic),
      readTopicIds: stringArray(parsed?.practice?.readTopicIds),
      introducedTypes: stringArray(parsed?.practice?.introducedTypes),
      reviewsByTopic: reviewsRecord(parsed?.practice?.reviewsByTopic),
      exploredTypes: stringArray(parsed?.practice?.exploredTypes),
      bestScoreByType: numericRecord(parsed?.practice?.bestScoreByType),
      taskStats: taskStatsRecord(parsed?.practice?.taskStats),
      bestXpByTask: numericRecord(parsed?.practice?.bestXpByTask),
      defeatedBosses: stringArray(parsed?.practice?.defeatedBosses),
      unlockedSections: stringArray(parsed?.practice?.unlockedSections),
      items: stringArray(parsed?.practice?.items),
    };

    // Совместимость с черновиком quiz-lab: звёзды 0..3 переводим в долю 0..1.
    if (!parsed?.practice && parsed?.quizLab) {
      const legacyStars = numericRecord(parsed.quizLab.bestStars);
      practice.bestScoreByType = Object.fromEntries(
        Object.entries(legacyStars).map(([type, stars]) => [type, stars / 3]),
      );
      practice.exploredTypes = stringArray(parsed.quizLab.completedGameIds);
    }

    const activityRaw = parsed?.activity;
    const activity: DailyActivityState = {
      counts: positiveIntegerRecord(activityRaw?.counts),
      currentStreak: nonNegativeInteger(activityRaw?.currentStreak),
      bestStreak: nonNegativeInteger(activityRaw?.bestStreak),
      lastActiveDate: stringOrNull(activityRaw?.lastActiveDate),
      pendingCelebrationDate: stringOrNull(activityRaw?.pendingCelebrationDate),
      pendingBreakDate: stringOrNull(activityRaw?.pendingBreakDate),
      pendingBreakLostDays: nonNegativeInteger(activityRaw?.pendingBreakLostDays),
    };

    const profile: UserProfileData = {
      avatarDataUrl: stringOrNull(parsed?.profile?.avatarDataUrl),
      badgeId: stringOrNull(parsed?.profile?.badgeId),
    };

    const settings: AppSettings = {
      theme: themePreference(parsed?.settings?.theme),
      sound: booleanValue(parsed?.settings?.sound, true),
      haptics: booleanValue(parsed?.settings?.haptics, true),
    };

    return {
      onboarding: onboarding === 'started' || onboarding === 'skipped' || onboarding === 'completed'
        ? onboarding
        : undefined,
      forceGuideDismissed: parsed?.forceGuideDismissed === true ? true : undefined,
      formulaGuideDismissed: parsed?.formulaGuideDismissed === true ? true : undefined,
      forceLab: {
        completedTaskIds: forceCompleted,
        savedVectors: parsed?.forceLab?.savedVectors || {},
        stars: calcForceStars(forceCompleted),
      },
      formulaTrainer: {
        completedTaskIds: formulaCompleted,
        stars: calcFormulaStars(formulaCompleted),
      },
      practice,
      activity,
      profile,
      settings,
    };
  } catch {
    return fallback;
  }
};

export const saveUserProgress = (data: UserProgressData): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    emitProgressChanged();
  } catch {
    // Ignore quota errors
  }
};

export const resetUserProgress = (): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    emitProgressChanged();
  } catch {
    // ignore
  }
};

/** Dev-действие: имитирует одно выполненное задание для проверки активности. */
export const recordDevActivity = (): UserProgressData => {
  const current = loadUserProgress();
  registerActivity(current);
  saveUserProgress(current);
  return current;
};

/** Удаляет учебный прогресс, но сохраняет настройки и аватар. */
export const resetLearningProgress = (): UserProgressData => {
  const current = loadUserProgress();
  const avatarDataUrl = current.profile.avatarDataUrl;

  current.forceLab = {
    completedTaskIds: [],
    savedVectors: {},
    stars: 0,
  };
  current.formulaTrainer = {
    completedTaskIds: [],
    stars: 0,
  };
  current.practice = createDefaultPractice();
  current.activity = createDefaultActivity();
  current.profile = {
    avatarDataUrl,
    badgeId: null,
  };

  saveUserProgress(current);
  return current;
};

export const updateAppSettings = (patch: Partial<AppSettings>): AppSettings => {
  const current = loadUserProgress();
  current.settings = {
    ...current.settings,
    ...patch,
  };
  saveUserProgress(current);
  return current.settings;
};

export const updateUserProfile = (patch: Partial<UserProfileData>): UserProfileData => {
  const current = loadUserProgress();
  current.profile = {
    ...current.profile,
    ...patch,
  };
  saveUserProgress(current);
  return current.profile;
};

const registerActivity = (current: UserProgressData): void => {
  const today = getDateKey();
  const yesterday = shiftDateKey(today, -1);
  const activity = current.activity;

  activity.counts[today] = (activity.counts[today] ?? 0) + 1;

  if (activity.lastActiveDate === today) return;

  const isConsecutive = activity.lastActiveDate === yesterday;
  activity.currentStreak = isConsecutive ? activity.currentStreak + 1 : 1;
  activity.bestStreak = Math.max(activity.bestStreak, activity.currentStreak);
  activity.lastActiveDate = today;
  activity.pendingCelebrationDate = today;
  activity.pendingBreakDate = null;
  activity.pendingBreakLostDays = 0;
};

/**
 * Проверка на старте: если после последней активности прошло больше дня,
 * фиксируем потерю серии. Анимацию показывает AppShell/Home.
 */
export const prepareStreakOnLaunch = (): UserProgressData => {
  const current = loadUserProgress();
  const today = getDateKey();
  const yesterday = shiftDateKey(today, -1);
  const activity = current.activity;

  if (activity.pendingBreakDate) {
    return current;
  }

  if (
    activity.currentStreak > 0 &&
    activity.lastActiveDate &&
    activity.lastActiveDate < yesterday
  ) {
    activity.pendingBreakDate = today;
    activity.pendingBreakLostDays = activity.currentStreak;
    activity.pendingCelebrationDate = null;
    activity.currentStreak = 0;
    saveUserProgress(current);
  }

  return current;
};

export const acknowledgeStreakBreak = (): UserProgressData => {
  const current = loadUserProgress();
  current.activity.pendingBreakDate = null;
  current.activity.pendingBreakLostDays = 0;
  saveUserProgress(current);
  return current;
};

export const acknowledgeStreakCelebration = (): UserProgressData => {
  const current = loadUserProgress();
  current.activity.pendingCelebrationDate = null;
  saveUserProgress(current);
  return current;
};

export const markForceTaskCompleted = (
  taskId: string,
  vectors?: ForceVectorSave[]
): UserProgressData => {
  const current = loadUserProgress();
  if (!current.forceLab.completedTaskIds.includes(taskId)) {
    current.forceLab.completedTaskIds.push(taskId);
    current.forceLab.stars = calcForceStars(current.forceLab.completedTaskIds);
  }
  if (vectors) {
    current.forceLab.savedVectors[taskId] = vectors;
  }
  saveUserProgress(current);
  return current;
};

export const markFormulaTaskCompleted = (taskId: string): UserProgressData => {
  const current = loadUserProgress();
  if (!current.formulaTrainer.completedTaskIds.includes(taskId)) {
    current.formulaTrainer.completedTaskIds.push(taskId);
    current.formulaTrainer.stars = calcFormulaStars(current.formulaTrainer.completedTaskIds);
  }
  saveUserProgress(current);
  return current;
};

/**
 * Записывает результат задания: опыт по теме, статистику задачи,
 * лучшую долю по типу и активность за день.
 */
export const hasSeenTaskGuide = (practice: PracticeProgress, taskType: string): boolean =>
  practice.exploredTypes.includes(taskType) || Boolean(practice.introducedTypes?.includes(taskType));

export const markTaskGuideSeen = (taskType: string): void => {
  const current = loadUserProgress();
  if (hasSeenTaskGuide(current.practice, taskType)) return;
  (current.practice.introducedTypes ??= []).push(taskType);
  saveUserProgress(current);
};

export const recordPracticeAttempt = (
  practice: PracticeProgress,
  taskId: string,
  taskType: string,
  score: number,
  now = Date.now(),
): TaskStat => {
  const previous = practice.taskStats[taskId];
  const result = Math.max(0, Math.min(1, score));
  if (!practice.exploredTypes.includes(taskType)) practice.exploredTypes.push(taskType);
  practice.bestScoreByType[taskType] = Math.max(practice.bestScoreByType[taskType] ?? 0, result);

  const stat = {
    ...previous,
    attempts: (previous?.attempts ?? 0) + 1,
    bestScore: Math.max(previous?.bestScore ?? 0, result),
    lastScore: result,
    lastAttemptAt: now,
  };
  practice.taskStats[taskId] = stat;
  return stat;
};
export const recordTaskResult = (params: {
  taskId: string;
  taskType: string;
  topicId: string;
  sectionId: string;
  xp: number;
  score: number;
}): UserProgressData => {
  const current = loadUserProgress();
  const { taskId, taskType, topicId, xp, score } = params;
  const previousBestXp = current.practice.bestXpByTask[taskId] ?? 0;
  const gainedXp = Math.max(0, xp - previousBestXp);
  current.practice.bestXpByTask[taskId] = Math.max(previousBestXp, xp);
  if (gainedXp > 0) {
    current.practice.xpByTopic[topicId] = (current.practice.xpByTopic[topicId] ?? 0) + gainedXp;
  }
  recordPracticeAttempt(current.practice, taskId, taskType, score);
  registerActivity(current);
  saveUserProgress(current);
  return current;
};

/** Открывает раздел после победы над боссом. */
export const unlockSection = (sectionId: string): UserProgressData => {
  const current = loadUserProgress();
  if (!current.practice.unlockedSections.includes(sectionId)) {
    current.practice.unlockedSections.push(sectionId);
  }
  saveUserProgress(current);
  return current;
};

/** Победа над боссом: предмет и, при необходимости, открытие следующего раздела. */
export const defeatBoss = (params: {
  sectionId: string;
  itemId: string;
  unlockSectionId?: string | null;
}): UserProgressData => {
  const current = loadUserProgress();

  if (!current.practice.defeatedBosses.includes(params.sectionId)) {
    current.practice.defeatedBosses.push(params.sectionId);
  }

  if (!current.practice.items.includes(params.itemId)) {
    current.practice.items.push(params.itemId);
  }

  if (
    params.unlockSectionId &&
    !current.practice.unlockedSections.includes(params.unlockSectionId)
  ) {
    current.practice.unlockedSections.push(params.unlockSectionId);
  }

  saveUserProgress(current);
  return current;
};
