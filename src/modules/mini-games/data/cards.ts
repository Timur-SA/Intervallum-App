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
    id: 'card-relativity',
    type: 'cards',
    topic: 'relativity',
    difficulty: 2,
    question: 'Что означает относительность движения?',
    answer:
      'Движение и его характеристики зависят от выбранной системы отсчёта: одно и то же тело может покоиться в одной системе и двигаться в другой.',
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
    id: 'card-thermal-energy',
    type: 'cards',
    topic: 'thermal-energy',
    difficulty: 3,
    question: 'Как формулируется первый закон термодинамики?',
    answer:
      'Полученная телом теплота идёт на изменение его внутренней энергии и на совершение работы против внешних сил.',
    formula: 'Q = ΔU + A',
  },
  {
    id: 'card-fuel-engines',
    type: 'cards',
    topic: 'fuel-engines',
    difficulty: 2,
    question: 'Как вычисляют КПД теплового двигателя?',
    answer:
      'КПД равен отношению полезной работы к количеству теплоты, полученному от нагревателя. Он всегда меньше 100%.',
    formula: 'η = Aп / Qн',
  },
  {
    id: 'card-coulomb',
    type: 'cards',
    topic: 'coulomb',
    difficulty: 2,
    question: 'Сформулируйте закон Кулона.',
    answer:
      'Сила взаимодействия двух точечных зарядов прямо пропорциональна произведению модулей зарядов и обратно пропорциональна квадрату расстояния между ними.',
    formula: 'F = k|q₁||q₂| / r²',
  },
  {
    id: 'card-charge-conservation',
    type: 'cards',
    topic: 'charge-conservation',
    difficulty: 2,
    question: 'В чём состоит закон сохранения электрического заряда?',
    answer:
      'Алгебраическая сумма зарядов замкнутой системы остаётся постоянной при любых процессах внутри системы.',
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
    id: 'card-ampere',
    type: 'cards',
    topic: 'ampere',
    difficulty: 3,
    question: 'Что такое сила Ампера и по какой формуле её вычисляют?',
    answer:
      'Сила, действующая на проводник с током в магнитном поле. Максимальна, когда проводник перпендикулярен линиям индукции.',
    formula: 'F = BIl sin α',
  },
];
