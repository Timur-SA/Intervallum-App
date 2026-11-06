import { PhysicsTask } from '../types/physics';

export const PHYSICS_TASKS: PhysicsTask[] = [
  {
    id: 'task_ohm_resistance',
    title: 'Закон Ома: Сопротивление реостата',
    category: 'Электричество',
    difficulty: 1,
    description: 'В электрической цепи при напряжении $U = 12\\text{ В}$ сила тока составляет $I = 2\\text{ А}$. Определите электрическое сопротивление реостата $R$.',
    givens: [
      { symbol: 'U', value: 12, unit: 'В', displayLabel: 'Напряжение' },
      { symbol: 'I', value: 2, unit: 'А', displayLabel: 'Сила тока' }
    ],
    find: {
      symbol: 'R',
      unit: 'Ом',
      value: 6,
      targetFormula: 'R = U / I'
    },
    hint: 'Добавьте закон Ома ($I = \\frac{U}{R}$) и перетяните буквы так, чтобы выразить R ($R = \\frac{U}{I}$), затем подставьте значения.',
    explanation: 'Из закона Ома $I = \\frac{U}{R}$ выражаем сопротивление: $R = \\frac{U}{I} = \\frac{12\\text{ В}}{2\\text{ А}} = 6\\text{ Ом}$.'
  },
  {
    id: 'task_newton_accel',
    title: 'Второй закон Ньютона: Ускорение',
    category: 'Механика',
    difficulty: 1,
    description: 'На тело массой $m = 15\\text{ кг}$ действует постоянная сила $F = 60\\text{ Н}$. Найдите ускорение тела $a$.',
    givens: [
      { symbol: 'F', value: 60, unit: 'Н', displayLabel: 'Сила' },
      { symbol: 'm', value: 15, unit: 'кг', displayLabel: 'Масса' }
    ],
    find: {
      symbol: 'a',
      unit: 'м/с²',
      value: 4,
      targetFormula: 'a = F / m'
    },
    hint: 'Используйте второй закон Ньютона ($F = m\\cdot a$). Перенесите массу m в знаменатель левой части или правую для выражения a.',
    explanation: 'Из второго закона Ньютона $F = m \\cdot a$ выражаем ускорение: $a = \\frac{F}{m} = \\frac{60}{15} = 4\\text{ м/с}^2$.'
  },
  {
    id: 'task_electric_current_power',
    title: 'Мощность: Сила тока лампы',
    category: 'Электричество',
    difficulty: 1,
    description: 'Лампа накаливания мощностью $P = 110\\text{ Вт}$ включена в сеть с напряжением $U = 220\\text{ В}$. Найдите силу тока $I$ в нити накала.',
    givens: [
      { symbol: 'P', value: 110, unit: 'Вт', displayLabel: 'Мощность' },
      { symbol: 'U', value: 220, unit: 'В', displayLabel: 'Напряжение' }
    ],
    find: {
      symbol: 'I',
      unit: 'А',
      value: 0.5,
      targetFormula: 'I = P / U'
    },
    hint: 'Добавьте формулу мощности $P = U\\cdot I$ и выразите силу тока I, перенеся напряжение U в знаменатель к мощности P.',
    explanation: 'Из формулы мощности $P = U \\cdot I$ выражаем ток: $I = \\frac{P}{U} = \\frac{110}{220} = 0.5\\text{ А}$.'
  },
  {
    id: 'task_density_volume',
    title: 'Плотность: Объём медной детали',
    category: 'Механика',
    difficulty: 2,
    description: 'Масса медного слитка равна $m = 4450\\text{ кг}$, а плотность меди $\\rho = 8900\\text{ кг/м}^3$. Вычислите объем слитка $V$.',
    givens: [
      { symbol: 'm', value: 4450, unit: 'кг', displayLabel: 'Масса' },
      { symbol: 'ρ', value: 8900, unit: 'кг/м³', displayLabel: 'Плотность' }
    ],
    find: {
      symbol: 'V',
      unit: 'м³',
      value: 0.5,
      targetFormula: 'V = m / ρ'
    },
    hint: 'Из формулы плотности $\\rho = \\frac{m}{V}$ нужно выразить V: перенесите V наверх в другую сторону, а ρ — вниз.',
    explanation: 'Из определения плотности $\\rho = \\frac{m}{V}$ выражаем объем: $V = \\frac{m}{\\rho} = \\frac{4450}{8900} = 0.5\\text{ м}^3$.'
  },
  {
    id: 'task_work_and_power',
    title: 'Комплексная: Электродвигатель подъёмника',
    category: 'Электричество',
    difficulty: 3,
    description: 'Электродвигатель подъёмника подключен к сети напряжением $U = 50\\text{ В}$. За время $t = 20\\text{ с}$ он совершил работу $A = 2000\\text{ Дж}$. Определите силу тока $I$ в двигателе.',
    givens: [
      { symbol: 'A', value: 2000, unit: 'Дж', displayLabel: 'Работа' },
      { symbol: 't', value: 20, unit: 'с', displayLabel: 'Время' },
      { symbol: 'U', value: 50, unit: 'В', displayLabel: 'Напряжение' }
    ],
    find: {
      symbol: 'I',
      unit: 'А',
      value: 2,
      targetFormula: 'I = P / U'
    },
    hint: 'Задача решается в два шага: 1) Найдите мощность через $N = \\frac{A}{t}$. 2) Используйте формулу мощности тока $P = U\\cdot I$ (где $P = N$), выразите I и подставьте найденную мощность.',
    explanation: '1) Мощность: $N = \\frac{A}{t} = \\frac{2000}{20} = 100\\text{ Вт}$. 2) Сила тока: $I = \\frac{P}{U} = \\frac{100}{50} = 2\\text{ А}$.'
  },
  {
    id: 'task_ampere_conductor',
    title: 'Сила Ампера: Индукция поля',
    category: 'Электричество',
    difficulty: 2,
    description: 'Прямолинейный проводник длиной $L = 0.5\\text{ м}$, по которому течет ток $I = 4\\text{ А}$, находится в однородном магнитном поле. На проводник действует сила $F = 0.8\\text{ Н}$. Найдите магнитную индукцию поля $B$.',
    givens: [
      { symbol: 'F', value: 0.8, unit: 'Н', displayLabel: 'Сила Ампера' },
      { symbol: 'I', value: 4, unit: 'А', displayLabel: 'Сила тока' },
      { symbol: 'L', value: 0.5, unit: 'м', displayLabel: 'Длина' }
    ],
    find: {
      symbol: 'B',
      unit: 'Тл',
      value: 0.4,
      targetFormula: 'B = F / (I · L)'
    },
    hint: 'Добавьте силу Ампера ($F = I\\cdot B\\cdot L$), перенесите I и L в знаменатель к F, чтобы выразить B.',
    explanation: 'Из формулы силы Ампера $F = I \\cdot B \\cdot L$ выражаем $B$: $B = \\frac{F}{I \\cdot L} = \\frac{0.8}{4 \\cdot 0.5} = 0.4\\text{ Тл}$.'
  }
];
