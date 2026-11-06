import React, { useState } from 'react';
import { PhysicsTask } from '../types/physics';
import { MathText } from '../../../shared/components/MathView';

interface CollapsibleProblemPanelProps {
  task: PhysicsTask;
  onPointerDownGiven: (e: React.PointerEvent, symbol: string, value: number, unit: string) => void;
}

export const CollapsibleProblemPanel: React.FC<CollapsibleProblemPanelProps> = ({
  task,
  onPointerDownGiven
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`problem-panel ${collapsed ? 'collapsed' : ''}`}>
      <div className="problem-panel-bar">
        <span className="panel-bar-title">Условие задачи</span>
        <button
          className="btn-toggle-panel"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Развернуть условие' : 'Свернуть условие'}
        >
          <span className="chevron">{collapsed ? '▼' : '▲'}</span>
        </button>
      </div>

      <div className="problem-panel-content">
        <div className="problem-text">
          <MathText text={task.description} />
        </div>
      </div>

      <div className="givens-strip">
        {task.givens.map((g) => (
          <div
            key={g.symbol}
            className="given-chip"
            title="Перетяните на букву в формуле"
            onPointerDown={(e) => onPointerDownGiven(e, g.symbol, g.value, g.unit)}
          >
            <span className="given-sym">{g.symbol}</span>
            <span className="given-eq">=</span>
            <span className="given-val">{g.value}</span>
            <span className="given-unit">{g.unit}</span>
          </div>
        ))}

        <div className="find-chip">
          <span className="find-label">Найти:</span>
          <span className="find-target">
            <b>{task.find.symbol}</b> = ? {task.find.unit}
          </span>
        </div>
      </div>
    </div>
  );
};
