import React, { useId } from 'react';
import './StreakFlame.css';

export type StreakTier = 'outline' | 'yellow' | 'orange' | 'red' | 'purple';

export const getStreakTier = (days: number): StreakTier => {
  if (days >= 30) return 'purple';
  if (days >= 15) return 'red';
  if (days >= 10) return 'orange';
  if (days >= 5) return 'yellow';
  return 'outline';
};

interface StreakFlameProps {
  days: number;
  size?: number;
  className?: string;
  animate?: boolean;
  label?: string;
}

const OUTER_MAIN =
  'M29 3 C25 15 21 25 15 36 C8 49 4 61 9 75 C14 87 26 92 38 89 C50 85 56 75 54 64 C52 54 44 48 41 37 C38 27 37 15 38 6 C35 13 32 21 30 29 C30 18 30 10 29 3 Z';

const OUTER_TONGUE =
  'M55 24 C58 33 59 44 57 54 C56 64 51 72 43 76 C49 68 50 59 47 50 C44 41 47 32 55 24 Z';

const LOWER_TONGUE =
  'M54 57 C58 62 59 70 56 77 C53 84 45 89 38 88 C46 84 51 77 51 68 C51 64 52 60 54 57 Z';

const MIDDLE_FLAME =
  'M30 18 C27 29 19 38 15 51 C11 65 17 79 30 82 C43 85 51 74 50 61 C49 50 40 43 36 31 C34 38 31 46 26 53 C28 42 31 28 30 18 Z';

const INNER_FLAME =
  'M29 42 C24 51 21 61 26 71 C30 78 39 79 44 73 C49 66 45 56 40 48 C37 42 33 38 32 30 C31 37 30 40 29 42 Z';

export const StreakFlame: React.FC<StreakFlameProps> = ({
  days,
  size = 44,
  className = '',
  animate = true,
  label,
}) => {
  const tier = getStreakTier(days);
  const gradientId = `streak-grad-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const isOutline = tier === 'outline';
  const shouldAnimate = animate && days >= 5;
  const height = Math.round((size * 94) / 64);
  const numberSize = days >= 100 ? 20 : days >= 10 ? 22 : 24;

  const outerFill = isOutline
    ? 'none'
    : tier === 'yellow'
      ? '#ffd43b'
      : `url(#${gradientId})`;

  return (
    <span
      className={`streak-flame streak-flame--${tier} ${
        shouldAnimate ? 'is-animated' : 'is-static'
      } ${className}`}
      style={{ width: size, height }}
      role="img"
      aria-label={label ?? `Серия: ${days} дней`}
    >
      <svg viewBox="0 0 64 94" className="streak-flame__svg" aria-hidden>
        <defs>
          {tier === 'orange' && (
            <linearGradient id={gradientId} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor="#ffd84d" />
              <stop offset="0.42" stopColor="#ffb21e" />
              <stop offset="1" stopColor="#ff8a00" />
            </linearGradient>
          )}
          {tier === 'red' && (
            <linearGradient id={gradientId} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor="#fff7d1" />
              <stop offset="0.16" stopColor="#ffe45c" />
              <stop offset="0.42" stopColor="#ff9d1c" />
              <stop offset="0.7" stopColor="#ff4d22" />
              <stop offset="1" stopColor="#e6283d" />
            </linearGradient>
          )}
          {tier === 'purple' && (
            <linearGradient id={gradientId} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor="#e9c7ff" />
              <stop offset="0.45" stopColor="#b36cff" />
              <stop offset="1" stopColor="#7b3ff2" />
            </linearGradient>
          )}
        </defs>

        <g className="streak-flame__body">
          <path
            d={OUTER_MAIN}
            fill={outerFill}
            stroke={isOutline ? 'currentColor' : undefined}
            strokeWidth={isOutline ? 2.6 : undefined}
          />
          <path
            d={OUTER_TONGUE}
            fill={outerFill}
            stroke={isOutline ? 'currentColor' : undefined}
            strokeWidth={isOutline ? 2.6 : undefined}
          />
        </g>

        {!isOutline && (
          <>
            <path d={MIDDLE_FLAME} className="streak-flame__middle" />
            <path d={INNER_FLAME} className="streak-flame__inner" />
            <circle cx="15" cy="25" r="1.8" className="streak-flame__spark spark-a" />
            <circle cx="53" cy="32" r="1.4" className="streak-flame__spark spark-b" />
            <circle cx="52" cy="72" r="1.2" className="streak-flame__spark spark-c" />
          </>
        )}

        <text
          x="32"
          y="64"
          className="streak-flame__number"
          textAnchor="middle"
          fontSize={numberSize}
        >
          {days}
        </text>
      </svg>
    </span>
  );
};
