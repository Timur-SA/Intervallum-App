/**
 * Unified Progress & Session persistence store
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
    return {
      forceLab: {
        completedTaskIds: Array.isArray(parsed?.forceLab?.completedTaskIds)
          ? parsed.forceLab.completedTaskIds
          : [],
        savedVectors: parsed?.forceLab?.savedVectors || {},
        stars: Number(parsed?.forceLab?.stars) || 0,
      },
      formulaTrainer: {
        completedTaskIds: Array.isArray(parsed?.formulaTrainer?.completedTaskIds)
          ? parsed.formulaTrainer.completedTaskIds
          : [],
        stars: Number(parsed?.formulaTrainer?.stars) || 0,
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

export const markForceTaskCompleted = (taskId: string, vectors?: ForceVectorSave[]): UserProgressData => {
  const current = loadUserProgress();
  if (!current.forceLab.completedTaskIds.includes(taskId)) {
    current.forceLab.completedTaskIds.push(taskId);
    current.forceLab.stars += 1;
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
    current.formulaTrainer.stars += 1;
  }
  saveUserProgress(current);
  return current;
};
