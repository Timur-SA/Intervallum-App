import React from 'react';
import { PracticeProgress } from '../shared/storage/progressStore';
import { Section, TopicId } from '../modules/mini-games/domain/types';
import {
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
  const step = visibleTopics.length > 1 ? 116 / (visibleTopics.length - 1) : 0;

  const nodes = visibleTopics.map((topicId, index) => {
    const absoluteIndex = start + index;
    return {
      id: topicId,
      level: absoluteIndex + 1,
      x: WIDTH / 2 + Math.sin((absoluteIndex + 1) * 1.2) * 30,
      y: 18 + index * step,
      done: isTopicComplete(progress, topicId),
      current: topicId === currentTopicId,
      available: isTopicUnlocked(progress, section?.id ?? 'mechanics', topicId),
    };
  });

  // Линия должна продолжаться к предыдущему, уже скрытому кружку.
  const previousPoint = start > 0
    ? {
        x: WIDTH / 2 + Math.sin(start * 1.2) * 30,
        y: 18 - step,
      }
    : null;

  const pathParts = nodes.map(
    (node, index) => `${index === 0 ? 'M' : 'L'} ${node.x.toFixed(1)} ${node.y.toFixed(1)}`,
  );
  const path = previousPoint
    ? `M ${previousPoint.x.toFixed(1)} ${previousPoint.y.toFixed(1)} ${pathParts
        .join(' ')
        .replace(/^M/, 'L')}`
    : pathParts.join(' ');

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
                  r="10.5"
                  fill="none"
                  stroke={`var(--section-${section?.id ?? 'mechanics'})`}
                  strokeWidth="2"
                  opacity="0.88"
                />
              )}
              <circle
                cx={node.x}
                cy={node.y}
                r={node.current ? 7.2 : 6.1}
                style={{ fill: color }}
                opacity={node.available || node.done ? 1 : 0.72}
              />
              <text
                x={node.x}
                y={node.y + 2.5}
                className="mini-map__number"
                textAnchor="middle"
                fontSize="7.2"
              >
                {node.level}
              </text>
            </g>
          );
        })}
      </svg>
    </button>
  );
};
