import { describe, expect, it } from 'vitest';
import {
  cardScore,
  gradeMatching,
  gradeMulti,
  gradeSingle,
  outcomeFromScore,
  xpForScore,
} from './grading';

describe('gradeSingle — бинарная оценка', () => {
  it('засчитывает верный вариант', () => {
    expect(gradeSingle('b', 'b')).toBe(1);
  });

  it('не засчитывает неверный или пустой', () => {
    expect(gradeSingle('a', 'b')).toBe(0);
    expect(gradeSingle(null, 'b')).toBe(0);
  });
});

describe('gradeMulti — штраф за FN и FP', () => {
  const correct = ['a', 'b'];

  it('полный верный ответ даёт 1', () => {
    expect(gradeMulti(['a', 'b'], correct)).toBe(1);
    expect(gradeMulti(['b', 'a'], correct)).toBe(1);
  });

  it('пропуск верного (FN) штрафуется', () => {
    expect(gradeMulti(['a'], correct)).toBe(0.5);
  });

  it('лишний неверный (FP) штрафуется так же', () => {
    expect(gradeMulti(['a', 'b', 'c'], correct)).toBe(0.5);
  });

  it('FN и FP вместе штрафуются сильнее', () => {
    expect(gradeMulti(['a', 'c'], correct)).toBe(0);
  });

  it('только неверные варианты дают 0', () => {
    expect(gradeMulti(['c', 'd'], correct)).toBe(0);
    expect(gradeMulti([], correct)).toBe(0);
  });

  it('не уходит в минус', () => {
    expect(gradeMulti(['c', 'd', 'e'], correct)).toBe(0);
  });

  it('не делит на ноль при пустом наборе верных', () => {
    expect(gradeMulti(['a'], [])).toBe(0);
  });
});

describe('gradeMatching — штраф за неверную пару', () => {
  it('все пары верны — 1', () => {
    expect(gradeMatching(0, 4)).toBe(1);
  });

  it('каждая неверная пара снимает четверть', () => {
    expect(gradeMatching(1, 4)).toBe(0.75);
    expect(gradeMatching(2, 4)).toBe(0.5);
    expect(gradeMatching(4, 4)).toBe(0);
  });

  it('не уходит в минус и не делит на ноль', () => {
    expect(gradeMatching(9, 4)).toBe(0);
    expect(gradeMatching(0, 0)).toBe(0);
  });
});

describe('cardScore', () => {
  it('переводит самооценку 0..3 в долю', () => {
    expect(cardScore(0)).toBe(0);
    expect(cardScore(2)).toBeCloseTo(2 / 3);
    expect(cardScore(3)).toBe(1);
  });
});

describe('outcomeFromScore', () => {
  it('различает полный, частичный и неверный ответ', () => {
    expect(outcomeFromScore(1)).toBe('correct');
    expect(outcomeFromScore(0.75)).toBe('partial');
    expect(outcomeFromScore(0.34)).toBe('partial');
    expect(outcomeFromScore(0)).toBe('wrong');
  });
});

describe('xpForScore', () => {
  it('масштабирует опыт по сложности', () => {
    expect(xpForScore(1, 1)).toBe(10);
    expect(xpForScore(1, 3)).toBe(30);
    expect(xpForScore(0.5, 2)).toBe(10);
    expect(xpForScore(0, 3)).toBe(0);
  });
});
