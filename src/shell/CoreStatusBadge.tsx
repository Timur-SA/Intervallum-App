import React, { useEffect, useState } from 'react';
import {
  getCoreStatus,
  probeCore,
  subscribeCoreStatus,
  type CoreStatus,
} from '../modules/mini-games/api/status';

const COLORS: Record<CoreStatus['state'], { dot: string; text: string; bg: string; border: string }> = {
  unknown: { dot: '#94a3b8', text: 'var(--text-muted)', bg: 'var(--bg-surface)', border: 'var(--border)' },
  online: { dot: '#22c55e', text: '#16a34a', bg: 'rgba(34,197,94,0.10)', border: 'rgba(34,197,94,0.35)' },
  offline: { dot: '#f59e0b', text: '#d97706', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.35)' },
};

export const CoreStatusBadge: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [status, setStatus] = useState<CoreStatus>(getCoreStatus);

  useEffect(() => {
    const unsubscribe = subscribeCoreStatus(setStatus);
    void probeCore();
    return unsubscribe;
  }, []);

  const colors = COLORS[status.state];
  const label =
    status.state === 'online'
      ? compact
        ? 'Core'
        : 'Core: подключён'
      : status.state === 'offline'
        ? compact
          ? 'Локально'
          : 'Core: локальный режим'
        : compact
          ? 'Core…'
          : 'Core: проверка';

  return (
    <button
      type="button"
      onClick={() => void probeCore()}
      title={`${status.url}\n${status.detail}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: compact ? '2px 7px' : '3px 9px',
        borderRadius: 999,
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.bg,
        color: colors.text,
        fontSize: compact ? 10 : 11,
        fontWeight: 600,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          backgroundColor: colors.dot,
          boxShadow: status.state === 'online' ? `0 0 0 3px ${colors.bg}` : undefined,
        }}
      />
      {label}
    </button>
  );
};
