import React from 'react';
import { Undo2, Trash2, BookOpen } from 'lucide-react';
import { MathView } from '../../../shared/components/MathView';
import { FORCE_CATALOG } from '../data/catalog';
import { ForceType } from '../types';

interface ForceToolbarProps {
  selectedForce: ForceType | null;
  activeVectorType: ForceType | null;
  canUndo: boolean;
  canDelete: boolean;
  onOpenLibrary: () => void;
  onUndo: () => void;
  onDelete: () => void;
}

export const ForceToolbar: React.FC<ForceToolbarProps> = ({
  selectedForce,
  activeVectorType,
  canUndo,
  canDelete,
  onOpenLibrary,
  onUndo,
  onDelete,
}) => {
  const activeForceItem = selectedForce ? FORCE_CATALOG[selectedForce] : null;

  return (
    <div
      style={{
        padding: '10px 16px 14px',
        backgroundColor: 'var(--bg-card)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        flexShrink: 0,
      }}
    >
      {/* Button to open Bottom Sheet catalog */}
      <button
        type="button"
        onClick={onOpenLibrary}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 14px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid ' + (activeForceItem ? 'var(--accent)' : 'var(--border)'),
          borderRadius: 14,
          textAlign: 'left',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          transition: 'all 120ms ease',
        }}
        aria-label="Каталог сил"
      >
        <span
          style={{
            fontSize: 18,
            color: activeForceItem ? 'var(--accent)' : 'var(--text-muted)',
            minWidth: 28,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {activeForceItem ? <MathView math={activeForceItem.tex} /> : <BookOpen size={18} />}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {activeForceItem ? activeForceItem.name : 'Каталог сил'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {activeForceItem ? 'Выбрана для рисования' : 'Нажмите, чтобы выбрать'}
          </div>
        </div>
      </button>

      {/* Undo & Delete buttons */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          title="Отменить действие"
          className="unified-header-btn"
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            border: '1px solid var(--border)',
            backgroundColor: 'var(--bg-surface)',
            color: canUndo ? 'var(--text-primary)' : 'var(--text-muted)',
            cursor: canUndo ? 'pointer' : 'default',
            opacity: canUndo ? 1 : 0.45,
          }}
        >
          <Undo2 size={18} />
        </button>

        <button
          type="button"
          onClick={onDelete}
          disabled={!canDelete}
          title="Удалить выбранный вектор"
          className="unified-header-btn"
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            border: '1px solid var(--border)',
            backgroundColor: 'var(--bg-surface)',
            color: canDelete ? 'var(--danger)' : 'var(--text-muted)',
            cursor: canDelete ? 'pointer' : 'default',
            opacity: canDelete ? 1 : 0.45,
          }}
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};
