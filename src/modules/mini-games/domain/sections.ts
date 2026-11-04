import { Section, SectionId, Topic, TopicId } from './types';

/**
 * Разделы и темы трека 9 (ОГЭ) из Intervallum-Core.
 * Порядок и формулировки тем повторяют спеку.
 */
export const SECTIONS: Section[] = [
  {
    id: 'mechanics',
    title: 'Механика',
    boss: 'Ньютон',
    item: 'Маятник Ньютона',
    itemId: 'newton-pendulum',
    color: '#0ea5e9',
    topics: [
      'uniform-motion',
      'relativity',
      'accelerated-motion',
      'free-fall',
      'momentum',
      'mechanical-energy',
      'work-power',
      'lever',
      'density',
    ],
  },
  {
    id: 'thermal',
    title: 'Тепловые явления',
    boss: 'лорд Кельвин',
    item: 'Термометр',
    itemId: 'thermometer',
    color: '#f59e0b',
    topics: [
      'heat-amount',
      'aggregate-states',
      'heat-balance',
      'thermal-energy',
      'fuel-engines',
    ],
  },
  {
    id: 'electromagnetism',
    title: 'Электромагнитные явления',
    boss: 'Тесла',
    item: 'Тесла-шар',
    itemId: 'tesla-ball',
    color: '#8b5cf6',
    topics: ['coulomb', 'charge-conservation', 'resistance', 'ohm', 'joule-lenz', 'ampere'],
  },
];

export const TOPICS: Topic[] = [
  { id: 'uniform-motion', title: 'Равномерное прямолинейное движение', section: 'mechanics' },
  { id: 'relativity', title: 'Относительность движения', section: 'mechanics' },
  { id: 'accelerated-motion', title: 'Равноускоренное движение. Сила', section: 'mechanics' },
  { id: 'free-fall', title: 'Свободное падение', section: 'mechanics' },
  { id: 'momentum', title: 'Импульс. Закон сохранения импульса', section: 'mechanics' },
  { id: 'mechanical-energy', title: 'Полная механическая энергия. ЗСЭ', section: 'mechanics' },
  { id: 'work-power', title: 'Механическая работа и мощность', section: 'mechanics' },
  { id: 'lever', title: 'Рычаг, блоки, момент силы', section: 'mechanics' },
  { id: 'density', title: 'Плотность вещества', section: 'mechanics' },

  { id: 'heat-amount', title: 'Количество теплоты, нагрев', section: 'thermal' },
  { id: 'aggregate-states', title: 'Агрегатные состояния вещества, переходы', section: 'thermal' },
  { id: 'heat-balance', title: 'Тепловой баланс', section: 'thermal' },
  { id: 'thermal-energy', title: 'ЗСЭ в тепловых процессах', section: 'thermal' },
  { id: 'fuel-engines', title: 'Сгорание топлива, тепловые двигатели и КПД', section: 'thermal' },

  { id: 'coulomb', title: 'Взаимодействие зарядов, закон Кулона', section: 'electromagnetism' },
  { id: 'charge-conservation', title: 'Закон сохранения электрического заряда', section: 'electromagnetism' },
  { id: 'resistance', title: 'Сопротивление проводника', section: 'electromagnetism' },
  { id: 'ohm', title: 'Закон Ома для участка цепи', section: 'electromagnetism' },
  { id: 'joule-lenz', title: 'Закон Джоуля — Ленца', section: 'electromagnetism' },
  { id: 'ampere', title: 'Сила Ампера', section: 'electromagnetism' },
];

const TOPIC_INDEX = new Map<TopicId, Topic>(TOPICS.map(topic => [topic.id, topic]));
const SECTION_INDEX = new Map<SectionId, Section>(SECTIONS.map(section => [section.id, section]));

export const getTopic = (id: TopicId): Topic | undefined => TOPIC_INDEX.get(id);
export const getSection = (id: SectionId): Section | undefined => SECTION_INDEX.get(id);

export const getSectionByTopic = (topicId: TopicId): Section | undefined => {
  const topic = TOPIC_INDEX.get(topicId);
  return topic ? SECTION_INDEX.get(topic.section) : undefined;
};

/** Трек 9 (ОГЭ) — единственный активный в MVP. */
export const TRACKS = [
  { id: '9', title: 'ОГЭ', subtitle: '9 класс', active: true },
  { id: '11', title: 'ЕГЭ', subtitle: '11 класс', active: false },
  { id: 'o', title: 'Олимпиадный', subtitle: 'профиль', active: false },
] as const;
