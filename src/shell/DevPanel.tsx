import React from 'react';
import {
  completeCurrentLevel,
  completeCurrentSection,
  currentSectionId,
} from '../shared/dev/devActions';
import {
  defeatBoss,
  loadUserProgress,
  resetUserProgress,
  saveUserProgress,
} from '../shared/storage/progressStore';
import { getSection } from '../modules/mini-games/domain/sections';

const actions = [
  {
    label: 'Уровень',
    run: () => {
      const data = loadUserProgress();
      completeCurrentLevel(data.practice);
      saveUserProgress(data);
    },
  },
  {
    label: 'Все уровни',
    run: () => {
      const data = loadUserProgress();
      completeCurrentSection(data.practice);
      saveUserProgress(data);
    },
  },
  {
    label: 'Босс',
    run: () => {
      const data = loadUserProgress();
      completeCurrentSection(data.practice);
      saveUserProgress(data);
      const section = getSection(currentSectionId(data.practice));
      if (section) defeatBoss({ sectionId: section.id, itemId: section.itemId });
    },
  },
  {
    label: 'Сброс',
    run: () => resetUserProgress(),
  },
];

/** Отладочные действия в песочнице. В MAX не показывается. */
export const DevPanel: React.FC = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '6px 12px',
      backgroundColor: 'var(--bg-card)',
      borderBottom: '1px solid var(--border)',
      flexShrink: 0,
    }}
  >
    <span
      style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: 0.6,
        color: 'var(--text-muted)',
        marginRight: 2,
      }}
    >
      DEV
    </span>
    {actions.map(action => (
      <button
        key={action.label}
        type="button"
        onClick={() => {
          action.run();
          window.location.reload();
        }}
        style={{
          padding: '4px 9px',
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'var(--bg-surface)',
          color: 'var(--text-secondary)',
          fontSize: 10.5,
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {action.label}
      </button>
    ))}
  </div>
);
