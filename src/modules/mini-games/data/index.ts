import { AnyTask, MiniGameMeta, PlayableTaskType } from '../domain/types';
import { CARDS } from './cards';
import { MATCHING_TASKS } from './matching';
import { MULTI_TASKS } from './multi';
import { SINGLE_TASKS } from './single';

/**
 * Банк задач трека 9. Пока ручной; структура готова под парсер ФИПИ.
 * Числовая задача из спеки вычеркнута и не реализуется.
 */
export const TASK_BANK: AnyTask[] = [
  ...SINGLE_TASKS,
  ...MULTI_TASKS,
  ...MATCHING_TASKS,
  ...CARDS,
];

const TASK_INDEX = new Map<string, AnyTask>(TASK_BANK.map(task => [task.id, task]));

export const getTaskById = (id: string): AnyTask | undefined => TASK_INDEX.get(id);

export const getTasksByType = <T extends AnyTask>(type: T['type']): T[] =>
  TASK_BANK.filter((task): task is T => task.type === type);

export const MINI_GAMES: MiniGameMeta[] = [
  {
    type: 'single',
    title: 'Выбор ответа',
    subtitle: 'Один верный вариант',
    description: 'Выберите верное словосочетание или численный ответ из предложенных.',
    color: '#0ea5e9',
    count: SINGLE_TASKS.length,
  },
  {
    type: 'multi',
    title: 'Множественный выбор',
    subtitle: 'Несколько верных утверждений',
    description: 'Отметьте все верные варианты. Штраф за пропущенные и лишние.',
    color: '#8b5cf6',
    count: MULTI_TASKS.length,
  },
  {
    type: 'matching',
    title: 'Соответствие',
    subtitle: 'Пары «явление — ответ»',
    description: 'Соотнесите ситуации и явления слева с вариантами ответа справа.',
    color: '#10b981',
    count: MATCHING_TASKS.length,
  },
  {
    type: 'cards',
    title: 'Карточки',
    subtitle: 'Теория с самооценкой',
    description: 'Вопрос и ответ. После ответа оцените, насколько уверенно вы его знаете.',
    color: '#f59e0b',
    count: CARDS.length,
  },
];

export const getMiniGameMeta = (type: PlayableTaskType): MiniGameMeta =>
  MINI_GAMES.find(game => game.type === type) ?? MINI_GAMES[0];

export const TOTAL_PLAYABLE_TASKS = TASK_BANK.length;
