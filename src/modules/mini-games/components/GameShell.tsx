import React, { ReactNode } from 'react';
import { Steps } from '@maxhub/max-ui';
import { Flame } from 'lucide-react';

interface GameShellProps {
  title: string;
  step: number;
  total: number;
  /** Если не передано — счётчик серии скрыт. */
  streak?: number;
  /** Заменяет счётчик серии (например, таймером босса). */
  headerRight?: ReactNode;
  children: ReactNode;
  footer: ReactNode;
}

/**
 * Общий каркас задания: прогресс сверху, прокручиваемое тело и фиксированный футер.
 * Повторяет паттерн Duolingo — действие всегда под большим пальцем.
 */
export const GameShell: React.FC<GameShellProps> = ({
  title,
  step,
  total,
  streak,
  headerRight,
  children,
  footer,
}) => (
  <div className="mg-game">
    <header className="mg-game__header" aria-label={title}>
      <div className="mg-game__progress" style={{ flex: 1, minWidth: 0 }}>
        <Steps className="mg-steps" count={total} progress={step} />
      </div>

      {headerRight ??
        (streak !== undefined && (
          <div className="mg-game__streak" aria-label={`Серия: ${streak}`}>
            <Flame size={15} />
            <span>{streak}</span>
          </div>
        ))}
    </header>

    <main className="mg-game__body">{children}</main>

    <footer className="mg-game__footer">{footer}</footer>
  </div>
);
