import React, { ReactNode } from 'react';
import { Flame } from 'lucide-react';

interface GameShellProps {
  title: string;
  step: number;
  total: number;
  /** Если не передано — счётчик серии скрыт. */
  streak?: number;
  /** Заменяет счётчик серии (например, таймером босса). */
  headerRight?: ReactNode;
  bodyClassName?: string;
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
  bodyClassName,
  children,
  footer,
}) => (
  <div className="mg-game">
    <header className="mg-game__header" aria-label={title}>
      <div
        className="mg-game__progress"
        role="progressbar"
        aria-label="Прогресс задания"
        aria-valuenow={step}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuetext={`${step + 1} из ${total}`}
      >
        {Array.from({ length: total }, (_, index) => (
          <span className="mg-game__segment" key={index}>
            {index < step && (
              <span
                className={index === step - 1 ? 'mg-game__fill mg-game__fill--new' : 'mg-game__fill'}
              />
            )}
          </span>
        ))}
      </div>

      {headerRight ??
        (streak !== undefined && (
          <div className="mg-game__streak" aria-label={`Серия: ${streak}`}>
            <Flame size={15} />
            <span>{streak}</span>
          </div>
        ))}
    </header>

    <main className={`mg-game__body ${bodyClassName ?? ''}`}>{children}</main>

    <footer className="mg-game__footer">{footer}</footer>
  </div>
);
