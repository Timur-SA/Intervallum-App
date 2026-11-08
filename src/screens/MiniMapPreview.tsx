import React from 'react';
import { PracticeProgress } from '../shared/storage/progressStore';
import { Section, TopicId } from '../modules/mini-games/domain/types';
import {
  isTopicComplete,
  isTopicUnlocked,
} from '../modules/mini-games/domain/progression';
import './MiniMapPreview.css';

interface MiniMapPreviewProps {
  progress: PracticeProgress;
  section: Section | null;
  currentTopicId: TopicId | null;
  onOpen: (topicId: TopicId | null) => void;
}

const MAX_LEVELS = 5;
const WIDTH = 120;
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
  const start = Math.max(0, currentIndex - 2);
  const visibleTopics = topics.slice(start, start + MAX_LEVELS);
  const step = visibleTopics.length > 1 ? 118 / (visibleTopics.length - 1) : 0;

  const nodes = visibleTopics.map((topicId, index) => {
    const absoluteIndex = start + index;
    return {
      id: topicId,
      x: WIDTH / 2 + Math.sin((absoluteIndex + 1) * 1.2) * 27,
      y: 18 + index * step,
      done: isTopicComplete(progress, topicId),
      current: topicId === currentTopicId,
      available: isTopicUnlocked(progress, section?.id ?? 'mechanics', topicId),
    };
  });

  const path = nodes
    .map((node, index) => `${index === 0 ? 'M' : 'L'} ${node.x.toFixed(1)} ${node.y.toFixed(1)}`)
    .join(' ');

  return (
    <button
      type="button"
      className="mini-map"
      onClick={() => onOpen(currentTopicId)}
      aria-label="Открыть карту"
    >
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
                  r="9"
                  fill="none"
                  stroke={`var(--section-${section?.id ?? 'mechanics'})`}
                  strokeWidth="1.8"
                  opacity="0.9"
                />
              )}
              <circle
                cx={node.x}
                cy={node.y}
                r={node.current ? 5.3 : 4.2}
                style={{ fill: color }}
                opacity={node.available || node.done ? 1 : 0.62}
              />
            </g>
          );
        })}
      </svg>
    </button>
  );
};
