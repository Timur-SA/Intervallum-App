import { TaskRenderer } from './taskView';
import { SingleTaskView } from './SingleTaskView';
import { MultiTaskView } from './MultiTaskView';
import { MatchingTaskView } from './MatchingTaskView';
import { CardTaskView } from './CardTaskView';
import { ForceTaskView } from './ForceTaskView';
import { InteractiveTaskView } from './InteractiveTaskView';

/**
 * Реестр рендереров заданий.
 * Чтобы заменить тип задания, достаточно подменить компонент здесь —
 * карта, сессии, грейдинг и прогрессия не меняются.
 */
export const TASK_RENDERERS: Record<string, TaskRenderer> = {
  single: SingleTaskView,
  multi: MultiTaskView,
  matching: MatchingTaskView,
  cards: CardTaskView,
  forces: ForceTaskView,
  interactive: InteractiveTaskView,
};
