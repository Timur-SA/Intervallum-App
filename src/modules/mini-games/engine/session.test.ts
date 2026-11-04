import { describe, expect, it } from 'vitest';
import { earnedStars } from './session';

describe('earnedStars', () => {
  it('даёт звезду за верное обычное задание', () => {
    expect(earnedStars({ isNew: false, isHard: false }, 1)).toBe(1);
  });

  it('даёт две звезды за новое задание', () => {
    expect(earnedStars({ isNew: true, isHard: false }, 1)).toBe(2);
  });

  it('даёт две звезды за сложное задание', () => {
    expect(earnedStars({ isNew: false, isHard: true }, 1)).toBe(2);
  });

  it('не даёт звёзд за частичный или неверный ответ', () => {
    expect(earnedStars({ isNew: true, isHard: true }, 0.5)).toBe(0);
    expect(earnedStars({ isNew: true, isHard: true }, 0)).toBe(0);
  });
});
