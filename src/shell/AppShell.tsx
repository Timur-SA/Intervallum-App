import React, { useState, useEffect } from 'react';
import { MaxUI } from '@maxhub/max-ui';
import '@maxhub/max-ui/dist/styles.css';
import '../modules/formula-trainer/styles/index.css';
import '../shared/styles/themeTokens.css';

import { MapModule } from '../modules/mini-games/MapModule';
import { NavigationProvider, useNavigation } from './HeaderContext';
import { SandboxMessengerHeader } from './SandboxMessengerHeader';
import { DevPanel } from './DevPanel';
import { CoreStatusBadge } from './CoreStatusBadge';

export type AppMode = 'map';

/**
 * Synchronizes Telegram / MAX client native BackButton with the active Navigation state
 */
const NativeBackButtonSync: React.FC = () => {
  const { navigationConfig } = useNavigation();

  useEffect(() => {
    const webApp = typeof window !== 'undefined' ? (window as any).WebApp : null;
    if (!webApp?.BackButton) return;

    if (navigationConfig.canGoBack && navigationConfig.onBack) {
      webApp.BackButton.show();
      const handler = navigationConfig.onBack;
      webApp.BackButton.onClick(handler);
      return () => {
        webApp.BackButton.offClick(handler);
      };
    } else {
      webApp.BackButton.hide();
    }
  }, [navigationConfig.canGoBack, navigationConfig.onBack]);

  return null;
};

/**
 * Emulated Messenger top bar inside the desktop testing sandbox
 */
const SandboxMessengerBarContainer: React.FC<{ platform: 'ios' | 'android' }> = ({ platform }) => {
  const { navigationConfig } = useNavigation();

  return (
    <SandboxMessengerHeader
      canGoBack={navigationConfig.canGoBack}
      onBack={navigationConfig.onBack}
      platform={platform}
    />
  );
};

export const AppShell: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<AppMode>('map');
  const [platform, setPlatform] = useState<'ios' | 'android'>('ios');
  const [colorScheme, setColorScheme] = useState<'dark' | 'light'>('dark');

  const isInsideMax =
    typeof window !== 'undefined' && Boolean((window as any).WebApp?.platform);

  // Sync platform & colorScheme with WebApp environment
  useEffect(() => {
    const webApp = typeof window !== 'undefined' ? (window as any).WebApp : null;
    if (!webApp) return;

    if (webApp.platform === 'ios' || webApp.platform === 'android') {
      setPlatform(webApp.platform);
    }
    if (webApp.colorScheme) {
      setColorScheme(webApp.colorScheme);
    }
  }, []);

  const handleBackToHub = () => {
    setCurrentMode('map');
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
        backgroundColor: colorScheme === 'dark' ? '#07090b' : '#e2e8f0',
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
            backgroundColor: 'var(--bg-card)',
            borderBottom: '1px solid var(--border)',
            fontSize: 13,
            flexShrink: 0,
            zIndex: 50,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
            <span>⚡ Intervallum App Shell</span>
            <span
              style={{
                fontSize: 10,
                padding: '2px 6px',
                borderRadius: 6,
                backgroundColor: 'var(--accent-bg)',
                color: 'var(--accent)',
              }}
            >
              MAX UI 0.9
            </span>
            <CoreStatusBadge />
          </div>

          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>OS:</span>
              <button
                type="button"
                onClick={() => setPlatform('ios')}
                style={{
                  padding: '3px 8px',
                  borderRadius: 6,
                  border: 0,
                  fontSize: 12,
                  backgroundColor: platform === 'ios' ? 'var(--accent)' : 'transparent',
                  color: platform === 'ios' ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
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
                  backgroundColor: platform === 'android' ? 'var(--accent)' : 'transparent',
                  color: platform === 'android' ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
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
                  border: '1px solid var(--border)',
                  backgroundColor: 'transparent',
                  fontSize: 12,
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                }}
              >
                {colorScheme === 'dark' ? '🌙 Тёмная' : '☀️ Светлая'}
              </button>
            </div>
          </div>
        </header>
      )}

      {!isInsideMax && <DevPanel />}

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
            backgroundColor: 'var(--bg-app)',
            borderRadius: isInsideMax ? 0 : 28,
            boxShadow: isInsideMax ? 'none' : '0 16px 48px rgba(0,0,0,0.3)',
            border: isInsideMax ? 'none' : '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
            // Делает корпус содержащим блоком для position: fixed,
            // чтобы шторки MAX UI не выходили за пределы «телефона» в песочнице
            transform: 'translateZ(0)',
          }}
        >
          <MaxUI platform={platform} colorScheme={colorScheme} resetBody={false}>
            <NavigationProvider>
              <NativeBackButtonSync />

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {/* Fixed Sandbox Host Chrome (Status bar + Messenger Navigation Header) */}
                {!isInsideMax && (
                  <>
                    <div
                      style={{
                        height: 26,
                        padding: '0 18px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 11,
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        backgroundColor: 'var(--bg-card)',
                        flexShrink: 0,
                      }}
                    >
                      <span>9:41</span>
                      <div
                        style={{
                          width: 44,
                          height: 4,
                          borderRadius: 2,
                          backgroundColor: 'var(--border-strong)',
                        }}
                      />
                      <span>100% 🔋</span>
                    </div>

                    {/* Emulated Messenger Header ("Шторка мессенджера") */}
                    <SandboxMessengerBarContainer platform={platform} />
                  </>
                )}

                {/* Actual Mini App Viewport */}
                <div
                  style={{
                    flex: 1,
                    minHeight: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {currentMode === 'map' && (
                    <MapModule />
                  )}
                </div>
              </div>
            </NavigationProvider>
          </MaxUI>
        </div>
      </div>
    </div>
  );
};
