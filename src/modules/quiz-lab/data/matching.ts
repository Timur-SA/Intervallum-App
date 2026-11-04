import { MatchingQuestion } from '../types';

/**
 * Задания на установление соответствия.
 * Формат соответствует заданиям ОГЭ по физике на сопоставление величин, приборов и формул.
 */
export const MATCHING_QUESTIONS: MatchingQuestion[] = [
  {
    id: 'oge-match-units',
    topic: 'mechanics',
    source: 'ОГЭ · Единицы измерения',
    prompt: 'Установите соответствие между физической величиной и единицей её измерения.',
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
    id: 'oge-match-devices',
    topic: 'electricity',
    source: 'ОГЭ · Измерительные приборы',
    prompt: 'Установите соответствие между прибором и физической величиной, которую он измеряет.',
    pairs: [
      { id: 'ammeter', left: 'Амперметр', right: 'Сила тока' },
      { id: 'voltmeter', left: 'Вольтметр', right: 'Напряжение' },
      { id: 'thermometer', left: 'Термометр', right: 'Температура' },
      { id: 'dynamometer', left: 'Динамометр', right: 'Сила' },
    ],
    explanation:
      'Амперметр измеряет силу тока, вольтметр — напряжение, термометр — температуру, динамометр — силу.',
  },
  {
    id: 'oge-match-formulas',
    topic: 'mechanics',
    source: 'ОГЭ · Формулы',
    prompt: 'Установите соответствие между формулой и физической величиной, которую она определяет.',
    pairs: [
      { id: 'gravity', left: 'F = mg', right: 'Сила тяжести' },
      { id: 'density', left: 'ρ = m/V', right: 'Плотность' },
      { id: 'work', left: 'A = Fs', right: 'Механическая работа' },
      { id: 'power', left: 'N = A/t', right: 'Мощность' },
    ],
    explanation:
      'F = mg — сила тяжести, ρ = m/V — плотность, A = Fs — механическая работа, N = A/t — мощность.',
  },
];
