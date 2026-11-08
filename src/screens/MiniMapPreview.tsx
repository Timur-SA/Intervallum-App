import React from 'react';
import { PracticeProgress } from '../shared/storage/progressStore';
import { Section, TopicId } from '../modules/mini-games/domain/types';
import {
  isBossReady,
  isSectionDefeated,
  isTopicComplete,
  isTopicUnlocked,
} from '../modules/mini-games/domain/progression';
import { SECTION_PATTERNS } from '../modules/mini-games/config/sectionArtwork';
import './MiniMapPreview.css';

interface MiniMapPreviewProps {
  progress: PracticeProgress;
  section: Section | null;
  currentTopicId: TopicId | null;
  onOpen: (topicId: TopicId | null) => void;
}

const MAX_LEVELS = 5;
const WIDTH = 132;
const HEIGHT = 154;
const LEVEL_TOP = 14;
const LEVEL_BOTTOM = 112;
const BOSS_Y = 142;

export const MiniMapPreview: React.FC<MiniMapPreviewProps> = ({
  progress,
  section,
  currentTopicId,
  onOpen,
}) => {
  const topics = section?.topics ?? [];
  const currentIndex = Math.max(
    0,
    topics.findIndex(topicId => topicId === currentTopicId),
  );

  // Активный уровень должен быть не дальше центра. У конца раздела
  // фрагмент просто упирается в границу секции и показывает три последних.
  const start = Math.max(0, currentIndex - 2);
  const visibleTopics = topics.slice(start, start + MAX_LEVELS);
  const step = visibleTopics.length > 1 ? (LEVEL_BOTTOM - LEVEL_TOP) / (visibleTopics.length - 1) : 0;

  const nodes = visibleTopics.map((topicId, index) => {
    const absoluteIndex = start + index;
    return {
      id: topicId,
      level: absoluteIndex + 1,
      x: WIDTH / 2 + Math.sin((absoluteIndex + 1) * 1.2) * 30,
      y: LEVEL_TOP + index * step,
      done: isTopicComplete(progress, topicId),
      current: topicId === currentTopicId,
      available: isTopicUnlocked(progress, section?.id ?? 'mechanics', topicId),
    };
  });

  // Линия должна продолжаться к предыдущему, уже скрытому кружку.
  const previousPoint = start > 0
    ? {
        x: WIDTH / 2 + Math.sin(start * 1.2) * 30,
        y: LEVEL_TOP - step,
      }
    : null;

  const nextPoint = start + visibleTopics.length < topics.length
    ? {
        x: WIDTH / 2 + Math.sin((start + visibleTopics.length + 1) * 1.2) * 30,
        y: LEVEL_TOP + visibleTopics.length * step,
      }
    : null;

  const points = [previousPoint, ...nodes, nextPoint].filter(
    (point): point is NonNullable<typeof point> => Boolean(point),
  );
  const path = points
    .map(
      (point, index) =>
        `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`,
    )
    .join(' ');

  const bossReady = section ? isBossReady(progress, section.id) : false;
  const bossDone = section ? isSectionDefeated(progress, section.id) : false;
  const bossColor = bossDone
    ? 'var(--success)'
    : bossReady
      ? 'var(--boss-color)'
      : 'var(--locked-fill)';

  const lastPoint = points[points.length - 1];
  const SectionPattern = section ? SECTION_PATTERNS[section.id] : null;

  return (
    <button
      type="button"
      className="mini-map"
      onClick={() => onOpen(currentTopicId)}
      aria-label="Открыть карту"
    >
      {SectionPattern && (
        <span
          className="mini-map__bg"
          style={{ color: `var(--section-${section?.id ?? 'mechanics'})` }}
          aria-hidden
        >
          <SectionPattern />
        </span>
      )}

      <svg
        className="mini-map__canvas"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Фрагмент карты"
      >
        {path && <path className="mini-map__path" d={path} />}
        {section && lastPoint && (
          <path
            className="mini-map__boss-link"
            d={`M ${lastPoint.x.toFixed(1)} ${lastPoint.y.toFixed(1)} Q ${WIDTH / 2} ${
              HEIGHT - 22
            } ${WIDTH / 2} ${BOSS_Y}`}
          />
        )}

        {nodes.map(node => {
          const color = node.done
            ? 'var(--success)'
            : node.available
              ? `var(--section-${section?.id ?? 'mechanics'})`
              : 'var(--locked-fill)';

          return (
            <g
              key={node.id}
              className={`mini-map__node ${node.current ? 'is-current' : ''}`}
            >
              {node.current && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="11.5"
                  fill="none"
                  stroke={`var(--section-${section?.id ?? 'mechanics'})`}
                  strokeWidth="2"
                  opacity="0.88"
                />
              )}
              <circle
                cx={node.x}
                cy={node.y}
                r={node.current ? 8 : 6.8}
                style={{ fill: color }}
                opacity={node.available || node.done ? 1 : 0.72}
              />
              <text
                x={node.x}
                y={node.y + 2.5}
                className="mini-map__number"
                textAnchor="middle"
                fontSize="7.8"
              >
                {node.level}
              </text>
            </g>
          );
        })}

        {section && (
          <g className={`mini-map__boss ${bossReady ? 'is-ready' : ''} ${bossDone ? 'is-done' : ''}`}>
            {bossReady && (
              <circle
                cx={WIDTH / 2}
                cy={BOSS_Y}
                r="11.5"
                fill="none"
                stroke={bossColor}
                strokeWidth="2"
                opacity="0.88"
              />
            )}
            <circle
              cx={WIDTH / 2}
              cy={BOSS_Y}
              r={bossReady ? 8 : 6.8}
              style={{ fill: bossColor }}
              opacity={bossReady || bossDone ? 1 : 0.72}
            />
            <path
              d="M6 1 C4.8 3.8 2 4.8 2 7.2 C2 9.7 4 11.2 6 11.2 C8.4 11.2 10.2 9.5 10.2 7.3 C10.2 5.2 8.4 4 7.2 1.8 C7.1 3.1 6.5 3.9 5.8 4.3 C5.8 3.2 5.9 2.2 6 1 Z"
              transform={`translate(${WIDTH / 2 - 6} ${BOSS_Y - 6})`}
              fill="#fff"
            />
          </g>
        )}
      </svg>
    </button>
  );
};
