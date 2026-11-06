import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHttpApi } from './http';
import { getTaskById } from '../data';

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createHttpApi', () => {
  it('sends single answer to Core and maps XP', async () => {
    const task = [...Array(1)].map(() => getTaskById('single-uniform-motion')).find(Boolean);
    expect(task).toBeTruthy();
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        outcome: 'correct',
        score: 1,
        xp_by_topic: { 'uniform-motion': 15 },
        correct_answer: { optionId: task!.type === 'single' ? task!.correctOptionId : 'c' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const api = createHttpApi();
    const result = await api.grade({
      taskId: 'single-uniform-motion',
      answer: { type: 'single', optionId: 'c' },
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const body = JSON.parse(String((fetchMock.mock.calls[0] as any)[1].body));
    expect(body.answer).toEqual({ optionId: 'c' });
    expect(result.xpByTopic).toEqual({ 'uniform-motion': 15 });
    expect(result.correctAnswer).toEqual({ type: 'single', optionId: 'c' });
  });

  it('maps matching right strings back to pair ids', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({
          outcome: 'correct',
          score: 1,
          xp_by_topic: { 'work-power': 10 },
          correct_answer: {
            links: {
              work: 'Механическая работа',
              power: 'Мощность',
              gravity: 'Сила тяжести',
              momentum: 'Импульс тела',
            },
          },
        }),
      ),
    );

    const api = createHttpApi();
    const result = await api.grade({
      taskId: 'match-formulas',
      answer: { type: 'matching', links: { work: 'work', power: 'power', gravity: 'gravity', momentum: 'momentum' } },
    });

    expect(result.correctAnswer).toEqual({
      type: 'matching',
      links: { work: 'work', power: 'power', gravity: 'gravity', momentum: 'momentum' },
    });
  });

  it('falls back to local grading when Core is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    const { createResilientApi } = await import('./http');
    const result = await createResilientApi().grade({
      taskId: 'single-uniform-motion',
      answer: { type: 'single', optionId: 'c' },
    });
    expect(result.score).toBe(1);
  });
});
