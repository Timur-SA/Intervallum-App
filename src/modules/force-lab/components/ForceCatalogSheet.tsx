import React, { useState } from 'react';
import { MathView } from '../../../shared/components/MathView';
import { FORCE_CATALOG } from '../data/catalog';
import { ForceType, PhysicsTopic } from '../types';
import { haptics } from '../../../shared/motion/haptics';

interface ForceCatalogSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedForce: ForceType | null;
  drawnVectorTypes: ForceType[];
  onSelectForce: (type: ForceType) => void;
}

const TOPICS: { id: PhysicsTopic; label: string }[] = [
  { id: 'mechanics', label: 'Механика' },
  { id: 'electrostatics', label: 'Электростатика' },
  { id: 'magnetism', label: 'Магнетизм' },
  { id: 'optics', label: 'Оптика' },
];

export const ForceCatalogSheet: React.FC<ForceCatalogSheetProps> = ({
  isOpen,
  onClose,
  selectedForce,
  drawnVectorTypes,
  onSelectForce,
}) => {
  const [activeTopic, setActiveTopic] = useState<PhysicsTopic>('mechanics');

  if (!isOpen) return null;

  const forcesInTopic = Object.values(FORCE_CATALOG).filter(
    f => f.topic === activeTopic
  );

  return (
    <>
      {/* Dimmed backdrop contained within sandbox frame */}
      <div
        className="sandbox-sheet-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet container strictly positioned at bottom of chassis */}
      <div
        className="sandbox-sheet-container"
        role="dialog"
        aria-modal="true"
        aria-label="Выбрать силу"
      >
        <div className="sandbox-sheet-handle" />

        {/* Top title bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 18px 10px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)' }}>
            Выбрать силу
          </div>
          <button
            type="button"
            onClick={onClose}
            className="unified-header-btn"
            style={{ width: 32, height: 32, fontSize: 20 }}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        {/* Scrollable list content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 16px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {/* Topic filter chips */}
          <div
            style={{
              display: 'flex',
              gap: 6,
              overflowX: 'auto',
              paddingBottom: 2,
            }}
          >
            {TOPICS.map(topic => {
              const isActive = activeTopic === topic.id;
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => {
                    setActiveTopic(topic.id);
                    haptics.selection();
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    border: '1px solid ' + (isActive ? 'var(--accent)' : 'var(--border)'),
                    backgroundColor: isActive ? 'var(--accent-bg)' : 'var(--bg-surface)',
                    color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                    transition: 'all 120ms ease',
                    cursor: 'pointer',
                  }}
                >
                  {topic.label}
                </button>
              );
            })}
          </div>

          {/* Forces List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {forcesInTopic.map(force => {
              const isSelected = selectedForce === force.id;
              const isDrawn = drawnVectorTypes.includes(force.id);

              return (
                <button
                  key={force.id}
                  type="button"
                  onClick={() => {
                    onSelectForce(force.id);
                    haptics.selection();
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 14px',
                    borderRadius: 16,
                    border: '1px solid ' + (isSelected ? 'var(--fl-accent)' : 'var(--border)'),
                    backgroundColor: isSelected ? 'var(--fl-wash)' : 'var(--bg-card)',
                    textAlign: 'left',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'all 120ms ease',
                  }}
                >
                  {/* Force Math Vector Symbol */}
                  <div
                    style={{
                      fontSize: 22,
                      color: isSelected ? 'var(--fl-accent)' : 'var(--accent)',
                      minWidth: 46,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: 'var(--bg-surface)',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <MathView math={force.tex} />
                  </div>

                  {/* Name and Formula */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        lineHeight: 1.25,
                      }}
                    >
                      {force.name}
                    </div>
                    {(force.formula || force.note) && (
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--text-muted)',
                          marginTop: 3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {force.formula && <MathView math={force.formula} />}{' '}
                        {force.note && <span>{force.note}</span>}
                      </div>
                    )}
                  </div>

                  {/* State badge */}
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '4px 8px',
                      borderRadius: 8,
                      flexShrink: 0,
                      backgroundColor: isSelected
                        ? 'var(--fl-wash)'
                        : isDrawn
                        ? 'var(--bg-surface)'
                        : 'transparent',
                      color: isSelected
                        ? 'var(--fl-accent)'
                        : isDrawn
                        ? 'var(--text-primary)'
                        : 'var(--text-muted)',
                      border: isDrawn ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    {isSelected ? 'Выбрана' : isDrawn ? 'На схеме' : 'Выбрать'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};
