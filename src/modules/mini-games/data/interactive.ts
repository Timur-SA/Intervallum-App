import { PHYSICS_TASKS } from '../../formula-trainer/data/tasksDb';
import { InteractiveTask, TopicId } from '../domain/types';

const TOPICS: Record<string, { topic: TopicId; difficulty: 1 | 2 | 3 }> = {
  task_ohm_resistance: { topic: 'ohm', difficulty: 1 },
  task_newton_accel: { topic: 'accelerated-motion', difficulty: 2 },
  task_electric_current_power: { topic: 'ohm', difficulty: 2 },
  task_density_volume: { topic: 'density', difficulty: 1 },
  task_work_and_power: { topic: 'work-power', difficulty: 3 },
  task_ampere_conductor: { topic: 'ampere', difficulty: 3 },
};

export const INTERACTIVE_LEVEL_TASKS: InteractiveTask[] = PHYSICS_TASKS.filter(
  task => TOPICS[task.id],
).map(task => ({
  id: `interactive-${task.id}`,
  type: 'interactive',
  topic: TOPICS[task.id].topic,
  difficulty: TOPICS[task.id].difficulty,
  physicsTask: task,
}));
