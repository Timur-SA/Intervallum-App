import React from 'react';
import { ChevronRight, Star } from 'lucide-react';
import { haptics } from '../shared/motion/haptics';

interface ModeCardProps {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  color: string;
  icon: React.ReactNode;
  completedCount: number;
  totalCount: number;
  stars: number;
  onClick: () => void;
}

export const ModeCard: React.FC<ModeCardProps> = ({
  title,
  subtitle,
  description,
  badge,
  color,
  icon,
  completedCount,
  totalCount,
  stars,
  onClick,
}) => {
  return (
    <div
      onClick={() => {
        haptics.impact('medium');
        onClick();
      }}
      style={{
        position: 'relative',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '18px 18px 16px',
        cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
        transition: 'transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
      onPointerDown={e => {
        (e.currentTarget as HTMLElement).style.transform = 'scale(0.98)';
      }}
      onPointerUp={e => {
        (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
      }}
      onPointerLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
      }}
    >
      {/* Top row: Icon + Title + Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: color,
              color: '#ffffff',
              display: 'grid',
              placeItems: 'center',
              boxShadow: `0 4px 12px ${color}44`,
            }}
          >
            {icon}
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {subtitle}
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: -0.3,
              }}
            >
              {title}
            </div>
          </div>
        </div>

        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: 12,
            backgroundColor: 'var(--accent-bg)',
            color: 'var(--accent)',
            border: '1px solid var(--border)',
          }}
        >
          {badge}
        </span>
      </div>

      {/* Description */}
      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
        {description}
      </p>

      {/* Footer: Progress bar + Stars + Action chevron */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--border)',
          paddingTop: 12,
          marginTop: 2,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Mini progress bar */}
          <div
            style={{
              width: 70,
              height: 6,
              borderRadius: 3,
              backgroundColor: 'var(--bg-surface)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${(completedCount / Math.max(1, totalCount)) * 100}%`,
                height: '100%',
                backgroundColor: color,
                borderRadius: 3,
                transition: 'width 200ms ease',
              }}
            />
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
            {completedCount} из {totalCount}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {stars > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                fontSize: 12,
                fontWeight: 600,
                color: '#f59e0b',
              }}
            >
              <Star size={13} fill="#f59e0b" />
              <span>{stars}</span>
            </div>
          )}
          <span style={{ color: 'var(--text-muted)', display: 'grid', placeItems: 'center' }}>
            <ChevronRight size={18} />
          </span>
        </div>
      </div>
    </div>
  );
};
