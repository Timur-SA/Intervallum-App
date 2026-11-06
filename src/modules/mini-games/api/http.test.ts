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

  it('sends force vectors to Core', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        outcome: 'correct',
        score: 1,
        xp_by_topic: { 'accelerated-motion': 20 },
        correct_answer: { forces: ['gravity', 'normal', 'elastic'] },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const api = createHttpApi();
    await api.grade({
      taskId: 'forces-incline',
      answer: { type: 'forces', vectors: [{ type: 'gravity', x: 1, y: 2, dx: 0, dy: 1 }], attempts: 1 },
    });
    const body = JSON.parse(String((fetchMock.mock.calls[0] as any)[1].body));
    expect(body.answer.vectors[0].type).toBe('gravity');
    expect(body.answer.attempts).toBe(1);
  });

  it('sends interactive value to Core', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        outcome: 'correct',
        score: 1,
        xp_by_topic: { ohm: 10 },
        correct_answer: { value: 6, formula: 'R = U / I' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const api = createHttpApi();
    await api.grade({
      taskId: 'interactive-task_ohm_resistance',
      answer: { type: 'interactive', value: 6, attempts: 1 },
    });
    const body = JSON.parse(String((fetchMock.mock.calls[0] as any)[1].body));
    expect(body.answer).toEqual({ value: 6, attempts: 1 });
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
