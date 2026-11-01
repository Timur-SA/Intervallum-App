import { PhysicalLaw } from '../types/physics';

export const PHYSICS_LAWS: PhysicalLaw[] = [
  // ── ЭЛЕКТРИЧЕСТВО ──────────────────────────────────────────────
  {
    id: 'ohm_law',
    name: 'Закон Ома для участка цепи',
    category: 'Электричество',
    latex: 'I = \\frac{U}{R}',
    structure: {
      left: { num: ['I'], den: [] },
      right: { num: ['U'], den: ['R'] }
    },
    variables: {
      'I': { name: 'Сила тока', unit: 'А' },
      'U': { name: 'Напряжение', unit: 'В' },
      'R': { name: 'Сопротивление', unit: 'Ом' }
    }
  },
  {
    id: 'electric_power',
    name: 'Мощность электрического тока',
    category: 'Электричество',
    latex: 'P = U \\cdot I',
    structure: {
      left: { num: ['P'], den: [] },
      right: { num: ['U', 'I'], den: [] }
    },
    variables: {
      'P': { name: 'Мощность', unit: 'Вт' },
      'U': { name: 'Напряжение', unit: 'В' },
      'I': { name: 'Сила тока', unit: 'А' }
    }
  },
  {
    id: 'ampere_force',
    name: 'Сила Ампера',
    category: 'Электричество',
    latex: 'F = I \\cdot B \\cdot L',
    structure: {
      left: { num: ['F'], den: [] },
      right: { num: ['I', 'B', 'L'], den: [] }
    },
    variables: {
      'F': { name: 'Сила Ампера', unit: 'Н' },
      'I': { name: 'Сила тока', unit: 'А' },
      'B': { name: 'Магнитная индукция', unit: 'Тл' },
      'L': { name: 'Длина проводника', unit: 'м' }
    }
  },

  // ── МЕХАНИКА ──────────────────────────────────────────────────
  {
    id: 'newton_second',
    name: 'Второй закон Ньютона',
    category: 'Механика',
    latex: 'F = m \\cdot a',
    structure: {
      left: { num: ['F'], den: [] },
      right: { num: ['m', 'a'], den: [] }
    },
    variables: {
      'F': { name: 'Сила', unit: 'Н' },
      'm': { name: 'Масса', unit: 'кг' },
      'a': { name: 'Ускорение', unit: 'м/с²' }
    }
  },
  {
    id: 'velocity_uniform',
    name: 'Скорость равномерного движения',
    category: 'Механика',
    latex: 'v = \\frac{s}{t}',
    structure: {
      left: { num: ['v'], den: [] },
      right: { num: ['s'], den: ['t'] }
    },
    variables: {
      'v': { name: 'Скорость', unit: 'м/с' },
      's': { name: 'Путь', unit: 'м' },
      't': { name: 'Время', unit: 'с' }
    }
  },
  {
    id: 'work_mechanic',
    name: 'Механическая работа',
    category: 'Механика',
    latex: 'A = F \\cdot s',
    structure: {
      left: { num: ['A'], den: [] },
      right: { num: ['F', 's'], den: [] }
    },
    variables: {
      'A': { name: 'Работа', unit: 'Дж' },
      'F': { name: 'Сила', unit: 'Н' },
      's': { name: 'Перемещение', unit: 'м' }
    }
  },
  {
    id: 'power_mechanic',
    name: 'Механическая мощность',
    category: 'Механика',
    latex: 'N = \\frac{A}{t}',
    structure: {
      left: { num: ['N'], den: [] },
      right: { num: ['A'], den: ['t'] }
    },
    variables: {
      'N': { name: 'Мощность', unit: 'Вт' },
      'A': { name: 'Работа', unit: 'Дж' },
      't': { name: 'Время', unit: 'с' }
    }
  },
  {
    id: 'momentum',
    name: 'Импульс тела',
    category: 'Механика',
    latex: 'p = m \\cdot v',
    structure: {
      left: { num: ['p'], den: [] },
      right: { num: ['m', 'v'], den: [] }
    },
    variables: {
      'p': { name: 'Импульс', unit: 'кг·м/с' },
      'm': { name: 'Масса', unit: 'кг' },
      'v': { name: 'Скорость', unit: 'м/с' }
    }
  },
  {
    id: 'density',
    name: 'Плотность вещества',
    category: 'Механика',
    latex: '\\rho = \\frac{m}{V}',
    structure: {
      left: { num: ['ρ'], den: [] },
      right: { num: ['m'], den: ['V'] }
    },
    variables: {
      'ρ': { name: 'Плотность', unit: 'кг/м³' },
      'm': { name: 'Масса', unit: 'кг' },
      'V': { name: 'Объем', unit: 'м³' }
    }
  },
  {
    id: 'gravity_force',
    name: 'Сила тяжести',
    category: 'Механика',
    latex: 'F = m \\cdot g',
    structure: {
      left: { num: ['F'], den: [] },
      right: { num: ['m', 'g'], den: [] }
    },
    variables: {
      'F': { name: 'Сила тяжести', unit: 'Н' },
      'm': { name: 'Масса', unit: 'кг' },
      'g': { name: 'Ускорение своб. падения', unit: 'м/с²' }
    }
  },

  // ── ТЕРМОДИНАМИКА ─────────────────────────────────────────────
  {
    id: 'heat_transfer',
    name: 'Количество теплоты при нагревании',
    category: 'Термодинамика',
    latex: 'Q = c \\cdot m \\cdot \\Delta T',
    structure: {
      left: { num: ['Q'], den: [] },
      right: { num: ['c', 'm', 'ΔT'], den: [] }
    },
    variables: {
      'Q': { name: 'Количество теплоты', unit: 'Дж' },
      'c': { name: 'Удельная теплоемкость', unit: 'Дж/(кг·°C)' },
      'm': { name: 'Масса', unit: 'кг' },
      'ΔT': { name: 'Изменение температуры', unit: '°C' }
    }
  }
];
