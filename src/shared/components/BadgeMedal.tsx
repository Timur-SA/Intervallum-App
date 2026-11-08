import React from 'react';
import { Cog, Star } from 'lucide-react';
import { BadgeDefinition } from '../profile/badges';
import './BadgeMedal.css';

interface BadgeMedalProps {
  badge: BadgeDefinition;
  size?: number;
  locked?: boolean;
  className?: string;
}

export const BadgeMedal: React.FC<BadgeMedalProps> = ({
  badge,
  size = 72,
  locked = false,
  className = '',
}) => {
  const Icon = badge.icon === 'gear' ? Cog : Star;

  return (
    <span
      className={`badge-medal badge-medal--${badge.tone} ${
        locked ? 'is-locked' : ''
      } ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${badge.title}${locked ? ' — заблокирован' : ''}`}
    >
      <span className="badge-medal__ribbon badge-medal__ribbon--left" />
      <span className="badge-medal__ribbon badge-medal__ribbon--right" />
      <span className="badge-medal__disc">
        <span className="badge-medal__inner">
          <Icon size={Math.round(size * 0.42)} strokeWidth={2.2} />
        </span>
      </span>
    </span>
  );
};
