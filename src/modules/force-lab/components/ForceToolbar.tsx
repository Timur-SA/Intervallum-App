import React from 'react';
import { Button } from '@maxhub/max-ui';
import { Undo2, Trash2, BookOpen } from 'lucide-react';
import { MathView } from '../../../shared/components/MathView';
import { FORCE_CATALOG } from '../data/catalog';
import { ForceType } from '../types';

interface ForceToolbarProps {
  selectedForce: ForceType | null;
  activeVectorType: ForceType | null;
  canUndo: boolean;
  canDelete: boolean;
  passed: boolean;
  completed: boolean;
  onOpenLibrary: () => void;
  onUndo: () => void;
  onDelete: () => void;
  onCheck: () => void;
}

export const ForceToolbar: React.FC<ForceToolbarProps> = ({
  selectedForce,
  activeVectorType,
  canUndo,
  canDelete,
  passed,
  completed,
  onOpenLibrary,
  onUndo,
  onDelete,
  onCheck,
}) => {
  const activeForceItem = selectedForce ? FORCE_CATALOG[selectedForce] : null;

  return (
    <div
      style={{
        padding: '8px 16px 12px',
        backgroundColor: 'var(--bg-card)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {/* Top row: Selected Force info + Undo + Delete */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <button
          type="button"
          onClick={onOpenLibrary}
          disabled={passed}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 12px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            textAlign: 'left',
            color: 'var(--text-primary)',
          }}
          aria-label="Выбрать силу из библиотеки"
        >
          <span style={{ fontSize: 18, color: 'var(--fl-accent)' }}>
            {activeForceItem ? (
              <MathView math={activeForceItem.tex} />
            ) : (
              <BookOpen size={18} />
            )}
          </span>
          <span style={{ fontSize: 13, fontWeight: 500 }}>
            {activeForceItem ? activeForceItem.name : 'Выбрать силу'}
          </span>
        </button>

        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo || passed}
            title="Отменить действие"
            style={{
              width: 40,
              height: 40,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 10,
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
            }}
          >
            <Undo2 size={18} />
          </button>

          <button
            type="button"
            onClick={onDelete}
            disabled={!canDelete || passed}
            title="Удалить выбранный вектор"
            style={{
              width: 40,
              height: 40,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 10,
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
            }}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Primary Action Button (MAX UI Button) */}
      <Button
        variant={passed ? 'secondary' : 'primary'}
        size="large"
        stretched
        onClick={onCheck}
        style={{
          borderRadius: 14,
          fontWeight: 600,
          backgroundColor: passed ? 'var(--fl-pass)' : undefined,
          color: passed ? 'var(--fl-on-pass)' : undefined,
        }}
      >
        {completed ? 'Начать заново' : passed ? 'Следующая задача' : 'Проверить'}
      </Button>
    </div>
  );
};
