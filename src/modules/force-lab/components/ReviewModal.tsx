import React from 'react';
import { Button } from '@maxhub/max-ui';
import { FORCE_CATALOG } from '../data/catalog';
import { DrawnVector, ForceTask, Region, ReviewEntry } from '../types';
import { haptics } from '../../../shared/motion/haptics';

interface ReviewModalProps {
  isOpen: boolean;
  task: ForceTask;
  reviewQueue: ReviewEntry[];
  currentIndex: number;
  onNext: () => void;
  onClose: () => void;
  illustrationSvg?: string;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  task,
  reviewQueue,
  currentIndex,
  onNext,
  onClose,
}) => {
  if (!isOpen || !reviewQueue.length) return null;

  const entry = reviewQueue[currentIndex];
  if (!entry) return null;

  const { drawn, expected, region, issues } = entry;
  const isOrigin = issues.some(i => i.code === 'origin');
  const isDirection = issues.some(i => i.code === 'direction');

  // Compute bounding box
  const bounds =
    {
      incline: [125, 150, 245, 260],
      table: [135, 153, 225, 227],
      hanging: [145, 165, 215, 235],
      magnetic: [149, 169, 211, 231],
      sail: [195, 142, 235, 238],
      lever: [60, 185, 300, 240],
    }[task.kind] || [100, 100, 260, 260];

  const points: { x: number; y: number }[] = [
    { x: bounds[0], y: bounds[1] },
    { x: bounds[2], y: bounds[3] },
  ];

  for (const v of [expected, drawn]) {
    if (v) points.push(v, { x: v.x + v.dx, y: v.y + v.dy });
  }

  if (region) {
    const ends = region.kind === 'point' ? [region] : [region.a, region.b];
    ends.forEach(p => {
      points.push(
        { x: p.x - region.radius, y: p.y - region.radius },
        { x: p.x + region.radius, y: p.y + region.radius }
      );
    });
  }

  const ghost =
    drawn && expected && isDirection ? { ...expected, x: drawn.x, y: drawn.y } : null;
  if (ghost) points.push({ x: ghost.x + ghost.dx, y: ghost.y + ghost.dy });

  const minX = Math.min(...points.map(p => p.x)) - 24;
  const minY = Math.min(...points.map(p => p.y)) - 26;
  const width = Math.max(120, Math.max(...points.map(p => p.x)) + 24 - minX);
  const height = Math.max(160, Math.max(...points.map(p => p.y)) + 26 - minY);
  const viewBox = `${minX} ${minY} ${width} ${height}`;

  const renderReviewArrow = (v: DrawnVector | null, color: string, ghostMode = false) => {
    if (!v) return null;
    const len = Math.hypot(v.dx, v.dy);
    if (len < 1) return <circle cx={v.x} cy={v.y} r={4} fill={color} />;

    const ux = v.dx / len;
    const uy = v.dy / len;
    const x = v.x + v.dx;
    const y = v.y + v.dy;
    const head = Math.min(12, len * 0.4);

    return (
      <g opacity={ghostMode ? 0.45 : 1}>
        <path
          d={`M ${v.x} ${v.y} L ${x - ux * head * 0.8} ${y - uy * head * 0.8}`}
          stroke={color}
          strokeWidth="3.2"
          strokeDasharray={ghostMode ? '5 4' : undefined}
          fill="none"
        />
        <path
          d={`M ${x - ux * head - uy * head * 0.45} ${y - uy * head + ux * head * 0.45} L ${x} ${y} L ${x - ux * head + uy * head * 0.45} ${y - uy * head - ux * head * 0.45} Z`}
          fill={color}
        />
        {!ghostMode && <circle cx={v.x} cy={v.y} r={3.5} fill={color} />}
      </g>
    );
  };

  const renderRegion = (reg: Region | null) => {
    if (!reg) return null;
    if (reg.kind === 'point') {
      return (
        <circle
          cx={reg.x}
          cy={reg.y}
          r={reg.radius}
          fill="var(--fl-reference)"
          fillOpacity={0.12}
          stroke="var(--fl-reference)"
          strokeWidth={1.5}
          strokeDasharray="3 3"
        />
      );
    }
    return (
      <g>
        <path
          d={`M ${reg.a.x} ${reg.a.y} L ${reg.b.x} ${reg.b.y}`}
          stroke="var(--fl-reference)"
          strokeOpacity={0.15}
          strokeWidth={reg.radius * 2}
          strokeLinecap="round"
        />
        <path
          d={`M ${reg.a.x} ${reg.a.y} L ${reg.b.x} ${reg.b.y}`}
          stroke="var(--fl-reference)"
          strokeWidth={1.5}
          strokeDasharray="3 3"
        />
      </g>
    );
  };

  const originTarget = isOrigin
    ? issues.find(i => i.code === 'origin')?.placement?.target
    : null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxHeight: '92%',
          overflowY: 'auto',
          backgroundColor: 'var(--fl-paper)',
          borderRadius: 24,
          padding: 18,
          boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
          border: '1px solid var(--fl-line)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <span style={{ fontSize: 13, color: 'var(--fl-soft)', fontWeight: 500 }}>
            Разбор ошибки · {currentIndex + 1} из {reviewQueue.length}
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 0,
              fontSize: 22,
              color: 'var(--fl-soft)',
              padding: '2px 8px',
            }}
          >
            ×
          </button>
        </div>

        <h3 style={{ margin: '0 0 14px', fontSize: 20, fontWeight: 600 }}>
          {FORCE_CATALOG[entry.type]?.name}
        </h3>

        {/* Side by Side Panes */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              borderRadius: 14,
              backgroundColor: 'var(--fl-panel)',
              padding: 10,
              border: '1px solid var(--fl-line)',
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--fl-reference)',
                marginBottom: 6,
              }}
            >
              Эталон
            </div>
            <svg
              viewBox={viewBox}
              style={{ width: '100%', height: 180, overflow: 'hidden' }}
            >
              {renderRegion(region)}
              {renderReviewArrow(expected, 'var(--fl-reference)')}
            </svg>
            {!expected && (
              <div style={{ fontSize: 11, color: 'var(--fl-soft)', marginTop: 4 }}>
                Эта сила не должна действовать
              </div>
            )}
          </div>

          <div
            style={{
              borderRadius: 14,
              backgroundColor: 'var(--fl-panel)',
              padding: 10,
              border: '1px solid var(--fl-line)',
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--fl-error)',
                marginBottom: 6,
              }}
            >
              Твой вектор
            </div>
            <svg
              viewBox={viewBox}
              style={{ width: '100%', height: 180, overflow: 'hidden' }}
            >
              {renderRegion(region)}
              {ghost && renderReviewArrow(ghost, 'var(--fl-reference)', true)}
              {isOrigin && originTarget && drawn && (
                <g>
                  <path
                    d={`M ${drawn.x} ${drawn.y} L ${originTarget.x} ${originTarget.y}`}
                    stroke="var(--fl-error)"
                    strokeWidth="1.6"
                    strokeDasharray="3 3"
                  />
                  <circle
                    cx={drawn.x}
                    cy={drawn.y}
                    r={9}
                    fill="none"
                    stroke="var(--fl-error)"
                    strokeWidth="1.6"
                  />
                </g>
              )}
              {renderReviewArrow(drawn, 'var(--fl-error)')}
            </svg>
            {!drawn && (
              <div style={{ fontSize: 11, color: 'var(--fl-soft)', marginTop: 4 }}>
                Стрелка не нарисована
              </div>
            )}
          </div>
        </div>

        {/* Textual Feedback */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, lineHeight: 1.45 }}>
          {issues.map((iss, i) => {
            if (iss.code === 'origin') {
              return (
                <div key={i}>
                  <strong style={{ color: 'var(--fl-error)', display: 'block' }}>
                    Точка приложения:
                  </strong>
                  <span>{iss.message}. Пунктиром показана верная зона крепления/контакта.</span>
                </div>
              );
            }
            if (iss.code === 'direction') {
              return (
                <div key={i}>
                  <strong style={{ color: 'var(--fl-error)', display: 'block' }}>
                    Направление:
                  </strong>
                  <span>
                    {iss.angleDegrees !== null && iss.angleDegrees !== undefined
                      ? `Отклонение составляет ${Math.round(iss.angleDegrees)}° (допуск 15°). `
                      : 'Направление не совпадает. '}
                    Поверни стрелку в направлении пунктирного эталона.
                  </span>
                </div>
              );
            }
            if (iss.code === 'ratio') {
              return (
                <div key={i}>
                  <strong style={{ color: 'var(--fl-error)', display: 'block' }}>
                    Соотношение длин:
                  </strong>
                  <span>{iss.message} Соблюдай физический масштаб сил.</span>
                </div>
              );
            }
            if (iss.code === 'missing') {
              return (
                <div key={i}>
                  <strong style={{ color: 'var(--fl-error)', display: 'block' }}>
                    Не хватает силы:
                  </strong>
                  <span>{iss.message}</span>
                </div>
              );
            }
            if (iss.code === 'extra') {
              return (
                <div key={i}>
                  <strong style={{ color: 'var(--fl-error)', display: 'block' }}>
                    Лишняя сила:
                  </strong>
                  <span>{iss.message}</span>
                </div>
              );
            }
            return null;
          })}
        </div>

        <div style={{ marginTop: 20 }}>
          <Button
            variant="primary"
            size="large"
            onClick={() => {
              haptics.impact('light');
              onNext();
            }}
            style={{ width: '100%', borderRadius: 14, fontWeight: 600 }}
          >
            {currentIndex + 1 < reviewQueue.length ? 'Понятно (далее)' : 'Понятно (вернуться к схеме)'}
          </Button>
        </div>
      </div>
    </div>
  );
};
