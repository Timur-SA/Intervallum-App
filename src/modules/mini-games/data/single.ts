import { SingleChoiceTask } from '../domain/types';

/**
 * Задания с одним верным ответом.
 * Формулировки соответствуют типовым заданиям ОГЭ по физике трека 9.
 */
export const SINGLE_TASKS: SingleChoiceTask[] = [
  {
    id: 'single-uniform-motion',
    type: 'single',
    topic: 'uniform-motion',
    difficulty: 1,
    prompt: 'Тело движется равномерно со скоростью 5 м/с. Какой путь оно пройдёт за 4 с?',
    options: [
      { id: 'a', text: '1,25 м' },
      { id: 'b', text: '9 м' },
      { id: 'c', text: '20 м' },
      { id: 'd', text: '0,8 м' },
    ],
    correctOptionId: 'c',
    explanation: 'При равномерном движении s = vt = 5 м/с · 4 с = 20 м.',
    hint: 's = vt',
  },
  {
    id: 'single-relativity',
    type: 'single',
    topic: 'relativity',
    difficulty: 1,
    prompt:
      'Лодка плывёт по течению реки со скоростью 3 м/с относительно воды. Скорость течения 2 м/с. Чему равна скорость лодки относительно берега?',
    options: [
      { id: 'a', text: '1 м/с' },
      { id: 'b', text: '2,5 м/с' },
      { id: 'c', text: '5 м/с' },
      { id: 'd', text: '6 м/с' },
    ],
    correctOptionId: 'c',
    explanation:
      'При движении по течению скорость лодки относительно берега равна сумме скоростей: 3 + 2 = 5 м/с.',
    hint: 'Скорости складываются, когда тело и система отсчёта движутся в одну сторону.',
  },
  {
    id: 'single-acceleration',
    type: 'single',
    topic: 'accelerated-motion',
    difficulty: 2,
    prompt:
      'Тело движется равноускоренно с ускорением 2 м/с². На сколько изменится его скорость за 3 с?',
    options: [
      { id: 'a', text: '0,67 м/с' },
      { id: 'b', text: '1,5 м/с' },
      { id: 'c', text: '6 м/с' },
      { id: 'd', text: '18 м/с' },
    ],
    correctOptionId: 'c',
    explanation: 'Ускорение показывает изменение скорости за секунду: Δv = a · t = 2 · 3 = 6 м/с.',
    hint: 'a = Δv / t',
  },
  {
    id: 'single-gravity',
    type: 'single',
    topic: 'free-fall',
    difficulty: 1,
    prompt:
      'Чему равна сила тяжести, действующая на тело массой 2 кг? Ускорение свободного падения примите равным 10 Н/кг.',
    options: [
      { id: 'a', text: '2 Н' },
      { id: 'b', text: '5 Н' },
      { id: 'c', text: '20 Н' },
      { id: 'd', text: '200 Н' },
    ],
    correctOptionId: 'c',
    explanation: 'F = mg = 2 кг · 10 Н/кг = 20 Н.',
    hint: 'F = mg',
  },
  {
    id: 'single-work',
    type: 'single',
    topic: 'work-power',
    difficulty: 1,
    prompt: 'Груз подняли на высоту 2 м, действуя силой 50 Н. Какую работу при этом совершили?',
    options: [
      { id: 'a', text: '25 Дж' },
      { id: 'b', text: '48 Дж' },
      { id: 'c', text: '100 Дж' },
      { id: 'd', text: '200 Дж' },
    ],
    correctOptionId: 'c',
    explanation: 'Работа силы, направленной вдоль перемещения: A = Fs = 50 Н · 2 м = 100 Дж.',
    hint: 'A = Fs',
  },
  {
    id: 'single-lever',
    type: 'single',
    topic: 'lever',
    difficulty: 2,
    prompt: 'Плечо силы равно 0,5 м, а сама сила — 20 Н. Чему равен момент этой силы?',
    options: [
      { id: 'a', text: '0,025 Н·м' },
      { id: 'b', text: '10 Н·м' },
      { id: 'c', text: '40 Н·м' },
      { id: 'd', text: '100 Н·м' },
    ],
    correctOptionId: 'b',
    explanation: 'Момент силы равен произведению силы на плечо: M = F · l = 20 · 0,5 = 10 Н·м.',
    hint: 'M = F · l',
  },
  {
    id: 'single-heat',
    type: 'single',
    topic: 'heat-amount',
    difficulty: 1,
    prompt:
      'Какое количество теплоты необходимо, чтобы нагреть 1 кг воды на 1 °C? Удельная теплоёмкость воды 4200 Дж/(кг·°C).',
    options: [
      { id: 'a', text: '42 Дж' },
      { id: 'b', text: '420 Дж' },
      { id: 'c', text: '4200 Дж' },
      { id: 'd', text: '42 000 Дж' },
    ],
    correctOptionId: 'c',
    explanation: 'Q = cmΔt = 4200 · 1 · 1 = 4200 Дж.',
    hint: 'Q = cmΔt',
  },
  {
    id: 'single-ohm',
    type: 'single',
    topic: 'ohm',
    difficulty: 1,
    prompt: 'Напряжение на участке цепи равно 12 В, сопротивление участка — 6 Ом. Чему равна сила тока?',
    options: [
      { id: 'a', text: '0,5 А' },
      { id: 'b', text: '2 А' },
      { id: 'c', text: '6 А' },
      { id: 'd', text: '72 А' },
    ],
    correctOptionId: 'b',
    explanation: 'По закону Ома I = U / R = 12 В / 6 Ом = 2 А.',
    hint: 'I = U / R',
  },
  {
    id: 'single-joule-lenz',
    type: 'single',
    topic: 'joule-lenz',
    difficulty: 3,
    prompt:
      'В проводнике сопротивлением 2 Ом течёт ток 3 А в течение 10 с. Какое количество теплоты выделится?',
    options: [
      { id: 'a', text: '60 Дж' },
      { id: 'b', text: '180 Дж' },
      { id: 'c', text: '360 Дж' },
      { id: 'd', text: '600 Дж' },
    ],
    correctOptionId: 'b',
    explanation: 'По закону Джоуля — Ленца Q = I²Rt = 3² · 2 · 10 = 180 Дж.',
    hint: 'Q = I²Rt',
  },
];
