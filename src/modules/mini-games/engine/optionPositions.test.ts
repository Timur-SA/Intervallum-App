import { describe, expect, it } from 'vitest';
import { SINGLE_TASKS } from '../data/single';
import { MULTI_TASKS } from '../data/multi';
import { shuffleBySeed } from './shuffle';

const correctPositions = (tasks: { id: string; options: { id: string }[]; correctOptionId?: string }[]) =>
  tasks.map(task =>
    shuffleBySeed(task.options, `${task.id}:options`).findIndex(
      option => option.id === task.correctOptionId,
    ),
  );

describe('перемешивание вариантов ответа', () => {
  it('верный ответ не залипает в первых двух позициях', () => {
    const positions = correctPositions(SINGLE_TASKS);
    const inFirstTwo = positions.filter(position => position <= 1).length;

    expect(positions.every(position => position >= 0)).toBe(true);
    expect(inFirstTwo).toBeLessThan(positions.length * 0.7);
  });

  it('порядок вариантов стабилен для одной и той же задачи', () => {
    const task = SINGLE_TASKS[0];
    const first = shuffleBySeed(task.options, `${task.id}:options`);
    const second = shuffleBySeed(task.options, `${task.id}:options`);
    expect(first.map(option => option.id)).toEqual(second.map(option => option.id));
  });

  it('перемешивание не теряет варианты', () => {
    for (const task of MULTI_TASKS) {
      const shuffled = shuffleBySeed(task.options, `${task.id}:options`);
      expect(shuffled).toHaveLength(task.options.length);
      expect(new Set(shuffled.map(option => option.id)).size).toBe(task.options.length);
    }
  });
});
