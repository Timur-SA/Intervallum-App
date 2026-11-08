import React, { useMemo } from 'react';
import { ArrowUpRight, Map as MapIcon } from 'lucide-react';
import { PracticeProgress } from '../shared/storage/progressStore';
import { SECTIONS } from '../modules/mini-games/domain/sections';
import { Section, TopicId } from '../modules/mini-games/domain/types';
import {
  isBossReady,
  isSectionDefeated,
  isSectionUnlocked,
  isTopicComplete,
  isTopicUnlocked,
} from '../modules/mini-games/domain/progression';
import './MiniMapPreview.css';

interface MiniMapPreviewProps {
  progress: PracticeProgress;
  currentTopicId: TopicId | null;
  onOpen: (topicId: TopicId | null) => void;
}

interface MiniNode {
  id: string;
  section: Section;
  topicId: TopicId | null;
  x: number;
  y: number;
  kind: 'topic' | 'boss';
  done: boolean;
  current: boolean;
  available: boolean;
}

const WIDTH = 340;
const HEIGHT = 224;
const TOP = 20;
const BOTTOM = 204;

export const MiniMapPreview: React.FC<MiniMapPreviewProps> = ({
  progress,
  currentTopicId,
  onOpen,
}) => {
  const nodes = useMemo(() => {
    const visible = SECTIONS.filter(section => isSectionUnlocked(progress, section.id));
    const result: MiniNode[] = [];
    let index = 0;
    const totalNodes = visible.reduce((sum, section) => sum + section.topics.length + 1, 0);
    const step = totalNodes > 1 ? (BOTTOM - TOP) / (totalNodes - 1) : 0;

    visible.forEach((section, sectionIndex) => {
      section.topics.forEach((topicId, topicIndex) => {
        const y = TOP + index * step;
        const x = WIDTH / 2 + Math.sin(index * 1.28 + sectionIndex * 0.5) * 82;
        const complete = isTopicComplete(progress, topicId);
        const available = isTopicUnlocked(progress, section.id, topicId);

        result.push({
          id: topicId,
          section,
          topicId,
          x,
          y,
          kind: 'topic',
          done: complete,
          current: currentTopicId === topicId,
          available,
        });
        index += 1;
      });

      const y = TOP + index * step;
      const x = WIDTH / 2 + Math.sin(index * 1.28 + sectionIndex * 0.5) * 82;

      result.push({
        id: `${section.id}-boss`,
        section,
        topicId: null,
        x,
        y,
        kind: 'boss',
        done: isSectionDefeated(progress, section.id),
        current: false,
        available: isBossReady(progress, section.id),
      });
      index += 1;
    });

    return { nodes: result, visible };
  }, [progress, currentTopicId]);

  const path = nodes.nodes
    .map((node, index) => `${index === 0 ? 'M' : 'L'} ${node.x.toFixed(1)} ${node.y.toFixed(1)}`)
    .join(' ');

  return (
    <button
      type="button"
      className="mini-map"
      onClick={() => onOpen(currentTopicId)}
      aria-label="Открыть карту"
    >
      <div className="mini-map__head">
        <span className="mini-map__label">
          <MapIcon size={14} />
          Карта
        </span>
        <span className="mini-map__open">
          Открыть
          <ArrowUpRight size={14} />
        </span>
      </div>

      <svg
        className="mini-map__canvas"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Мини-карта прогресса"
      >
        <defs>
          <filter id="mini-map-glow" x="-200%" y="-200%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="3.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {nodes.visible.map((section, sectionIndex) => {
          const sectionNodes = nodes.nodes.filter(node => node.section.id === section.id);
          if (!sectionNodes.length) return null;
          const first = sectionNodes[0];
          const last = sectionNodes[sectionNodes.length - 1];
          return (
            <rect
              key={section.id}
              x="10"
              y={first.y - 8}
              width={WIDTH - 20}
              height={last.y - first.y + 16}
              rx="18"
              strokeWidth="1"
              style={{
                fill: `color-mix(in srgb, var(--section-${section.id}) 8%, transparent)`,
                stroke: `color-mix(in srgb, var(--section-${section.id}) 24%, transparent)`,
              }}
            />
          );
        })}

        <path className="mini-map__path" d={path} />

        {nodes.nodes.map(node => {
          const color = node.done
            ? 'var(--success)'
            : node.available
              ? `var(--section-${node.section.id})`
              : 'var(--locked-fill)';

          return (
            <g key={node.id} className={node.current ? 'mini-map__node is-current' : 'mini-map__node'}>
              {node.current && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.kind === 'boss' ? 10 : 8}
                  fill="none"
                  stroke={`var(--section-${node.section.id})`}
                  strokeWidth="1.8"
                  opacity="0.9"
                />
              )}
              <circle
                cx={node.x}
                cy={node.y}
                r={node.kind === 'boss' ? 5.5 : 4}
                style={{ fill: color }}
                opacity={node.available || node.done ? 1 : 0.6}
              />
              {node.kind === 'boss' && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="8"
                  fill="none"
                  stroke="none"
                  strokeWidth="1"
                  opacity="0.65"
                  style={{ stroke: color }}
                />
              )}
            </g>
          );
        })}
      </svg>
    </button>
  );
};
