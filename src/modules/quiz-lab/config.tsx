import React from 'react';
import { CircleCheck, Layers, Link2, ListChecks } from 'lucide-react';
import { GameId, GameMeta } from './types';

export interface QuizGameMeta extends GameMeta {
  icon: React.ReactNode;
}

/**
 * Единый конфиг мини-игр: используется и на главной странице, и внутри модуля.
 */
export const QUIZ_GAMES: QuizGameMeta[] = [
  {
    id: 'single',
    title: 'Один ответ',
    shortLabel: '1 ответ',
    subtitle: 'Быстрый раунд',
    description: 'Вопрос ОГЭ и четыре варианта — выбери единственно верный.',
    badge: 'ОГЭ',
    color: '#0ea5e9',
    icon: <CircleCheck size={20} />,
  },
  {
    id: 'multi',
    title: 'Несколько ответов',
    shortLabel: 'Несколько',
    subtitle: 'Внимательность',
    description: 'Выбери все верные утверждения. Частичный ответ засчитывается наполовину.',
    badge: 'ОГЭ',
    color: '#8b5cf6',
    icon: <ListChecks size={20} />,
  },
  {
    id: 'matching',
    title: 'Соответствие',
    shortLabel: 'Пары',
    subtitle: 'Сопоставление',
    description: 'Соедини величины, приборы и формулы с их значениями и единицами.',
    badge: 'ОГЭ',
    color: '#10b981',
    icon: <Link2 size={20} />,
  },
  {
    id: 'cards',
    title: 'Карточки',
    shortLabel: 'Карточки',
    subtitle: 'Теория',
    description: 'Повторяй определения и формулы в режиме интервального повторения.',
    badge: 'Anki',
    color: '#f59e0b',
    icon: <Layers size={20} />,
  },
];

export const getGameMeta = (id: GameId): QuizGameMeta =>
  QUIZ_GAMES.find(game => game.id === id) ?? QUIZ_GAMES[0];
