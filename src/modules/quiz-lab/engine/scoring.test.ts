import { describe, expect, it } from 'vitest';
import {
  multiChoiceCredit,
  scoreMultiChoice,
  shuffleBySeed,
  starsForGame,
  starsForRatio,
} from './scoring';

describe('starsForRatio', () => {
  it('даёт 3 звезды при точности от 90%', () => {
    expect(starsForRatio(1)).toBe(3);
    expect(starsForRatio(0.9)).toBe(3);
  });

  it('даёт 2 звезды при точности от 70%', () => {
    expect(starsForRatio(0.89)).toBe(2);
    expect(starsForRatio(0.7)).toBe(2);
  });

  it('даёт 1 звезду при любом ненулевом результате', () => {
    expect(starsForRatio(0.69)).toBe(1);
    expect(starsForRatio(0.01)).toBe(1);
  });

  it('даёт 0 звёзд при нулевом или некорректном результате', () => {
    expect(starsForRatio(0)).toBe(0);
    expect(starsForRatio(-1)).toBe(0);
    expect(starsForRatio(Number.NaN)).toBe(0);
  });
});

describe('starsForGame', () => {
  it('считает звёзды по доле верных ответов', () => {
    expect(starsForGame(6, 6)).toBe(3);
    expect(starsForGame(5, 6)).toBe(2);
    expect(starsForGame(2, 6)).toBe(1);
    expect(starsForGame(0, 6)).toBe(0);
  });

  it('не делит на ноль при пустой игре', () => {
    expect(starsForGame(0, 0)).toBe(0);
  });
});

describe('scoreMultiChoice', () => {
  const correct = ['a', 'b'];

  it('засчитывает полный ответ', () => {
    expect(scoreMultiChoice(['a', 'b'], correct)).toBe('full');
    expect(scoreMultiChoice(['b', 'a'], correct)).toBe('full');
  });

  it('засчитывает частичный ответ без ошибок', () => {
    expect(scoreMultiChoice(['a'], correct)).toBe('partial');
  });

  it('не засчитывает ответ с лишним вариантом', () => {
    expect(scoreMultiChoice(['a', 'b', 'c'], correct)).toBe('none');
  });

  it('не засчитывает ответ только с неверными вариантами', () => {
    expect(scoreMultiChoice(['c'], correct)).toBe('none');
    expect(scoreMultiChoice([], correct)).toBe('none');
  });
});

describe('multiChoiceCredit', () => {
  it('даёт 1 за полный, 0.5 за частичный и 0 за неверный', () => {
    expect(multiChoiceCredit('full')).toBe(1);
    expect(multiChoiceCredit('partial')).toBe(0.5);
    expect(multiChoiceCredit('none')).toBe(0);
  });
});

describe('shuffleBySeed', () => {
  const items = ['a', 'b', 'c', 'd'];

  it('не теряет элементы', () => {
    expect([...shuffleBySeed(items, 'seed')].sort()).toEqual([...items].sort());
  });

  it('детерминирован для одного seed', () => {
    expect(shuffleBySeed(items, 'seed')).toEqual(shuffleBySeed(items, 'seed'));
  });

  it('не мутирует исходный массив', () => {
    const source = [...items];
    shuffleBySeed(source, 'seed');
    expect(source).toEqual(items);
  });
});
