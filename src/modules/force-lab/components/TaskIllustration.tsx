import React from 'react';
import { TaskKind } from '../types';

interface TaskIllustrationProps {
  kind: TaskKind;
}

export const TaskIllustration: React.FC<TaskIllustrationProps> = ({ kind }) => {
  const ink = 'var(--fl-technical)';
  const line = 'var(--fl-line)';
  const fill = 'var(--fl-object)';
  const panel = 'var(--fl-panel)';
  const angle = (25 * Math.PI) / 180;

  switch (kind) {
    case 'incline': {
      // slopePoint converts local block coordinates into world coordinates
      // Block center is at (180, 205)
      const slopePoint = (x: number, y: number) => ({
        x: 180 + x * Math.cos(angle) + y * Math.sin(angle),
        y: 205 - x * Math.sin(angle) + y * Math.cos(angle),
      });

      const anchor = slopePoint(41, 0); // Spring attachment point
      const contact = slopePoint(0, 36); // Center of bottom face touching the slope

      const groundY = 315;
      // startX: intersection of the incline line with the ground line y = 315
      const startX = contact.x - (groundY - contact.y) / Math.tan(angle); // ~29.3
      const endX = 321;
      const rightY = contact.y + (contact.x - endX) * Math.tan(angle); // ~179.0

      let spring = `M ${anchor.x} ${anchor.y} L 221 185`;
      for (let i = 0; i < 12; i++) {
        const x = 221 + i * 4.4;
        const y = 185 - i * 2.05;
        spring += ` L ${x + (i % 2 ? 2.8 : -2.8)} ${y + (i % 2 ? 6 : -6)}`;
      }
      spring += ' L 281 157 L 292 153';

      return (
        <g className="fl-illustration-incline">
          {/* Triangular wedge solid body */}
          <path
            d={`M ${startX} ${groundY} L ${endX} ${rightY} L ${endX} ${groundY} Z`}
            fill={fill}
            opacity={0.85}
          />
          {/* Hypotenuse / incline surface */}
          <path
            d={`M ${startX} ${groundY} L ${endX} ${rightY}`}
            fill="none"
            stroke={ink}
            strokeWidth="2.2"
          />
          {/* Right vertical wall of wedge */}
          <path
            d={`M ${endX} ${rightY} L ${endX} ${groundY}`}
            fill="none"
            stroke={ink}
            strokeWidth="1.8"
          />
          {/* Ground horizontal support line */}
          <path
            d={`M 15 ${groundY} H 345`}
            stroke={line}
            strokeWidth="1.5"
          />
          {/* Spring support stop */}
          <path d="M 292 153 l -13 -27 m 13 27 l 13 27" stroke={ink} strokeWidth="3" />
          {/* Spring */}
          <path d={spring} stroke={ink} strokeWidth="1.8" fill="none" />
          {/* Block resting on incline */}
          <rect
            x="139"
            y="169"
            width="82"
            height="72"
            rx="3"
            transform="rotate(-25 180 205)"
            fill={panel}
            stroke={ink}
            strokeWidth="2"
          />
          {/* Spring anchor circle */}
          <circle cx={anchor.x} cy={anchor.y} r="3" fill={ink} />
          {/* Angle arc & label */}
          <path
            d={`M ${startX + 48} ${groundY} A 48 48 0 0 0 ${startX + 48 * Math.cos(angle)} ${groundY - 48 * Math.sin(angle)}`}
            stroke={line}
            fill="none"
            strokeWidth="1.4"
          />
          <text
            x={startX + 56}
            y={groundY - 8}
            fill={ink}
            fontSize="14"
            fontStyle="italic"
            fontFamily="serif"
          >
            25°
          </text>
        </g>
      );
    }
    case 'table':
      return (
        <g className="fl-illustration-table">
          {/* Стол рисуем первым, чтобы линии уходили под брусок */}
          <path d="M 55 227 H 305" stroke={ink} strokeWidth="2.2" />
          <path d="M 55 235 H 305" stroke={line} strokeWidth="1.2" />
          <path d="M 55 227 V 315 M 305 227 V 315" stroke={ink} strokeWidth="2.2" />
          <path d="M 18 315 H 342" stroke={line} strokeWidth="1.5" />
          <rect x="135" y="153" width="90" height="74" rx="4" fill={panel} stroke={ink} strokeWidth="1.8" />
        </g>
      );
    case 'hanging':
      return (
        <g className="fl-illustration-hanging">
          <path d="M 95 60 H 265" stroke={ink} strokeWidth="3" />
          {[110, 130, 150, 170, 190, 210, 230, 250].map(x => (
            <path key={x} d={`M ${x} 60 L ${x + 8} 52`} stroke={line} strokeWidth="1.5" />
          ))}
          <path d="M 180 60 V 165" stroke={ink} strokeWidth="1.9" />
          <rect x="145" y="165" width="70" height="70" rx="5" fill={panel} stroke={ink} strokeWidth="1.8" />
          <circle cx="180" cy="165" r="3" fill={ink} />
        </g>
      );
    case 'magnetic':
      return (
        <g className="fl-illustration-magnetic">
          {[105, 152, 200, 248, 295].map(y => (
            <path
              key={y}
              d={`M 42 ${y} H 318 m -9 -4 l 9 4 -9 4`}
              stroke={ink}
              strokeWidth="1.2"
              opacity="0.75"
              fill="none"
            />
          ))}
          <circle cx="180" cy="200" r="31" fill={panel} stroke={ink} strokeWidth="2" />
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
        <g className="fl-illustration-sail">
          <rect x="24" y="145" width="38" height="90" rx="4" fill={panel} stroke={ink} strokeWidth="1.5" />
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
          <rect x="213" y="142" width="14" height="96" rx="2" fill={panel} stroke={ink} strokeWidth="2" />
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
        <g className="fl-illustration-lever">
          <path d="M 210 80 H 270" stroke={ink} strokeWidth="3" />
          <path d="M 240 80 V 192" stroke={ink} strokeWidth="1.9" />
          <rect x="60" y="192" width="240" height="16" rx="3" fill={panel} stroke={ink} strokeWidth="1.8" />
          <path d="M 120 208 L 107 234 H 133 Z" fill={fill} stroke={ink} strokeWidth="1.8" />
          <path d="M 97 240 H 143" stroke={line} strokeWidth="1.5" />
          <circle cx="240" cy="192" r="3" fill={ink} />
        </g>
      );
    default:
      return null;
  }
};
