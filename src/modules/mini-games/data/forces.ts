import { FORCE_TASKS } from '../../force-lab/data/tasks';
import { ForcesTask, TopicId } from '../domain/types';

const TOPICS: Record<string, { topic: TopicId; difficulty: 1 | 2 | 3 }> = {
  incline: { topic: 'accelerated-motion', difficulty: 2 },
  table: { topic: 'uniform-motion', difficulty: 1 },
  hanging: { topic: 'free-fall', difficulty: 1 },
  magnetic: { topic: 'ampere', difficulty: 2 },
  sail: { topic: 'momentum', difficulty: 3 },
  lever: { topic: 'lever', difficulty: 2 },
};

export const FORCE_LEVEL_TASKS: ForcesTask[] = FORCE_TASKS.filter(
  task => TOPICS[task.id],
).map(task => ({
  id: `forces-${task.id}`,
  type: 'forces',
  topic: TOPICS[task.id].topic,
  difficulty: TOPICS[task.id].difficulty,
  forceTask: task,
}));
