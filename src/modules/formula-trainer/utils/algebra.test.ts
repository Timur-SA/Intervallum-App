import { describe, it, expect } from 'vitest';
import { moveTokenInCard, swapSidesInCard, recomputeCards, setVarValueInCard } from './algebra';
import { FormulaCard, PhysicalLaw } from '../types/physics';

const testLaw: PhysicalLaw = {
  id: 'newton_2',
  name: 'Второй закон Ньютона',
  category: 'Механика',
  latex: 'F = m \\cdot a',
  variables: {
    F: { name: 'Сила', unit: 'Н' },
    m: { name: 'Масса', unit: 'кг' },
    a: { name: 'Ускорение', unit: 'м/с²' },
  },
  structure: {
    left: { num: ['F'], den: [] },
    right: { num: ['m', 'a'], den: [] },
  },
};

const createCard = (id = 1): FormulaCard => ({
  id,
  law: testLaw,
  structure: {
    left: { num: [...testLaw.structure.left.num], den: [...testLaw.structure.left.den] },
    right: { num: [...testLaw.structure.right.num], den: [...testLaw.structure.right.den] },
  },
  values: {
    F: { value: 60, source: 'given', ref: null, name: 'Сила', unit: 'Н' },
    m: { value: 15, source: 'given', ref: null, name: 'Масса', unit: 'кг' },
    a: { value: null, source: null, ref: null, name: 'Ускорение', unit: 'м/с²' },
  },
  computed: null,
});

describe('algebra utils', () => {
  it('moves variable to denominator on opposite side to isolate acceleration', () => {
    const card = createCard();
    // Move 'm' from right.num[0] to left.den[0]
    const updated = moveTokenInCard(card, 'right', 'num', 0, 'left', 'den', 0);

    expect(updated.structure.left.num).toEqual(['F']);
    expect(updated.structure.left.den).toEqual(['m']);
    expect(updated.structure.right.num).toEqual(['a']);
    expect(updated.structure.right.den).toEqual([]);

    const recomputed = recomputeCards([updated]);
    expect(recomputed[0].computed).toEqual({
      symbol: 'a',
      value: 4,
      unit: 'м/с²',
    });
  });

  it('reorders tokens within the same row', () => {
    const card = createCard();
    // Move 'm' (index 0) to index 2 (after 'a')
    const reordered = moveTokenInCard(card, 'right', 'num', 0, 'right', 'num', 2);
    expect(reordered.structure.right.num).toEqual(['a', 'm']);
  });

  it('swaps sides of equation correctly', () => {
    const card = createCard();
    const swapped = swapSidesInCard(card);
    expect(swapped.structure.left.num).toEqual(['m', 'a']);
    expect(swapped.structure.right.num).toEqual(['F']);
  });
});
