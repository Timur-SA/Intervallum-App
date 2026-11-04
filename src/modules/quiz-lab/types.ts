export type GameId = 'single' | 'multi' | 'matching' | 'cards';

export type Topic = 'mechanics' | 'thermal' | 'electricity';

export const TOPIC_LABELS: Record<Topic, string> = {
  mechanics: 'Механика',
  thermal: 'Тепловые явления',
  electricity: 'Электричество',
};

export interface QuizOption {
  id: string;
  text: string;
}

export interface SingleChoiceQuestion {
  id: string;
  topic: Topic;
  source: string;
  prompt: string;
  options: QuizOption[];
  correctOptionId: string;
  explanation: string;
  hint?: string;
}

export interface MultiChoiceQuestion {
  id: string;
  topic: Topic;
  source: string;
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

export interface MatchingQuestion {
  id: string;
  topic: Topic;
  source: string;
  prompt: string;
  pairs: MatchPair[];
  explanation: string;
}

export interface TheoryCard {
  id: string;
  deck: 'formula' | 'quantity' | 'law';
  term: string;
  definition: string;
  formula?: string;
}

export interface GameResult {
  gameId: GameId;
  correct: number;
  total: number;
  stars: number;
  bestStreak: number;
}

export type AnswerStatus = 'correct' | 'partial' | 'wrong';

export interface GameMeta {
  id: GameId;
  title: string;
  shortLabel: string;
  subtitle: string;
  description: string;
  badge: string;
  color: string;
}
