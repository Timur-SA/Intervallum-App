import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  AppSettings,
  loadUserProgress,
  updateAppSettings,
} from '../shared/storage/progressStore';
import { setHapticsEnabled } from '../shared/motion/haptics';

type ResolvedTheme = 'light' | 'dark';

interface AppSettingsContextValue {
  settings: AppSettings;
  theme: ResolvedTheme;
  setTheme: (theme: ResolvedTheme) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setVibrationEnabled: (enabled: boolean) => void;
}

const SettingsContext = createContext<AppSettingsContextValue | null>(null);

const resolveSystemTheme = (): ResolvedTheme => {
  if (typeof window === 'undefined') return 'dark';

  const webAppTheme = (window as unknown as { WebApp?: { colorScheme?: string } })
    .WebApp?.colorScheme;
  if (webAppTheme === 'light' || webAppTheme === 'dark') return webAppTheme;

  if (window.matchMedia?.('(prefers-color-scheme: light)').matches) return 'light';
  return 'dark';
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<AppSettings>(() => loadUserProgress().settings);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(resolveSystemTheme);

  const theme: ResolvedTheme =
    settings.theme === 'auto' ? systemTheme : settings.theme;

  useEffect(() => {
    setHapticsEnabled(settings.haptics);
  }, [settings.haptics]);

  useEffect(() => {
    const webApp = (window as unknown as { WebApp?: { colorScheme?: string } }).WebApp;
    if (webApp?.colorScheme === 'light' || webApp?.colorScheme === 'dark') {
      setSystemTheme(webApp.colorScheme);
    }

    const onProgress = () => setSettings(loadUserProgress().settings);
    window.addEventListener('intervallum:progress-changed', onProgress);
    return () => window.removeEventListener('intervallum:progress-changed', onProgress);
  }, []);

  const patchSettings = useCallback((patch: Partial<AppSettings>) => {
    const next = updateAppSettings(patch);
    setSettings(next);
    if (patch.haptics !== undefined) setHapticsEnabled(patch.haptics);
  }, []);

  const setTheme = useCallback(
    (nextTheme: ResolvedTheme) => patchSettings({ theme: nextTheme }),
    [patchSettings],
  );

  const setSoundEnabled = useCallback(
    (enabled: boolean) => patchSettings({ sound: enabled }),
    [patchSettings],
  );

  const setVibrationEnabled = useCallback(
    (enabled: boolean) => patchSettings({ haptics: enabled }),
    [patchSettings],
  );

  const value = useMemo(
    () => ({
      settings,
      theme,
      setTheme,
      setSoundEnabled,
      setVibrationEnabled,
    }),
    [settings, theme, setTheme, setSoundEnabled, setVibrationEnabled],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useAppSettings = (): AppSettingsContextValue => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within SettingsProvider');
  }
  return context;
};
