import React, { useRef, useState } from 'react';
import { DrawnVector, ForceTask, ForceType } from '../types';
import { FORCE_CATALOG } from '../data/catalog';
import { TaskIllustration } from './TaskIllustration';
import { MathView } from '../../../shared/components/MathView';
import { haptics } from '../../../shared/motion/haptics';

interface ForceCanvasProps {
  task: ForceTask;
  vectors: DrawnVector[];
  referenceVectors: DrawnVector[];
  selectedForce: ForceType | null;
  activeType: ForceType | null;
  errorTypes: ForceType[];
  passed: boolean;
  onSelectVector: (type: ForceType) => void;
  onCommitVector: (vector: DrawnVector) => void;
  onRequireSelectForce: () => void;
}

interface GestureState {
  mode: 'new' | 'origin' | 'endpoint';
  start: { x: number; y: number };
  vector: DrawnVector;
  pointerId: number;
}

export const ForceCanvas: React.FC<ForceCanvasProps> = ({
  task,
  vectors,
  referenceVectors,
  selectedForce,
  activeType,
  errorTypes,
  passed,
  onSelectVector,
  onCommitVector,
  onRequireSelectForce,
}) => {
  const [gesture, setGesture] = useState<GestureState | null>(null);
  const committedDrag = useRef(false);

  const getPoint = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const screenTransform = svg.getScreenCTM();
    if (!screenTransform) return { x: 180, y: 175 };

    const screenPoint = svg.createSVGPoint();
    screenPoint.x = e.clientX;
    screenPoint.y = e.clientY;
    const point = screenPoint.matrixTransform(screenTransform.inverse());

    return {
      x: Math.max(16, Math.min(344, point.x)),
      y: Math.max(28, Math.min(330, point.y)),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (passed || e.button > 0) return;
    committedDrag.current = false;
    const p = getPoint(e);
    const hitRadius = 24;

    const current = vectors.find(v => v.type === activeType);
    const handles = current
      ? [
          { mode: 'origin' as const, v: current, d: Math.hypot(p.x - current.x, p.y - current.y) },
          {
            mode: 'endpoint' as const,
            v: current,
            d: Math.hypot(p.x - current.x - current.dx, p.y - current.y - current.dy),
          },
        ].sort((a, b) => a.d - b.d)
      : [];

    const closest = vectors
      .map(v => ({ v, d: Math.hypot(p.x - v.x - v.dx, p.y - v.y - v.dy) }))
      .sort((a, b) => a.d - b.d)[0];

    if (handles[0]?.d < hitRadius) {
      haptics.impact('light');
      setGesture({
        mode: handles[0].mode,
        start: p,
        vector: { ...current! },
        pointerId: e.pointerId,
      });
    } else if (closest && closest.d < hitRadius) {
      haptics.impact('light');
      onSelectVector(closest.v.type);
      setGesture({
        mode: 'endpoint',
        start: p,
        vector: { ...closest.v },
        pointerId: e.pointerId,
      });
    } else if (selectedForce) {
      haptics.impact('light');
      setGesture({
        mode: 'new',
        start: p,
        vector: { type: selectedForce, x: p.x, y: p.y, dx: 0, dy: 0 },
        pointerId: e.pointerId,
      });
    } else {
      onRequireSelectForce();
      return;
    }

    try {
      (e.target as Element).setPointerCapture(e.pointerId);
    } catch {}
    e.preventDefault();
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!gesture || gesture.pointerId !== e.pointerId) return;
    const p = getPoint(e);
    const v = { ...gesture.vector };

    if (gesture.mode === 'origin') {
      v.x = Math.max(16 - Math.min(0, v.dx), Math.min(344 - Math.max(0, v.dx), p.x));
      v.y = Math.max(28 - Math.min(0, v.dy), Math.min(330 - Math.max(0, v.dy), p.y));
    } else {
      v.dx = p.x - v.x;
      v.dy = p.y - v.y;
    }

    setGesture({ ...gesture, vector: v });
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!gesture || gesture.pointerId !== e.pointerId) return;
    const v = gesture.vector;
    const end = getPoint(e);
    const moved = Math.hypot(end.x - gesture.start.x, end.y - gesture.start.y) >= 3;

    if (moved && Math.hypot(v.dx, v.dy) >= 14) {
      committedDrag.current = true;
      haptics.impact('medium');
      onCommitVector(v);
    }
    setGesture(null);
  };

  const renderVector = (v: DrawnVector, isDraft = false) => {
    const len = Math.hypot(v.dx, v.dy);
    if (len < 1) return null;
    const end = { x: v.x + v.dx, y: v.y + v.dy };
    const ux = v.dx / len;
    const uy = v.dy / len;
    const shaftEnd = {
      x: end.x - ux * Math.min(11, len * 0.7),
      y: end.y - uy * Math.min(11, len * 0.7),
    };

    const isError = errorTypes.includes(v.type);
    const color = isError
      ? 'var(--fl-error)'
      : passed
      ? 'var(--fl-pass)'
      : 'var(--fl-accent)';
    const isActive = v.type === activeType;

    const labelX = Math.max(20, Math.min(320, end.x + (ux < -0.1 ? -24 : 14)));
    const labelY = Math.max(24, Math.min(330, end.y + (uy < -0.65 ? -14 : uy > 0.65 ? 12 : 20)));

    return (
      <g
        key={v.type + (isDraft ? '-draft' : '')}
        opacity={isDraft ? 0.75 : 1}
        onClick={() => {
          if (!isDraft && !passed && !committedDrag.current) onSelectVector(v.type);
        }}
        style={{ cursor: 'pointer' }}
      >
        {/* Invisible wider hit area */}
        <path d={`M ${v.x} ${v.y} L ${end.x} ${end.y}`} stroke="transparent" strokeWidth="22" fill="none" />
        {/* Vector Shaft */}
        <path
          d={`M ${v.x} ${v.y} L ${shaftEnd.x} ${shaftEnd.y}`}
          stroke={color}
          strokeWidth={isActive ? 4.5 : 3.8}
          strokeLinecap="butt"
          fill="none"
        />
        {/* Filled Arrowhead */}
        <path
          d={`M ${end.x - ux * 13 - uy * 6} ${end.y - uy * 13 + ux * 6} L ${end.x} ${end.y} L ${
            end.x - ux * 13 + uy * 6
          } ${end.y - uy * 13 - ux * 6} Z`}
          fill={color}
        />
        {/* Base circle */}
        <circle cx={v.x} cy={v.y} r="4" fill={color} />

        {/* Square Origin Handle when active */}
        {isActive && !isDraft && (
          <rect
            x={v.x - 5}
            y={v.y - 5}
            width="10"
            height="10"
            fill="var(--fl-paper)"
            stroke={color}
            strokeWidth="2.5"
          />
        )}

        {/* Formula Label */}
        {!isDraft && (
          <foreignObject
            x={labelX}
            y={labelY - 14}
            width="60"
            height="30"
            style={{ pointerEvents: 'none' }}
          >
            <div style={{ color, fontSize: 16, fontWeight: 600 }}>
              <MathView math={FORCE_CATALOG[v.type]?.tex || ''} />
            </div>
          </foreignObject>
        )}
      </g>
    );
  };

  const renderReference = (v: DrawnVector) => {
    const len = Math.hypot(v.dx, v.dy);
    if (len < 1) return null;
    const end = { x: v.x + v.dx, y: v.y + v.dy };
    const ux = v.dx / len;
    const uy = v.dy / len;

    return (
      <g key={'ref-' + v.type} style={{ pointerEvents: 'none' }}>
        <path
          d={`M ${v.x} ${v.y} L ${end.x} ${end.y}`}
          fill="none"
          stroke="var(--fl-reference)"
          strokeWidth="2.2"
          strokeDasharray="7 5"
        />
        <path
          d={`M ${end.x - ux * 11 - uy * 5.5} ${end.y - uy * 11 + ux * 5.5} L ${end.x} ${end.y} L ${
            end.x - ux * 11 + uy * 5.5
          } ${end.y - uy * 11 - ux * 5.5}`}
          fill="none"
          stroke="var(--fl-reference)"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
      </g>
    );
  };

  return (
    <div style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <svg
        viewBox="0 0 360 350"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={event => {
          if (gesture?.pointerId === event.pointerId) setGesture(null);
        }}
        style={{
          width: '100%',
          flex: 1,
          minHeight: 0,
          display: 'block',
          touchAction: 'none',
          userSelect: 'none',
          backgroundColor: 'transparent',
        }}
      >
        {/* Physical scenario drawing */}
        <TaskIllustration kind={task.kind} />

        {/* Reference vectors (when available) */}
        {referenceVectors.map(renderReference)}

        {/* Drawn Vectors */}
        {vectors
          .filter(v => !gesture || v.type !== gesture.vector.type)
          .map(v => renderVector(v))}

        {/* Ghost / active gesture vector */}
        {gesture && renderVector(gesture.vector, true)}
      </svg>
    </div>
  );
};
