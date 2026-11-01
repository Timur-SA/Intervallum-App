import React from 'react';

interface SandboxMessengerHeaderProps {
  canGoBack: boolean;
  onBack?: () => void;
  platform: 'ios' | 'android';
}

/**
 * Emulates the host MAX / Telegram messenger client modal header bar ("шторка").
 * This is an external container element of the desktop sandbox tester, NOT part of the Mini App.
 * In a real MAX client, this is rendered natively by the messenger itself.
 */
export const SandboxMessengerHeader: React.FC<SandboxMessengerHeaderProps> = ({
  canGoBack,
  onBack,
  platform,
}) => {
  return (
    <div className={`sandbox-messenger-header platform-${platform}`}>
      <div className="messenger-header-left">
        {canGoBack ? (
          <button
            type="button"
            className="messenger-btn messenger-back-btn"
            onClick={onBack}
            aria-label="Назад"
            title="Назад"
          >
            {platform === 'ios' ? '‹' : '←'}
          </button>
        ) : (
          <div style={{ width: 30 }} />
        )}
      </div>

      <div className="messenger-header-title">
        Intervallum
      </div>

      <div className="messenger-header-right">
        <button
          type="button"
          className="messenger-btn"
          aria-label="Опции"
          title="Опции"
        >
          {platform === 'ios' ? '•••' : '⋮'}
        </button>
        <button
          type="button"
          className="messenger-btn"
          aria-label="Закрыть"
          title="Закрыть"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
