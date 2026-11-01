import { FormulaCard, ComputedResult } from '../types/physics';

/**
 * Перемещение символа переменной внутри алгебраической структуры
 */
export function moveTokenInCard(
  card: FormulaCard,
  fromSide: 'left' | 'right',
  fromPos: 'num' | 'den',
  fromIdx: number,
  toSide: 'left' | 'right',
  toPos: 'num' | 'den',
  toIdx: number
): FormulaCard {
  const newStructure = {
    left: { num: [...card.structure.left.num], den: [...card.structure.left.den] },
    right: { num: [...card.structure.right.num], den: [...card.structure.right.den] }
  };

  const sourceArr = newStructure[fromSide][fromPos];
  const [symbol] = sourceArr.splice(fromIdx, 1);
  if (!symbol) return card;

  const targetArr = newStructure[toSide][toPos];
  let insertIdx = toIdx;
  if (fromSide === toSide && fromPos === toPos && fromIdx < toIdx) {
    insertIdx = Math.max(0, toIdx - 1);
  }
  targetArr.splice(insertIdx, 0, symbol);

  return {
    ...card,
    structure: newStructure
  };
}

/**
 * Разворот уравнения (смена левой и правой части местами)
 */
export function swapSidesInCard(card: FormulaCard): FormulaCard {
  return {
    ...card,
    structure: {
      left: { num: [...card.structure.right.num], den: [...card.structure.right.den] },
      right: { num: [...card.structure.left.num], den: [...card.structure.left.den] }
    }
  };
}

/**
 * Задание численного значения переменной
 */
export function setVarValueInCard(
  card: FormulaCard,
  symbol: string,
  value: number,
  source: 'given' | 'link' | 'manual',
  ref: { cardId: number; symbol: string } | null = null
): FormulaCard {
  if (!card.values[symbol]) return card;

  return {
    ...card,
    values: {
      ...card.values,
      [symbol]: {
        ...card.values[symbol],
        value,
        source,
        ref
      }
    }
  };
}

/**
 * Очистка значения переменной
 */
export function clearVarValueInCard(card: FormulaCard, symbol: string): FormulaCard {
  if (!card.values[symbol]) return card;

  return {
    ...card,
    values: {
      ...card.values,
      [symbol]: {
        ...card.values[symbol],
        value: null,
        source: null,
        ref: null
      }
    }
  };
}

/**
 * Реактивный пересчёт цепочки формул (в стиле Jupyter Notebook)
 */
export function recomputeCards(cards: FormulaCard[]): FormulaCard[] {
  let updated = [...cards];

  // 3 прохода для разрешения многостадийных связей
  for (let pass = 0; pass < 3; pass++) {
    updated = updated.map(card => {
      // 1. Обновляем ссылки на другие карточки
      const nextValues = { ...card.values };
      for (const [sym, valObj] of Object.entries(nextValues)) {
        if (valObj.ref) {
          const srcCard = updated.find(c => c.id === valObj.ref!.cardId);
          if (srcCard && srcCard.computed && srcCard.computed.value !== null) {
            nextValues[sym] = { ...valObj, value: srcCard.computed.value };
          } else {
            nextValues[sym] = { ...valObj, value: null };
          }
        }
      }

      // 2. Расчет левой части (изолированная переменная)
      const left = card.structure.left;
      const right = card.structure.right;
      let computed: ComputedResult | null = null;

      // СЛУЧАЙ 1: Левая часть изолирована (1 переменная в числителе, знаменатель пуст)
      if (left.num.length === 1 && left.den.length === 0) {
        const targetSym = left.num[0];
        const targetInfo = nextValues[targetSym];
        const rightSyms = [...right.num, ...right.den];
        const missing = rightSyms.filter(s => nextValues[s] && nextValues[s].value === null);

        if (missing.length === 0 && rightSyms.length > 0) {
          const numProduct = right.num.reduce((prod, s) => prod * (nextValues[s]?.value ?? 1), 1);
          const denProduct = right.den.length > 0
            ? right.den.reduce((prod, s) => prod * (nextValues[s]?.value ?? 1), 1)
            : 1;

          if (denProduct !== 0) {
            computed = {
              symbol: targetSym,
              value: numProduct / denProduct,
              unit: targetInfo ? targetInfo.unit : ''
            };
          }
        }
      }
      // СЛУЧАЙ 2: Правая часть изолирована
      else if (right.num.length === 1 && right.den.length === 0 && left.num.length > 0) {
        const targetSym = right.num[0];
        const targetInfo = nextValues[targetSym];
        const leftSyms = [...left.num, ...left.den];
        const missing = leftSyms.filter(s => nextValues[s] && nextValues[s].value === null);

        if (missing.length === 0) {
          const numProduct = left.num.reduce((prod, s) => prod * (nextValues[s]?.value ?? 1), 1);
          const denProduct = left.den.length > 0
            ? left.den.reduce((prod, s) => prod * (nextValues[s]?.value ?? 1), 1)
            : 1;

          if (denProduct !== 0) {
            computed = {
              symbol: targetSym,
              value: numProduct / denProduct,
              unit: targetInfo ? targetInfo.unit : ''
            };
          }
        }
      }

      return {
        ...card,
        values: nextValues,
        computed
      };
    });
  }

  return updated;
}
