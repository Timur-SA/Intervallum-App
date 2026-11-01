import React, { useState, useEffect } from 'react';
import { MaxUI } from '@maxhub/max-ui';
import '@maxhub/max-ui/dist/styles.css';
import '../shared/styles/themeTokens.css';

import { MainHub } from './MainHub';
import { ForceLabModule } from '../modules/force-lab/ForceLabModule';
import { FormulaTrainerModule } from '../modules/formula-trainer/FormulaTrainerModule';
import { loadUserProgress, UserProgressData } from '../shared/storage/progressStore';

export type AppMode = 'hub' | 'force-lab' | 'formula-trainer';

export const AppShell: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<AppMode>('hub');
  const [platform, setPlatform] = useState<'ios' | 'android'>('ios');
  const [colorScheme, setColorScheme] = useState<'dark' | 'light'>('dark');
  const [progress, setProgress] = useState<UserProgressData>(loadUserProgress());

  const isInsideMax =
    typeof window !== 'undefined' && Boolean((window as any).WebApp?.platform);

  // Sync platform & handle BackButton
  useEffect(() => {
    const webApp = typeof window !== 'undefined' ? (window as any).WebApp : null;
    if (!webApp) return;

    if (webApp.platform === 'ios' || webApp.platform === 'android') {
      setPlatform(webApp.platform);
    }
    if (webApp.colorScheme) {
      setColorScheme(webApp.colorScheme);
    }

    if (webApp.BackButton) {
      if (currentMode !== 'hub') {
        webApp.BackButton.show();
        const handleBack = () => {
          setCurrentMode('hub');
          setProgress(loadUserProgress());
        };
        webApp.BackButton.onClick(handleBack);
        return () => {
          webApp.BackButton.offClick(handleBack);
        };
      } else {
        webApp.BackButton.hide();
      }
    }
  }, [currentMode]);

  const handleSelectMode = (mode: 'force-lab' | 'formula-trainer') => {
    setCurrentMode(mode);
  };

  const handleBackToHub = () => {
    setCurrentMode('hub');
    setProgress(loadUserProgress());
  };

  return (
    <div
      className={`desktop-tester-root theme-${colorScheme} ${isInsideMax ? 'is-max-client' : ''}`}
      data-theme={colorScheme}
      style={{
        width: '100vw',
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: colorScheme === 'dark' ? '#0b0f12' : '#e5e7eb',
      }}
    >
      {/* Desktop Tester Controls (hidden in mobile / MAX client) */}
      {!isInsideMax && (
        <header
          style={{
            height: 44,
            padding: '0 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: colorScheme === 'dark' ? '#141a1f' : '#ffffff',
            borderBottom: '1px solid var(--app-border)',
            fontSize: 13,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
            <span>⚡ Intervallum App Shell</span>
            <span
              style={{
                fontSize: 10,
                padding: '2px 6px',
                borderRadius: 6,
                backgroundColor: 'rgba(2, 132, 199, 0.15)',
                color: '#0284c7',
              }}
            >
              MAX UI 0.9
            </span>
          </div>

          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--app-subtext)' }}>OS:</span>
              <button
                type="button"
                onClick={() => setPlatform('ios')}
                style={{
                  padding: '3px 8px',
                  borderRadius: 6,
                  border: 0,
                  fontSize: 12,
                  backgroundColor: platform === 'ios' ? 'var(--app-accent)' : 'transparent',
                  color: platform === 'ios' ? '#fff' : 'inherit',
                }}
              >
                iOS
              </button>
              <button
                type="button"
                onClick={() => setPlatform('android')}
                style={{
                  padding: '3px 8px',
                  borderRadius: 6,
                  border: 0,
                  fontSize: 12,
                  backgroundColor: platform === 'android' ? 'var(--app-accent)' : 'transparent',
                  color: platform === 'android' ? '#fff' : 'inherit',
                }}
              >
                Android
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                type="button"
                onClick={() => setColorScheme(c => (c === 'dark' ? 'light' : 'dark'))}
                style={{
                  padding: '3px 8px',
                  borderRadius: 6,
                  border: '1px solid var(--app-border)',
                  backgroundColor: 'transparent',
                  fontSize: 12,
                  color: 'inherit',
                }}
              >
                {colorScheme === 'dark' ? '🌙 Тёмная' : '☀️ Светлая'}
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Mobile Stage Frame */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          padding: isInsideMax ? 0 : '12px 0 20px',
        }}
      >
        <div
          className={`phone-chassis platform-${platform} theme-${colorScheme}`}
          style={{
            width: 'min(440px, 100%)',
            height: '100%',
            maxHeight: isInsideMax ? '100%' : '880px',
            backgroundColor: 'var(--fl-paper)',
            borderRadius: isInsideMax ? 0 : 28,
            boxShadow: isInsideMax ? 'none' : '0 16px 48px rgba(0,0,0,0.25)',
            border: isInsideMax ? 'none' : '1px solid var(--fl-line)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <MaxUI platform={platform} colorScheme={colorScheme} resetBody={false}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* Phone Status Bar (Emulated for non-Telegram browser) */}
              {!isInsideMax && (
                <div
                  style={{
                    height: 28,
                    padding: '0 18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--fl-ink)',
                    flexShrink: 0,
                  }}
                >
                  <span>9:41</span>
                  <div
                    style={{
                      width: 50,
                      height: 5,
                      borderRadius: 3,
                      backgroundColor: 'var(--fl-line)',
                    }}
                  />
                  <span>100% 🔋</span>
                </div>
              )}

              {/* View Router */}
              <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                {currentMode === 'hub' && (
                  <MainHub progress={progress} onSelectMode={handleSelectMode} />
                )}

                {currentMode === 'force-lab' && (
                  <ForceLabModule onBackToHub={handleBackToHub} />
                )}

                {currentMode === 'formula-trainer' && (
                  <FormulaTrainerModule onBackToHub={handleBackToHub} />
                )}
              </div>
            </div>
          </MaxUI>
        </div>
      </div>
    </div>
  );
};
