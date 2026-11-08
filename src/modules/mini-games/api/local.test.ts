import { describe, expect, it } from 'vitest';
import { createLocalApi } from './local';

describe('карточки: опыт', () => {
  it('начисляет опыт за выполненную карточку', async () => {
    const api = createLocalApi();
    const result = await api.grade({
      taskId: 'card-uniform-motion',
      answer: { type: 'cards', selfAssessment: 3 },
    });

    expect(result.score).toBe(1);
    expect(result.xpByTopic['uniform-motion']).toBe(10);
  });

  it('не начисляет опыт за невыполненную карточку', async () => {
    const api = createLocalApi();
    const result = await api.grade({
      taskId: 'card-uniform-motion',
      answer: { type: 'cards', selfAssessment: 0 },
    });

    expect(result.score).toBe(0);
    expect(result.xpByTopic).toEqual({});
  });
});
