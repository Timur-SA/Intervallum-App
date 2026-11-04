import { describe, expect, it } from 'vitest';
import { earnedStars } from './session';

describe('earnedStars', () => {
  it('даёт звезду за верную новую задачу в тренировке', () => {
    expect(earnedStars({ isNew: true, isHard: false }, 1, true)).toBe(1);
  });

  it('даёт звезду за верную сложную задачу', () => {
    expect(earnedStars({ isNew: false, isHard: true }, 1, true)).toBe(1);
  });

  it('не даёт звезду за частичный ответ', () => {
    expect(earnedStars({ isNew: true, isHard: true }, 0.5, true)).toBe(0);
  });

  it('не даёт звезду за обычную задачу', () => {
    expect(earnedStars({ isNew: false, isHard: false }, 1, true)).toBe(0);
  });

  it('не даёт звёзд вне тренировки', () => {
    expect(earnedStars({ isNew: true, isHard: true }, 1, false)).toBe(0);
  });
});
