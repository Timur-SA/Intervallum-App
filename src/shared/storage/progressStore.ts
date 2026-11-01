/**
 * Unified Progress & Session persistence store
 * Awards 1 / 2 / 3 stars based on task difficulty
 */

const STORAGE_KEY = 'intervallum:progress:v2';

export interface ForceVectorSave {
  type: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
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

const defaultProgress: UserProgressData = {
  forceLab: {
    completedTaskIds: [],
    savedVectors: {},
    stars: 0,
  },
  formulaTrainer: {
    completedTaskIds: [],
    stars: 0,
  },
};

export const loadUserProgress = (): UserProgressData => {
  if (typeof window === 'undefined') return defaultProgress;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress;
    const parsed = JSON.parse(raw);

    const forceCompleted: string[] = Array.isArray(parsed?.forceLab?.completedTaskIds)
      ? parsed.forceLab.completedTaskIds
      : [];
    const formulaCompleted: string[] = Array.isArray(parsed?.formulaTrainer?.completedTaskIds)
      ? parsed.formulaTrainer.completedTaskIds
      : [];

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
    };
  } catch {
    return defaultProgress;
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
