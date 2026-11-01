import React, { useRef, useState } from 'react';
import { DrawnVector, ForceTask, ForceType } from '../types';
import { FORCE_CATALOG } from '../data/catalog';
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
  const svgRef = useRef<SVGSVGElement>(null);
  const [gesture, setGesture] = useState<GestureState | null>(null);

  const getPoint = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return { x: 180, y: 175 };
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = 360 / rect.width;
    const scaleY = 350 / rect.height;
    const x = Math.max(16, Math.min(344, (e.clientX - rect.left) * scaleX));
    const y = Math.max(28, Math.min(330, (e.clientY - rect.top) * scaleY));
    return { x, y };
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (passed || e.button > 0) return;
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
    const moved = Math.hypot(v.dx, v.dy) >= 14;

    if (moved) {
      haptics.impact('medium');
      onCommitVector(v);
    }
    setGesture(null);
  };

  // SVG Illustration for the 6 task bodies
  const renderIllustration = () => {
    const ink = 'var(--fl-technical)';
    const line = 'var(--fl-line)';
    const fill = 'var(--fl-object)';
    const angle = (25 * Math.PI) / 180;

    switch (task.kind) {
      case 'incline': {
        const anchor = {
          x: 180 + 41 * Math.cos(angle),
          y: 205 - 41 * Math.sin(angle),
        };
        const leftY = 205 + 36 * Math.cos(angle) + (180 - 41 * Math.sin(angle) - 38) * Math.tan(angle);
        const rightY = 205 + 36 * Math.cos(angle) + (180 - 41 * Math.sin(angle) - 321) * Math.tan(angle);
        let spring = `M ${anchor.x} ${anchor.y} L 221 185`;
        for (let i = 0; i < 12; i++) {
          const x = 221 + i * 4.4;
          const y = 185 - i * 2.05;
          spring += ` L ${x + (i % 2 ? 2.8 : -2.8)} ${y + (i % 2 ? 6 : -6)}`;
        }
        spring += ' L 281 157 L 292 153';

        return (
          <g>
            <path d={`M 38 ${leftY} L 321 ${rightY} L 321 315 Z`} fill={fill} opacity={0.3} />
            <path d={`M 38 ${leftY} L 321 ${rightY}`} fill="none" stroke={ink} strokeWidth="2.2" />
            <path d="M 38 315 H 321" stroke={line} strokeWidth="1" />
            <path d="M 292 153 l -13 -27 m 13 27 l 13 27" stroke={ink} strokeWidth="3" />
            <path d={spring} stroke={ink} strokeWidth="1.8" fill="none" />
            <rect
              x="139"
              y="169"
              width="82"
              height="72"
              rx="3"
              transform="rotate(-25 180 205)"
              fill={fill}
              stroke={ink}
              strokeWidth="1.8"
            />
            <circle cx={anchor.x} cy={anchor.y} r="3" fill={ink} />
            <path d="M 84 315 Q 84 303 79 293" stroke={line} fill="none" />
            <text x="92" y="306" fill={ink} fontSize="14" fontStyle="italic">
              25°
            </text>
          </g>
        );
      }
      case 'table':
        return (
          <g>
            <rect x="135" y="153" width="90" height="74" rx="4" fill={fill} stroke={ink} strokeWidth="1.8" />
            <path d="M 35 227 H 325 M 55 227 V 315 M 305 227 V 315" stroke={ink} strokeWidth="2.2" />
            <path d="M 35 235 H 325" stroke={line} />
          </g>
        );
      case 'hanging':
        return (
          <g>
            <path d="M 95 60 H 265" stroke={ink} strokeWidth="3" />
            <path d="M 180 60 V 165" stroke={ink} strokeWidth="1.9" />
            <rect x="145" y="165" width="70" height="70" rx="5" fill={fill} stroke={ink} strokeWidth="1.8" />
            <circle cx="180" cy="165" r="3" fill={ink} />
          </g>
        );
      case 'magnetic':
        return (
          <g>
            {[105, 152, 200, 248, 295].map(y => (
              <path
                key={y}
                d={`M 42 ${y} H 318 m -9 -4 l 9 4 -9 4`}
                stroke={ink}
                strokeWidth="1.2"
                opacity="0.7"
                fill="none"
              />
            ))}
            <circle cx="180" cy="200" r="31" fill={fill} stroke={ink} strokeWidth="2" />
            <circle cx="180" cy="200" r="4.5" fill={ink} />
            <text x="290" y="90" fill={ink} fontSize="15" fontWeight="bold">
              B →
            </text>
            <text x="224" y="206" fill={ink} fontSize="15" fontStyle="italic">
              I ⊙
            </text>
          </g>
        );
      case 'sail':
        return (
          <g>
            <rect x="24" y="145" width="38" height="90" rx="4" fill={fill} stroke={ink} strokeWidth="1.5" />
            {[160, 220].map(y => (
              <path
                key={y}
                d={`M 62 ${y} H 207 m -9 -4 l 9 4 -9 4`}
                stroke={ink}
                strokeWidth="1.5"
                fill="none"
              />
            ))}
            <path d="M 84 176 V 204 M 84 190 H 213" stroke={ink} strokeWidth="1.6" fill="none" />
            <rect x="213" y="142" width="14" height="96" rx="2" fill={fill} stroke={ink} strokeWidth="2" />
            <path d="M 217 147 V 233" stroke={ink} strokeWidth="1" />
            <circle cx="213" cy="190" r="3" fill={ink} />
            <text x="24" y="263" fill={ink} fontSize="13">
              Свет слева
            </text>
            <text x="236" y="246" fill={ink} fontSize="13">
              Парус
            </text>
          </g>
        );
      case 'lever':
        return (
          <g>
            <path d="M 210 80 H 270" stroke={ink} strokeWidth="3" />
            <path d="M 240 80 V 192" stroke={ink} strokeWidth="1.9" />
            <rect x="60" y="192" width="240" height="16" rx="3" fill={fill} stroke={ink} strokeWidth="1.8" />
            <path d="M 120 208 L 107 234 H 133 Z" fill={fill} stroke={ink} strokeWidth="1.8" />
            <path d="M 97 240 H 143" stroke={line} />
            <circle cx="240" cy="192" r="3" fill={ink} />
          </g>
        );
      default:
        return null;
    }
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
        onClick={() => !isDraft && onSelectVector(v.type)}
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
        ref={svgRef}
        viewBox="0 0 360 350"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          width: '100%',
          flex: 1,
          display: 'block',
          touchAction: 'none',
          userSelect: 'none',
          backgroundColor: 'var(--fl-paper)',
        }}
      >
        {/* Physical scenario drawing */}
        {renderIllustration()}

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
