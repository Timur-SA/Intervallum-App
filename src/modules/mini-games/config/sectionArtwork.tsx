import React from 'react';
import { SectionId } from '../domain/types';

/**
 * Абстрактные фоновые паттерны разделов.
 * Рисуются тонким line-art в цвете раздела и занимают всю высоту карты,
 * поэтому фон воспринимается как текстура, а не как отдельная картинка.
 */

const patternSvgProps = {
  width: '100%',
  height: '100%',
  'aria-hidden': true,
  focusable: 'false',
} as const;

const MechanicsPattern: React.FC = () => (
  <svg {...patternSvgProps}>
    <defs>
      <pattern
        id="mg-pat-mechanics"
        width="56"
        height="56"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(-10)"
      >
        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 28 0 V 56 M 0 28 H 56" strokeWidth="1.3" opacity="0.6" />
          <path d="M 6 50 L 18 38 M 38 18 L 50 6" strokeWidth="1.4" opacity="0.55" />
          <circle cx="10" cy="10" r="2.4" strokeWidth="1.2" opacity="0.85" />
          <circle cx="46" cy="46" r="1.6" fill="currentColor" stroke="none" opacity="0.75" />
        </g>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#mg-pat-mechanics)" />
  </svg>
);

const ThermalPattern: React.FC = () => (
  <svg {...patternSvgProps}>
    <defs>
      <pattern
        id="mg-pat-thermal"
        width="76"
        height="44"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(-3)"
      >
        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 0 22 q 19 -14 38 0 t 38 0" strokeWidth="1.6" opacity="0.75" />
          <circle cx="14" cy="8" r="1.8" fill="currentColor" stroke="none" opacity="0.65" />
          <circle cx="58" cy="36" r="1.8" fill="currentColor" stroke="none" opacity="0.65" />
        </g>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#mg-pat-thermal)" />
  </svg>
);

const ElectromagnetismPattern: React.FC = () => (
  <svg {...patternSvgProps}>
    <defs>
      <pattern
        id="mg-pat-electromagnetism"
        width="64"
        height="64"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(8)"
      >
        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10" cy="10" r="1.6" fill="currentColor" stroke="none" opacity="0.75" />
          <circle cx="42" cy="42" r="1.6" fill="currentColor" stroke="none" opacity="0.75" />
          <path d="M 0 32 Q 16 16 32 32 T 64 32" strokeWidth="1.4" opacity="0.65" />
          <path d="M 32 0 V 64" strokeWidth="1" strokeDasharray="2 8" opacity="0.55" />
        </g>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#mg-pat-electromagnetism)" />
  </svg>
);

export const SECTION_PATTERNS: Record<SectionId, React.FC> = {
  mechanics: MechanicsPattern,
  thermal: ThermalPattern,
  electromagnetism: ElectromagnetismPattern,
};

/**
 * Маленькие тематические рисунки для изломов дорожки.
 * Показываются с противоположной стороны от поворота.
 */

const accentSvgProps = {
  viewBox: '0 0 48 48',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: 'false',
} as const;

const GearAccent: React.FC = () => (
  <svg {...accentSvgProps}>
    <g transform="translate(24 24)">
      <circle r="12" />
      <circle r="4.5" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
        <rect
          key={angle}
          x="-2.5"
          y="-17"
          width="5"
          height="7"
          rx="1"
          transform={`rotate(${angle})`}
        />
      ))}
    </g>
  </svg>
);

const VectorAccent: React.FC = () => (
  <svg {...accentSvgProps}>
    <path d="M 8 38 L 36 14" />
    <path d="M 36 14 l -9 1 M 36 14 l -1 9" />
    <circle cx="8" cy="38" r="2.5" fill="currentColor" stroke="none" />
  </svg>
);

const FlameAccent: React.FC = () => (
  <svg {...accentSvgProps}>
    <path d="M 24 40 C 14 32 18 22 25 10 C 27 18 34 20 36 14 C 42 24 40 34 33 39 C 30 42 27 42 24 40 Z" />
    <path d="M 27 36 C 23 31 25 26 29 20 C 30 26 33 28 33 32 C 33 35 30 37 27 36 Z" />
  </svg>
);

const ThermometerAccent: React.FC = () => (
  <svg {...accentSvgProps}>
    <rect x="18" y="7" width="10" height="26" rx="5" />
    <circle cx="23" cy="37" r="6" />
    <path d="M 33 12 H 38 M 33 18 H 38 M 33 24 H 38" />
  </svg>
);

const BoltAccent: React.FC = () => (
  <svg {...accentSvgProps}>
    <path d="M 27 5 L 14 26 H 23 L 19 43 L 34 21 H 25 L 31 5 Z" />
  </svg>
);

const OrbitAccent: React.FC = () => (
  <svg {...accentSvgProps}>
    <ellipse cx="24" cy="24" rx="19" ry="7" transform="rotate(-28 24 24)" />
    <ellipse cx="24" cy="24" rx="19" ry="7" transform="rotate(28 24 24)" />
    <circle cx="24" cy="24" r="2.5" fill="currentColor" stroke="none" />
    <circle cx="39" cy="14" r="2" fill="currentColor" stroke="none" />
  </svg>
);

export const SECTION_ACCENTS: Record<SectionId, React.FC[]> = {
  mechanics: [GearAccent, VectorAccent],
  thermal: [FlameAccent, ThermometerAccent],
  electromagnetism: [BoltAccent, OrbitAccent],
};
