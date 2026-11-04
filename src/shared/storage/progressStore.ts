/**
 * Unified Progress & Session persistence store
 * Force lab и тренажёр формул награждают звёздами, мини-игры — опытом по темам.
 */

const STORAGE_KEY = 'intervallum:progress:v2';

export interface ForceVectorSave {
  type: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
}

/** Прогресс мини-игр: опыт по темам трека 9. */
export interface PracticeProgress {
  xpByTopic: Record<string, number>;
  /** Типы мини-игр, которые пользователь уже проходил. */
  exploredTypes: string[];
  /** Лучшая доля верного ответа по типу задачи, 0..1. */
  bestScoreByType: Record<string, number>;
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

export const calcFormulaStars = (taskIds: string[]): number =>
  taskIds.reduce((sum, id) => sum + (FORMULA_DIFFICULTIES[id] || 1), 0);

export const totalXp = (practice: PracticeProgress): number =>
  Object.values(practice.xpByTopic).reduce((sum, value) => sum + value, 0);

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
  practice: {
    xpByTopic: {},
    exploredTypes: [],
    bestScoreByType: {},
  },
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
 * Записывает результат задания мини-игры: опыт по теме и лучшую долю по типу.
 * В будущем эти данные будет считать Intervallum-Core через v2/grade.
 */
export const recordPracticeResult = (params: {
  taskType: string;
  topicId: string;
  xp: number;
  score: number;
}): UserProgressData => {
  const current = loadUserProgress();
  const { taskType, topicId, xp, score } = params;

  if (xp > 0) {
    current.practice.xpByTopic[topicId] = (current.practice.xpByTopic[topicId] ?? 0) + xp;
  }

  if (!current.practice.exploredTypes.includes(taskType)) {
    current.practice.exploredTypes.push(taskType);
  }

  current.practice.bestScoreByType[taskType] = Math.max(
    current.practice.bestScoreByType[taskType] ?? 0,
    Math.max(0, Math.min(1, score)),
  );

  saveUserProgress(current);
  return current;
};
