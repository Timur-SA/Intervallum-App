import React, { ReactNode } from 'react';
import { IconButton, Steps } from '@maxhub/max-ui';
import { ChevronLeft, Flame } from 'lucide-react';

interface GameShellProps {
  title: string;
  step: number;
  total: number;
  /** Если не передано — счётчик серии скрыт. */
  streak?: number;
  onExit: () => void;
  children: ReactNode;
  footer: ReactNode;
}

/**
 * Общий каркас мини-игры: прогресс сверху, прокручиваемое тело и фиксированный футер.
 * Повторяет паттерн Duolingo — действие всегда под большим пальцем.
 */
export const GameShell: React.FC<GameShellProps> = ({
  title,
  step,
  total,
  streak,
  onExit,
  children,
  footer,
}) => (
  <div className="ql-game">
    <header className="ql-game__header" aria-label={title}>
      <IconButton
        className="ql-game__back"
        size="small"
        variant="ghost"
        aria-label="Выйти из игры"
        onClick={onExit}
      >
        <ChevronLeft size={18} />
      </IconButton>

      <div className="ql-game__progress" style={{ flex: 1, minWidth: 0 }}>
        <Steps className="ql-steps" count={total} progress={step} />
      </div>

      {streak !== undefined && (
        <div className="ql-game__streak" aria-label={`Серия: ${streak}`}>
          <Flame size={15} />
          <span>{streak}</span>
        </div>
      )}
    </header>

    <main className="ql-game__body">{children}</main>

    <footer className="ql-game__footer">{footer}</footer>
  </div>
);
