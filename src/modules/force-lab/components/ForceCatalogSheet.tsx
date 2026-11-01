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

const CATEGORIES = ['Все', 'Механика', 'Электростатика', 'Магнетизм', 'Оптика'];

const TOPIC_LABELS: Record<PhysicsTopic, string> = {
  mechanics: 'Механика',
  electrostatics: 'Электростатика',
  magnetism: 'Магнетизм',
  optics: 'Оптика',
};

export const ForceCatalogSheet: React.FC<ForceCatalogSheetProps> = ({
  isOpen,
  onClose,
  selectedForce,
  drawnVectorTypes,
  onSelectForce,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('Все');

  const allForces = Object.values(FORCE_CATALOG);
  const filteredForces =
    activeCategory === 'Все'
      ? allForces
      : allForces.filter(f => TOPIC_LABELS[f.topic] === activeCategory);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`sheet-backdrop ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Unified Bottom Sheet */}
      <div className={`bottom-sheet ${isOpen ? 'open' : ''}`} role="dialog" aria-modal="true">
        {/* Drag header with handle pill */}
        <div className="sheet-drag-header">
          <div className="handle-pill" />
          <h3>Каталог физических сил</h3>
        </div>

        {/* Categories Bar */}
        <div className="sheet-categories-bar">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              className={`category-chip ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => {
                setActiveCategory(cat);
                haptics.selection();
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Scrollable list of force cards matching law-catalog-card */}
        <div className="sheet-laws-scroll">
          {filteredForces.map(force => {
            const isSelected = selectedForce === force.id;
            const isDrawn = drawnVectorTypes.includes(force.id);

            return (
              <div
                key={force.id}
                className={`law-catalog-card ${isSelected ? 'selected' : ''}`}
                style={{
                  borderColor: isSelected
                    ? 'var(--accent)'
                    : isDrawn
                    ? 'var(--border-strong)'
                    : undefined,
                  backgroundColor: isSelected ? 'var(--accent-bg)' : undefined,
                }}
                onClick={() => {
                  onSelectForce(force.id);
                  haptics.selection();
                  onClose();
                }}
              >
                <div className="law-card-info">
                  <span className="law-card-cat">{TOPIC_LABELS[force.topic]}</span>
                  <span className="law-card-title">{force.name}</span>

                  <div className="law-card-formula" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontSize: 18, color: 'var(--accent)' }}>
                      <MathView math={force.tex} />
                    </div>
                    {force.formula && (
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        <MathView math={force.formula} />
                      </div>
                    )}
                  </div>

                  {force.note && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {force.note}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className="btn-law-add"
                  title={isSelected ? 'Выбрана' : 'Выбрать силу'}
                  style={{
                    backgroundColor: isSelected ? 'var(--accent)' : undefined,
                    color: isSelected ? '#ffffff' : undefined,
                  }}
                >
                  {isSelected ? '✓' : isDrawn ? '•' : '+'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};
