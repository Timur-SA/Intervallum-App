import React, { useState } from 'react';
import { BottomSheet, Button } from '@maxhub/max-ui';
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

  const forcesInTopic = Object.values(FORCE_CATALOG).filter(
    f => f.topic === activeTopic
  );

  return (
    <BottomSheet open={isOpen} onClose={onClose} title="Выбрать силу">
      <div style={{ padding: '8px 16px 24px', maxHeight: '80vh', overflowY: 'auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Выбрать силу</h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 0,
              fontSize: 24,
              color: 'var(--fl-soft)',
              padding: '4px 8px',
            }}
          >
            ×
          </button>
        </div>

        {/* Topic filter buttons */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            marginBottom: 16,
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
                  padding: '6px 12px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 500,
                  border: '1px solid var(--fl-line)',
                  backgroundColor: isActive ? 'var(--fl-wash)' : 'var(--fl-panel)',
                  color: isActive ? 'var(--fl-accent)' : 'var(--fl-soft)',
                }}
              >
                {topic.label}
              </button>
            );
          })}
        </div>

        {/* Forces List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
                  gap: 14,
                  padding: '12px 14px',
                  borderRadius: 14,
                  border: isSelected
                    ? '1.5px solid var(--fl-accent)'
                    : '1px solid var(--fl-line)',
                  backgroundColor: isSelected ? 'var(--fl-wash)' : 'var(--fl-panel)',
                  textAlign: 'left',
                  color: 'var(--fl-ink)',
                }}
              >
                <span
                  style={{
                    fontSize: 22,
                    color: 'var(--fl-accent)',
                    minWidth: 44,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <MathView math={force.tex} />
                </span>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 500 }}>{force.name}</div>
                  {(force.formula || force.note) && (
                    <div style={{ fontSize: 12, color: 'var(--fl-soft)', marginTop: 2 }}>
                      {force.formula && <MathView math={force.formula} />}{' '}
                      {force.note && <span>{force.note}</span>}
                    </div>
                  )}
                </div>

                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: isSelected
                      ? 'var(--fl-accent)'
                      : isDrawn
                      ? 'var(--fl-ink)'
                      : 'var(--fl-soft)',
                  }}
                >
                  {isSelected ? 'Выбрана' : isDrawn ? 'На схеме' : 'Выбрать'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </BottomSheet>
  );
};
