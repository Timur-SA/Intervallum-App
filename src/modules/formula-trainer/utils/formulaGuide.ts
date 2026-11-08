import type { EquationSide, FormulaCard, PhysicsTask } from '../types/physics';

interface GuidedFormula {
  lawId: string;
  target: string;
  numerator: string[];
  denominator: string[];
  choose: string;
  rearrange?: string;
  link?: { from: string; to: string };
}

const currentFromPower: GuidedFormula = {
  lawId: 'electric_power',
  target: 'I',
  numerator: ['P'],
  denominator: ['U'],
  choose: 'Мощность, напряжение и ток связывает формула «Мощность электрического тока». Добавь её из каталога.',
  rearrange: String.raw`Раздели обе части на $U$. Перетащи $U$ под $P$, чтобы получить $I = \frac{P}{U}$.`,
};

const plans: Record<string, GuidedFormula[]> = {
  task_newton_accel: [{
    lawId: 'newton_second',
    target: 'a',
    numerator: ['F'],
    denominator: ['m'],
    choose: 'Даны сила и масса, нужно ускорение. Их связывает «Второй закон Ньютона». Добавь его из каталога.',
    rearrange: String.raw`Раздели обе части на $m$. Перетащи $m$ под $F$, чтобы получить $a = \frac{F}{m}$.`,
  }],
  task_ohm_resistance: [{
    lawId: 'ohm_law',
    target: 'R',
    numerator: ['U'],
    denominator: ['I'],
    choose: 'Напряжение, ток и сопротивление связывает закон Ома. Добавь его из каталога.',
    rearrange: 'Умножь обе части на $R$, затем раздели на $I$. Перетащи $R$ к $I$ в числитель, а $I$ под $U$.',
  }],
  task_electric_current_power: [currentFromPower],
  task_density_volume: [{
    lawId: 'density',
    target: 'V',
    numerator: ['m'],
    denominator: ['ρ'],
    choose: 'Массу и объём связывает «Плотность вещества». Добавь эту формулу из каталога.',
    rearrange: String.raw`Умножь обе части на $V$, затем раздели на $\rho$. Перетащи $V$ к $\rho$ в числитель, а $\rho$ под $m$.`,
  }],
  task_ampere_conductor: [{
    lawId: 'ampere_force',
    target: 'B',
    numerator: ['F'],
    denominator: ['I', 'L'],
    choose: 'Чтобы связать индукцию с силой, током и длиной провода, добавь формулу «Сила Ампера».',
    rearrange: String.raw`Раздели обе части на $I \cdot L$. По очереди перенеси $I$ и $L$ под $F$.`,
  }],
  task_work_and_power: [
    {
      lawId: 'power_mechanic',
      target: 'N',
      numerator: ['A'],
      denominator: ['t'],
      choose: 'Ток пока не найти. Сначала вычисли мощность по работе и времени. Добавь «Механическая мощность».',
    },
    { ...currentFromPower, link: { from: 'N', to: 'P' } },
  ],
};

type GuideStep = {
  title: string;
  text: string;
};

export const hasFormulaGuide = (task: PhysicsTask): boolean => Boolean(plans[task.id]);

const sameSymbols = (actual: string[], expected: string[]): boolean =>
  actual.length === expected.length && expected.every(symbol => actual.includes(symbol));

function matchesFormula(card: FormulaCard, formula: GuidedFormula): boolean {
  const matchesSides = (target: EquationSide, expression: EquationSide) =>
    sameSymbols(target.num, [formula.target]) &&
    target.den.length === 0 &&
    sameSymbols(expression.num, formula.numerator) &&
    sameSymbols(expression.den, formula.denominator);

  const { left, right } = card.structure;
  return matchesSides(left, right) || matchesSides(right, left);
}

export function getFormulaGuideStep(
  task: PhysicsTask,
  cards: FormulaCard[],
  answer: { symbol: string; value: number } | null,
): GuideStep | null {
  const plan = plans[task.id];
  if (!plan) return null;

  const knownValues = new Map(task.givens.map(given => [given.symbol, given.value]));

  for (const formula of plan) {
    const candidates = cards.filter(card => card.law.id === formula.lawId);
    if (!candidates.length) return { title: 'Выбери закон', text: formula.choose };

    const arranged = candidates.filter(card => matchesFormula(card, formula));
    if (!arranged.length) {
      return {
        title: 'Вырази нужную величину',
        text: formula.rearrange ?? 'Оставь искомую букву одну с одной стороны равенства.',
      };
    }

    if (formula.link) {
      const { from, to } = formula.link;
      const value = knownValues.get(from);
      if (value === undefined || !arranged.some(card => card.values[to]?.value === value)) {
        return {
          title: 'Свяжи две формулы',
          text: 'Здесь $P$ равна найденной мощности $N$. Нажми $P$ и выбери результат $N$ из первой формулы.',
        };
      }
      knownValues.set(to, value);
    }

    const symbols = [...formula.numerator, ...formula.denominator];
    const computed = arranged.find(card =>
      card.computed && symbols.every(symbol => card.values[symbol]?.value === knownValues.get(symbol)),
    )?.computed;
    if (!computed) {
      return {
        title: 'Подставь данные',
        text: 'Перетащи значения из условия на те же буквы в формуле. Можно нажать на букву и выбрать значение.',
      };
    }

    knownValues.set(formula.target, computed.value);
  }

  return answer?.symbol === task.find.symbol &&
    answer.value === knownValues.get(task.find.symbol)
    ? { title: 'Проверь ответ', text: 'Убедись, что в ответе нужная величина и единицы. Нажми «Проверить».' }
    : { title: 'Перенеси результат', text: 'Перетащи плашку с числом под формулой в поле «Ответ».' };
}
