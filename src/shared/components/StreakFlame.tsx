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

const OUTER_FLAME =
  'M27.7 0.0 L28.1 0.0 L30.1 1.5 L35.3 6.2 L39.1 10.8 L43.3 17.7 L45.4 23.4 L48.0 32.9 L49.3 40.0 L50.0 45.2 L50.2 45.3 L50.7 44.8 L51.8 42.8 L52.4 40.7 L52.8 37.3 L52.4 31.5 L51.5 26.4 L54.4 29.6 L58.3 35.3 L60.8 40.9 L61.6 43.5 L62.1 46.1 L62.1 51.5 L61.8 54.8 L60.8 60.4 L59.1 65.5 L59.3 65.7 L60.1 65.7 L61.3 65.3 L62.4 64.3 L63.8 62.4 L64.0 64.9 L63.4 69.0 L62.1 73.9 L59.6 80.2 L56.4 85.3 L52.5 89.6 L49.5 91.9 L45.1 94.2 C42.0 97.0 36.0 98.3 29.5 97.1 C24.0 96.1 19.0 94.0 15.6 91.3 L13.2 89.7 L8.0 85.0 L5.4 81.5 L4.1 79.4 L1.6 73.1 L0.3 67.6 L0.0 63.9 L0.1 58.5 L1.1 54.0 L3.3 49.3 L5.9 45.6 L9.2 41.5 L15.4 35.0 L18.7 31.1 L21.0 28.1 L23.3 24.2 L24.8 20.3 L26.9 11.0 L27.7 5.5 L27.7 0.1 Z';

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
  const height = Math.round((size * 96) / 64);
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
      <svg viewBox="0 0 64 96" className="streak-flame__svg" aria-hidden>
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
            d={OUTER_FLAME}
            fill={outerFill}
            stroke={isOutline ? 'currentColor' : undefined}
            strokeWidth={isOutline ? 2.6 : undefined}
          />
        </g>

        <text
          x="32"
          y="65.5"
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
