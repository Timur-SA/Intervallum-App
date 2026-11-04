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
}

/** Прогресс трека ОГЭ: опыт по темам, звёзды, боссы и предметы. */
export interface PracticeProgress {
  xpByTopic: Record<string, number>;
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

export interface UserProgressData {
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
});

const numericRecord = (value: unknown): Record<string, number> => {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(
      (entry): entry is [string, number] => typeof entry[1] === 'number',
    ),
  );
};

const stringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const taskStatsRecord = (value: unknown): Record<string, TaskStat> => {
  if (!value || typeof value !== 'object') return {};

  const result: Record<string, TaskStat> = {};
  for (const [taskId, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!raw || typeof raw !== 'object') continue;
    const stat = raw as { attempts?: unknown; bestScore?: unknown };
    result[taskId] = {
      attempts: typeof stat.attempts === 'number' ? stat.attempts : 0,
      bestScore: typeof stat.bestScore === 'number' ? stat.bestScore : 0,
    };
  }
  return result;
};

export const loadUserProgress = (): UserProgressData => {
  const fallback = createDefaultProgress();
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);

    const forceCompleted = stringArray(parsed?.forceLab?.completedTaskIds);
    const formulaCompleted = stringArray(parsed?.formulaTrainer?.completedTaskIds);

    const practice: PracticeProgress = {
      xpByTopic: numericRecord(parsed?.practice?.xpByTopic),
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

    return {
      forceLab: {
        completedTaskIds: forceCompleted,
        savedVectors: parsed?.forceLab?.savedVectors || {},
        // Compute stars deterministically according to 1/2/3 difficulty
        stars: calcForceStars(forceCompleted),
      },
      formulaTrainer: {
        completedTaskIds: formulaCompleted,
        stars: calcFormulaStars(formulaCompleted),
      },
      practice,
    };
  } catch {
    return fallback;
  }
};

export const saveUserProgress = (data: UserProgressData): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota errors
  }
};

export const resetUserProgress = (): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
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
 * лучшую долю по типу и звёзды за сложные/новые задачи.
 */
export const recordTaskResult = (params: {
  taskId: string;
  taskType: string;
  topicId: string;
  sectionId: string;
  xp: number;
  score: number;
}): UserProgressData => {
  const current = loadUserProgress();
  const { taskId, taskType, topicId, sectionId, xp, score } = params;
  const previousStat = current.practice.taskStats[taskId];

  const previousBestXp = current.practice.bestXpByTask[taskId] ?? 0;
  const gainedXp = Math.max(0, xp - previousBestXp);
  current.practice.bestXpByTask[taskId] = Math.max(previousBestXp, xp);

  if (gainedXp > 0) {
    current.practice.xpByTopic[topicId] =
      (current.practice.xpByTopic[topicId] ?? 0) + gainedXp;
  }

  if (!current.practice.exploredTypes.includes(taskType)) {
    current.practice.exploredTypes.push(taskType);
  }

  current.practice.bestScoreByType[taskType] = Math.max(
    current.practice.bestScoreByType[taskType] ?? 0,
    Math.max(0, Math.min(1, score)),
  );

  current.practice.taskStats[taskId] = {
    attempts: (previousStat?.attempts ?? 0) + 1,
    bestScore: Math.max(previousStat?.bestScore ?? 0, Math.max(0, Math.min(1, score))),
  };

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
