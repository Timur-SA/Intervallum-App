import { MatchingTask } from '../domain/types';

/**
 * Задания на установление соответствия: слева — ситуация/явление/формула,
 * справа — вариант ответа. По Core штрафуется каждая неверная пара.
 */
export const MATCHING_TASKS: MatchingTask[] = [
  {
    id: 'match-formulas',
    type: 'matching',
    topic: 'work-power',
    difficulty: 1,
    prompt: 'Установите соответствие между формулой и физической величиной, которую она определяет.',
    pairs: [
      { id: 'work', left: '$A = Fs$', right: 'Механическая работа' },
      { id: 'power', left: '$N = \\frac{A}{t}$', right: 'Мощность' },
      { id: 'gravity', left: '$F = mg$', right: 'Сила тяжести' },
      { id: 'momentum', left: '$p = mv$', right: 'Импульс тела' },
    ],
    explanation:
      '$A = Fs$ — работа, $N = \\frac{A}{t}$ — мощность, $F = mg$ — сила тяжести, $p = mv$ — импульс тела.',
  },
  {
    id: 'match-units',
    type: 'matching',
    topic: 'work-power',
    difficulty: 1,
    prompt: 'Установите соответствие между физической величиной и единицей её измерения в СИ.',
    pairs: [
      { id: 'force', left: 'Сила', right: 'Ньютон (Н)' },
      { id: 'work', left: 'Работа', right: 'Джоуль (Дж)' },
      { id: 'power', left: 'Мощность', right: 'Ватт (Вт)' },
      { id: 'pressure', left: 'Давление', right: 'Паскаль (Па)' },
    ],
    explanation:
      'Сила измеряется в ньютонах, работа — в джоулях, мощность — в ваттах, давление — в паскалях.',
  },
  {
    id: 'match-aggregate',
    type: 'matching',
    topic: 'aggregate-states',
    difficulty: 2,
    prompt: 'Установите соответствие между процессом и переходом между агрегатными состояниями.',
    pairs: [
      { id: 'melting', left: 'Плавление', right: 'Твёрдое → жидкое' },
      { id: 'crystallization', left: 'Кристаллизация', right: 'Жидкое → твёрдое' },
      { id: 'vaporization', left: 'Парообразование', right: 'Жидкое → газообразное' },
      { id: 'condensation', left: 'Конденсация', right: 'Газообразное → жидкое' },
    ],
    explanation:
      'Плавление — переход из твёрдого состояния в жидкое, кристаллизация — обратный процесс. Парообразование и конденсация — переходы между жидкостью и газом.',
  },
  {
    id: 'match-heat-formulas',
    type: 'matching',
    topic: 'fuel-engines',
    difficulty: 2,
    prompt: 'Установите соответствие между формулой и тепловым процессом.',
    pairs: [
      { id: 'heating', left: '$Q = cm\\Delta t$', right: 'Нагревание' },
      { id: 'melting', left: '$Q = \\lambda m$', right: 'Плавление' },
      { id: 'vaporization', left: '$Q = Lm$', right: 'Парообразование' },
      { id: 'fuel', left: '$Q = qm$', right: 'Сгорание топлива' },
    ],
    explanation:
      '$Q = cm\\Delta t$ — нагревание, $Q = \\lambda m$ — плавление, $Q = Lm$ — парообразование, $Q = qm$ — сгорание топлива.',
  },
  {
    id: 'match-devices',
    type: 'matching',
    topic: 'ohm',
    difficulty: 1,
    prompt: 'Установите соответствие между прибором и физической величиной, которую он измеряет.',
    pairs: [
      { id: 'ammeter', left: 'Амперметр', right: 'Сила тока' },
      { id: 'voltmeter', left: 'Вольтметр', right: 'Напряжение' },
      { id: 'ohmmeter', left: 'Омметр', right: 'Сопротивление' },
      { id: 'wattmeter', left: 'Ваттметр', right: 'Мощность' },
    ],
    explanation:
      'Амперметр измеряет силу тока, вольтметр — напряжение, омметр — сопротивление, ваттметр — мощность.',
  },
  {
    id: 'match-kinematics',
    type: 'matching',
    topic: 'accelerated-motion',
    difficulty: 2,
    prompt: 'Установите соответствие между формулой и физической величиной.',
    pairs: [
      { id: 'speed', left: '$v = \\frac{s}{t}$', right: 'Скорость' },
      { id: 'path', left: '$s = vt$', right: 'Путь' },
      { id: 'accel', left: '$a = \\frac{\\Delta v}{\\Delta t}$', right: 'Ускорение' },
      { id: 'force', left: '$F = ma$', right: 'Сила' },
    ],
    explanation:
      '$v = \\frac{s}{t}$ — скорость, $s = vt$ — путь при равномерном движении, $a = \\frac{\\Delta v}{\\Delta t}$ — ускорение, $F = ma$ — второй закон Ньютона.',
  },
  {
    id: 'match-electric-units',
    type: 'matching',
    topic: 'resistance',
    difficulty: 2,
    prompt: 'Установите соответствие между электрической величиной и единицей СИ.',
    pairs: [
      { id: 'current', left: 'Сила тока', right: 'Ампер (А)' },
      { id: 'voltage', left: 'Напряжение', right: 'Вольт (В)' },
      { id: 'resistance', left: 'Сопротивление', right: 'Ом (Ом)' },
      { id: 'charge', left: 'Электрический заряд', right: 'Кулон (Кл)' },
    ],
    explanation:
      'Сила тока — ампер, напряжение — вольт, сопротивление — ом, заряд — кулон.',
  },
];
