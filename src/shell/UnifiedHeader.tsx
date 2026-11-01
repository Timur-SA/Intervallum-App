import React from 'react';
import { useHeader } from './HeaderContext';

export const UnifiedHeader: React.FC = () => {
  const { headerConfig } = useHeader();
  const { title, subtitle, canGoBack, onBack, rightAction } = headerConfig;

  return (
    <header className="unified-header">
      <div className="unified-header-left">
        {canGoBack ? (
          <button
            type="button"
            className="unified-header-btn"
            onClick={onBack}
            aria-label="Назад"
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>←</span>
          </button>
        ) : (
          <div
            style={{
              width: 36,
              height: 36,
              display: 'grid',
              placeItems: 'center',
              fontSize: 20,
            }}
          >
            ⚡
          </div>
        )}
      </div>

      <div className="unified-header-title">
        <div style={{ fontWeight: 600, fontSize: 16, lineHeight: 1.2 }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>
            {subtitle}
          </div>
        )}
      </div>

      <div className="unified-header-right">
        {rightAction || <div style={{ width: 36 }} />}
      </div>
    </header>
  );
};
