export type SectionId = 'mechanics' | 'thermal' | 'electromagnetism';

export type TopicId =
  // Механика
  | 'uniform-motion'
  | 'relativity'
  | 'accelerated-motion'
  | 'free-fall'
  | 'momentum'
  | 'mechanical-energy'
  | 'work-power'
  | 'lever'
  | 'density'
  // Тепловые явления
  | 'heat-amount'
  | 'aggregate-states'
  | 'heat-balance'
  | 'thermal-energy'
  | 'fuel-engines'
  // Электромагнитные явления
  | 'coulomb'
  | 'charge-conservation'
  | 'resistance'
  | 'ohm'
  | 'joule-lenz'
  | 'ampere';

/** Типы задач из Intervallum-Core. */
export type TaskType =
  | 'forces'
  | 'interactive'
  | 'single'
  | 'multi'
  | 'matching'
  | 'cards'
  | 'numeric'
  | 'interactive'
  | 'forces';

export type Difficulty = 1 | 2 | 3;

/** Самооценка карточки: 0 — неверно/пропуск, 1 — легко, 2 — ок, 3 — сложно. */
export type CardGrade = 0 | 1 | 2 | 3;

export type Outcome = 'correct' | 'partial' | 'wrong';

export interface Topic {
  id: TopicId;
  title: string;
  section: SectionId;
}

export interface Section {
  id: SectionId;
  title: string;
  boss: string;
  item: string;
  itemId: string;
  color: string;
  topics: TopicId[];
}

export interface BaseTask {
  id: string;
  type: TaskType;
  topic: TopicId;
  difficulty: Difficulty;
  /** Помечается Core: задача новая для пользователя. */
  isNew?: boolean;
  /** Помечается Core: задача сложная для пользователя. */
  isHard?: boolean;
}

export interface QuizOption {
  id: string;
  text: string;
}

export interface SingleChoiceTask extends BaseTask {
  type: 'single';
  prompt: string;
  options: QuizOption[];
  correctOptionId: string;
  explanation: string;
  hint?: string;
}

export interface MultiChoiceTask extends BaseTask {
  type: 'multi';
  prompt: string;
  options: QuizOption[];
  correctOptionIds: string[];
  explanation: string;
  hint?: string;
}

export interface MatchPair {
  id: string;
  left: string;
  right: string;
}

export interface MatchingTask extends BaseTask {
  type: 'matching';
  prompt: string;
  pairs: MatchPair[];
  explanation: string;
}

export interface TheoryCard extends BaseTask {
  type: 'cards';
  question: string;
  answer: string;
  formula?: string;
  /** Что именно нужно вспомнить: формулу, определение, закон или значение. */
  answerKind?: 'formula' | 'definition' | 'law' | 'value';
  /** Дополнительное пояснение для экрана теории. */
  details?: string;
}

export interface ForcesTask extends BaseTask {
  type: 'forces';
  forceTask: import('../../force-lab/types').ForceTask;
}

export type AnyTask =
  | SingleChoiceTask
  | MultiChoiceTask
  | MatchingTask
  | TheoryCard
  | ForcesTask;

export type PlayableTaskType = 'single' | 'multi' | 'matching' | 'cards';

export type TaskAnswer =
  | { type: 'single'; optionId: string }
  | { type: 'multi'; optionIds: string[] }
  | { type: 'matching'; links: Record<string, string> }
  | { type: 'cards'; selfAssessment: CardGrade };

export interface GradeResult {
  outcome: Outcome;
  /** Доля засчитанного ответа, 0..1. */
  score: number;
  cardGrade?: CardGrade;
  /** Опыт по темам — как в v2/grade. */
  xpByTopic: Partial<Record<TopicId, number>>;
}

export interface MiniGameMeta {
  type: PlayableTaskType;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  count: number;
}

/** Итог раунда мини-игры. */
export interface GameSummary {
  type: PlayableTaskType;
  tasks: number;
  /** Средняя доля верного ответа, 0..1. */
  score: number;
  /** Сумма засчитанных ответов (может быть дробной). */
  correct: number;
  xp: number;
  bestStreak: number;
  repeats?: number;
}
