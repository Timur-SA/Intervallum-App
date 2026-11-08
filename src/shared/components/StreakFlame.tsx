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

const FLAME_PATH =
  'M36 3 C37.4 9.6 39.6 14.2 42.8 18.8 C49.8 29.2 57 39.2 57 51 C57 64.5 46 73.5 32 73.5 C18 73.5 7 64.5 7 51 C7 39.8 13.8 30.3 17.8 21.7 C20.1 16.3 18.2 9.9 22.2 6.2 C24.8 3.8 28 5.6 28.8 10.2 C29.5 14.1 28.7 18.8 31 21.4 C32.8 17.2 33.7 10.9 36 3 Z';

const INNER_FLAME_PATH =
  'M32 31 C36 36 42 42 43 50 C44 59 38 66 32 66 C25 66 20 60 20 51 C20 43 27 37 32 31 Z';

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
  const height = Math.round((size * 76) / 64);
  const numberSize = days >= 100 ? 19 : days >= 10 ? 21 : 23;

  return (
    <span
      className={`streak-flame streak-flame--${tier} ${
        animate ? 'is-animated' : 'is-static'
      } ${className}`}
      style={{ width: size, height }}
      role="img"
      aria-label={label ?? `Серия: ${days} дней`}
    >
      <svg viewBox="0 0 64 76" className="streak-flame__svg" aria-hidden>
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

        <path
          d={FLAME_PATH}
          className="streak-flame__body"
          fill={
            isOutline
              ? 'none'
              : tier === 'yellow'
                ? '#ffd43b'
                : `url(#${gradientId})`
          }
          stroke={isOutline ? 'currentColor' : undefined}
          strokeWidth={isOutline ? 3 : undefined}
        />

        {tier !== 'outline' && (
          <>
            <path
              d="M27.5 50 C23 43 25.5 35.5 31 29 C32.5 37 37.5 40 38 46 C38.5 51 34 54.5 30.5 52.5 Z"
              className="streak-flame__inner"
            />
            <circle cx="16" cy="22" r="1.8" className="streak-flame__spark spark-a" />
            <circle cx="53" cy="28" r="1.4" className="streak-flame__spark spark-b" />
            <circle cx="49" cy="61" r="1.2" className="streak-flame__spark spark-c" />
          </>
        )}

        <text
          x="32"
          y="51"
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
