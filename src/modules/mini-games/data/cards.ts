import { TheoryCard } from '../domain/types';

/**
 * Теоретические карточки: вопрос + ответ + самооценка (0..3).
 * Доп. параметр из спеки — сложность вопроса.
 */
export const CARDS: TheoryCard[] = [
  {
    id: 'card-uniform-motion',
    type: 'cards',
    topic: 'uniform-motion',
    difficulty: 1,
    question: 'Как связаны путь, скорость и время при равномерном движении?',
    answer: 'Путь равен произведению скорости на время движения.',
    formula: 's = vt',
  },
  {
    id: 'card-acceleration',
    type: 'cards',
    topic: 'accelerated-motion',
    difficulty: 1,
    question: 'Что показывает ускорение тела?',
    answer:
      'Ускорение показывает, на сколько изменяется скорость тела за единицу времени. Это векторная величина.',
    formula: 'a = Δv / t',
  },
  {
    id: 'card-newton-2',
    type: 'cards',
    topic: 'accelerated-motion',
    difficulty: 2,
    question: 'Сформулируйте второй закон Ньютона.',
    answer:
      'Ускорение тела прямо пропорционально равнодействующей сил и обратно пропорционально массе тела.',
    formula: 'F = ma',
  },
  {
    id: 'card-gravity',
    type: 'cards',
    topic: 'free-fall',
    difficulty: 1,
    question: 'По какой формуле вычисляют силу тяжести?',
    answer: 'Сила тяжести равна произведению массы тела на ускорение свободного падения.',
    formula: 'F = mg',
  },
  {
    id: 'card-momentum',
    type: 'cards',
    topic: 'momentum',
    difficulty: 2,
    question: 'Что называют импульсом тела?',
    answer:
      'Импульс — векторная величина, равная произведению массы тела на его скорость. Направление совпадает со скоростью.',
    formula: 'p = mv',
  },
  {
    id: 'card-energy',
    type: 'cards',
    topic: 'mechanical-energy',
    difficulty: 3,
    question: 'В чём состоит закон сохранения механической энергии?',
    answer:
      'Полная механическая энергия замкнутой системы сохраняется, если силами трения можно пренебречь.',
    formula: 'E = Eк + Eп = const',
  },
  {
    id: 'card-work',
    type: 'cards',
    topic: 'work-power',
    difficulty: 1,
    question: 'Как вычисляют механическую работу и мощность?',
    answer:
      'Работа равна произведению силы на перемещение вдоль её направления. Мощность — работа, совершённая за единицу времени.',
    formula: 'A = Fs, N = A/t',
  },
  {
    id: 'card-lever',
    type: 'cards',
    topic: 'lever',
    difficulty: 2,
    question: 'Как формулируется правило моментов для рычага?',
    answer:
      'Рычаг находится в равновесии, если момент силы, вращающей его по часовой стрелке, равен моменту силы, вращающей против часовой стрелки.',
    formula: 'F₁l₁ = F₂l₂',
  },
  {
    id: 'card-heat',
    type: 'cards',
    topic: 'heat-amount',
    difficulty: 1,
    question: 'Как вычисляют количество теплоты при нагревании тела?',
    answer:
      'Количество теплоты равно произведению удельной теплоёмкости, массы тела и изменения температуры.',
    formula: 'Q = cmΔt',
  },
  {
    id: 'card-aggregate',
    type: 'cards',
    topic: 'aggregate-states',
    difficulty: 2,
    question: 'При какой температуре плавится лёд при нормальном атмосферном давлении?',
    answer: 'При 0 °C. Во время плавления температура не меняется.',
  },
  {
    id: 'card-heat-balance',
    type: 'cards',
    topic: 'heat-balance',
    difficulty: 3,
    question: 'В чём суть уравнения теплового баланса?',
    answer:
      'В замкнутой системе количество теплоты, отданное одними телами, равно количеству теплоты, полученному другими.',
    formula: 'Qотд = Qпол',
  },
  {
    id: 'card-ohm',
    type: 'cards',
    topic: 'ohm',
    difficulty: 1,
    question: 'Сформулируйте закон Ома для участка цепи.',
    answer:
      'Сила тока на участке цепи прямо пропорциональна напряжению и обратно пропорциональна сопротивлению.',
    formula: 'I = U / R',
  },
  {
    id: 'card-joule-lenz',
    type: 'cards',
    topic: 'joule-lenz',
    difficulty: 2,
    question: 'Как рассчитать количество теплоты по закону Джоуля — Ленца?',
    answer:
      'Количество теплоты равно произведению квадрата силы тока, сопротивления и времени протекания тока.',
    formula: 'Q = I²Rt',
  },
  {
    id: 'card-resistance',
    type: 'cards',
    topic: 'resistance',
    difficulty: 2,
    question: 'От чего зависит сопротивление проводника?',
    answer:
      'От материала проводника, его длины и площади поперечного сечения. Температура также влияет на сопротивление.',
    formula: 'R = ρl / S',
  },
];
