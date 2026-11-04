import React from 'react';
import { CellSimple } from '@maxhub/max-ui';
import {
  Calculator,
  ChevronRight,
  CircleCheck,
  Layers,
  Link2,
  ListChecks,
  PenTool,
  Ruler,
} from 'lucide-react';
import { PracticeProgress } from '../../../shared/storage/progressStore';
import { MINI_GAMES } from '../data';
import { PlayableTaskType } from '../domain/types';
import { tasksLabel } from '../engine/plural';
import { haptics } from '../../../shared/motion/haptics';

interface MiniGamesScreenProps {
  progress: PracticeProgress;
  onSelect: (type: PlayableTaskType) => void;
  onOpenInteractive: () => void;
  onOpenForces: () => void;
}

const GAME_ICONS: Record<PlayableTaskType, React.ReactNode> = {
  single: <CircleCheck size={20} />,
  multi: <ListChecks size={20} />,
  matching: <Link2 size={20} />,
  cards: <Layers size={20} />,
};

const scoreLabel = (value: number | undefined): string => {
  if (typeof value !== 'number') return '';
  return `${Math.round(value * 100)}%`;
};

export const MiniGamesScreen: React.FC<MiniGamesScreenProps> = ({
  progress,
  onSelect,
  onOpenInteractive,
  onOpenForces,
}) => {
  const meta = (type: PlayableTaskType) =>
    MINI_GAMES.find(game => game.type === type) ?? MINI_GAMES[0];

  const renderGame = (type: PlayableTaskType) => {
    const game = meta(type);
    const best = progress.bestScoreByType[type];

    return (
      <CellSimple
        key={type}
        as="button"
        className="mg-row"
        height="normal"
        onClick={() => {
          haptics.impact('medium');
          onSelect(type);
        }}
        overline={game.subtitle}
        title={game.title}
        subtitle={tasksLabel(game.count)}
        before={
          <span className="mg-row__icon" style={{ backgroundColor: game.color }} aria-hidden>
            {GAME_ICONS[type]}
          </span>
        }
        after={
          typeof best === 'number' ? (
            <span className="mg-row__score">{scoreLabel(best)}</span>
          ) : (
            <ChevronRight size={18} color="var(--text-muted)" />
          )
        }
      />
    );
  };

  return (
    <div className="mg-screen">
      <div className="mg-scroll">
        <header className="mg-screen__head">
          <div>
            <h1 className="mg-screen__title">Мини-игры</h1>
            <p className="mg-screen__subtitle">
              Короткие раунды по типам заданий ОГЭ. Звёзды начисляются за верные ответы.
            </p>
          </div>
        </header>

        <div className="mg-list">
          {renderGame('single')}
          {renderGame('multi')}
          {renderGame('matching')}

          <CellSimple
            className="mg-row mg-row--struck"
            height="normal"
            disabled
            overline="Численный ответ"
            title={<span style={{ textDecoration: 'line-through' }}>Численная задача</span>}
            subtitle="Вычеркнута из MVP"
            before={
              <span className="mg-row__icon" style={{ backgroundColor: '#475569' }} aria-hidden>
                <Calculator size={20} />
              </span>
            }
            after={<span className="mg-row__badge">Не в MVP</span>}
          />

          <CellSimple
            as="button"
            className="mg-row"
            height="normal"
            onClick={() => {
              haptics.impact('light');
              onOpenInteractive();
            }}
            overline="Блокнот"
            title="Интерактивная задача"
            subtitle="Каталог формул"
            before={
              <span className="mg-row__icon" style={{ backgroundColor: '#0284c7' }} aria-hidden>
                <PenTool size={20} />
              </span>
            }
            after={<ChevronRight size={18} color="var(--text-muted)" />}
          />

          <CellSimple
            as="button"
            className="mg-row"
            height="normal"
            onClick={() => {
              haptics.impact('light');
              onOpenForces();
            }}
            overline="Канвас"
            title="Расстановка сил"
            subtitle="Только механика"
            before={
              <span className="mg-row__icon" style={{ backgroundColor: '#b45309' }} aria-hidden>
                <Ruler size={20} />
              </span>
            }
            after={<ChevronRight size={18} color="var(--text-muted)" />}
          />

          {renderGame('cards')}
        </div>

        <p className="mg-note">
          Интерактивная задача и расстановка сил открываются в существующих модулях
          приложения — прогресс по ним считается отдельно.
        </p>
      </div>
    </div>
  );
};
