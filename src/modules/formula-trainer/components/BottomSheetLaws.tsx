import React, { useState } from 'react';
import { PhysicalLaw } from '../types/physics';
import { PHYSICS_LAWS } from '../data/physicsDb';
import { MathView } from './MathView';

interface BottomSheetLawsProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLaw: (law: PhysicalLaw) => void;
}

export const BottomSheetLaws: React.FC<BottomSheetLawsProps> = ({
  isOpen,
  onClose,
  onSelectLaw
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('Все');

  const categories = ['Все', 'Электричество', 'Механика', 'Термодинамика'];

  const filteredLaws =
    activeCategory === 'Все'
      ? PHYSICS_LAWS
      : PHYSICS_LAWS.filter((l) => l.category === activeCategory);

  return (
    <>
      <div
        className={`sheet-backdrop ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
      />

      <div className={`bottom-sheet ${isOpen ? 'open' : ''}`}>
        <div className="sheet-drag-header">
          <div className="handle-pill" />
          <h3>Каталог физических законов</h3>
        </div>

        <div className="sheet-categories-bar">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`category-chip ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="sheet-laws-scroll">
          {filteredLaws.map((law) => (
            <div
              key={law.id}
              className="law-catalog-card"
              onClick={() => {
                onSelectLaw(law);
                onClose();
              }}
            >
              <div className="law-card-info">
                <span className="law-card-cat">{law.category}</span>
                <span className="law-card-title">{law.name}</span>
                <div className="law-card-formula">
                  <MathView latex={law.latex} />
                </div>
              </div>
              <button type="button" className="btn-law-add" title="Добавить в ленту">
                +
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
