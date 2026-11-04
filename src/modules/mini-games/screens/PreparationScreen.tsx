import React from 'react';
import { CellSimple } from '@maxhub/max-ui';
import {
  ChevronRight,
  GraduationCap,
  Infinity as InfinityIcon,
  Lock,
  Star,
  Swords,
  Target,
  Timer,
} from 'lucide-react';
import { PracticeProgress } from '../../../shared/storage/progressStore';
import { MINI_GAMES, TOTAL_PLAYABLE_TASKS } from '../data';
import { plural, tasksLabel } from '../engine/plural';
import { TRACKS } from '../domain/sections';
import { haptics } from '../../../shared/motion/haptics';

interface PreparationScreenProps {
  progress: PracticeProgress;
  onOpenMiniGames: () => void;
  onOpenCourse: () => void;
  onOpenTraining: () => void;
  onOpenBosses: () => void;
}

export const PreparationScreen: React.FC<PreparationScreenProps> = ({
  progress,
  onOpenMiniGames,
  onOpenCourse,
  onOpenTraining,
  onOpenBosses,
}) => (
  <div className="mg-screen">
    <div className="mg-scroll">
      <header className="mg-screen__head">
        <div>
          <h1 className="mg-screen__title">Подготовка</h1>
          <p className="mg-screen__subtitle">Трек ОГЭ · индивидуальная версия</p>
        </div>
        <span className="mg-xp">
          <Star size={13} fill="#f59e0b" />
          <span className="mg-xp__value">{progress.stars}</span>
        </span>
      </header>

      <div className="mg-tracks">
        {TRACKS.map(track => (
          <span
            key={track.id}
            className={`mg-track ${track.active ? 'mg-track--active' : 'mg-track--locked'}`}
            title={track.active ? track.subtitle : `${track.subtitle} — в Полной версии`}
          >
            {track.title}
            {!track.active && <Lock size={11} />}
          </span>
        ))}
      </div>

      <div className="mg-list">
        <CellSimple
          as="button"
          className="mg-row"
          height="normal"
          onClick={() => {
            haptics.impact('medium');
            onOpenCourse();
          }}
          overline="Теория"
          title="Курс"
          subtitle="3 раздела · 19 тем"
          before={
            <span className="mg-row__icon" style={{ backgroundColor: '#0ea5e9' }} aria-hidden>
              <GraduationCap size={20} />
            </span>
          }
          after={<ChevronRight size={18} color="var(--text-muted)" />}
        />

        <CellSimple
          as="button"
          className="mg-row"
          height="normal"
          onClick={() => {
            haptics.impact('medium');
            onOpenTraining();
          }}
          overline="Сессия"
          title="Тренировка"
          subtitle="7 задач на разные темы · звёзды за сложные"
          before={
            <span className="mg-row__icon" style={{ backgroundColor: '#8b5cf6' }} aria-hidden>
              <Timer size={20} />
            </span>
          }
          after={<ChevronRight size={18} color="var(--text-muted)" />}
        />

        <CellSimple
          as="button"
          className="mg-row"
          height="normal"
          onClick={() => {
            haptics.impact('medium');
            onOpenBosses();
          }}
          overline="Дуэль"
          title="Босс"
          subtitle="Ньютон, Кельвин, Тесла"
          before={
            <span className="mg-row__icon" style={{ backgroundColor: '#f59e0b' }} aria-hidden>
              <Swords size={20} />
            </span>
          }
          after={<ChevronRight size={18} color="var(--text-muted)" />}
        />

        <CellSimple
          as="button"
          className="mg-row mg-row--accent"
          height="normal"
          onClick={() => {
            haptics.impact('medium');
            onOpenMiniGames();
          }}
          overline="Практика"
          title="Мини-игры"
          subtitle={`${MINI_GAMES.length} ${plural(MINI_GAMES.length, [
            'тип',
            'типа',
            'типов',
          ])} задач · ${tasksLabel(TOTAL_PLAYABLE_TASKS)}`}
          before={
            <span className="mg-row__icon" style={{ backgroundColor: '#10b981' }} aria-hidden>
              <Target size={20} />
            </span>
          }
          after={<ChevronRight size={18} color="var(--text-muted)" />}
        />

        <CellSimple
          className="mg-row"
          height="normal"
          disabled
          overline="Лента"
          title="Бесконечная лента"
          subtitle="Только в Полной версии"
          before={
            <span className="mg-row__icon" style={{ backgroundColor: '#475569' }} aria-hidden>
              <InfinityIcon size={20} />
            </span>
          }
          after={<span className="mg-row__badge">Недоступно</span>}
        />
      </div>

      <p className="mg-note">
        Полная версия и Enterprise (для школ) — в разработке. В MVP доступна только
        индивидуальная подготовка по треку ОГЭ.
      </p>
    </div>
  </div>
);
