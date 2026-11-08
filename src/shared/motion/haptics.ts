/**
 * Tactile / Haptic feedback bridge for MAX WebApp & Telegram Mini Apps
 *
 * Методы MAX Bridge возвращают Promise и отклоняются на платформах без
 * поддержки вибрации (desktop/web). Поэтому результат нужно «погасить»,
 * иначе в консоли появляются unhandled rejection.
 */

type HapticCall = () => unknown;

let hapticsEnabled = true;

/** Глобальный выключатель вибрации/хаптики. */
export const setHapticsEnabled = (enabled: boolean): void => {
  hapticsEnabled = enabled;
};

export const isHapticsEnabled = (): boolean => hapticsEnabled;

const invokeSafely = (call: HapticCall): boolean => {
  try {
    const result = call();
    if (result && typeof (result as Promise<unknown>).catch === 'function') {
      (result as Promise<unknown>).catch(() => undefined);
    }
    return true;
  } catch {
    return false;
  }
};

const vibrate = (pattern: number | number[]) => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration errors on unsupported environments
    }
  }
};

export const haptics = {
  impact: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'light') => {
    if (!hapticsEnabled) return;
    const haptic = (window as unknown as { WebApp?: { HapticFeedback?: {
      impactOccurred?: (value: string) => unknown;
    } } })?.WebApp?.HapticFeedback;

    if (haptic && typeof haptic.impactOccurred === 'function') {
      const handled = invokeSafely(() => haptic.impactOccurred!(style));
      if (handled) return;
    }

    vibrate(style === 'heavy' ? 25 : style === 'medium' ? 15 : 8);
  },

  notification: (type: 'error' | 'success' | 'warning' = 'success') => {
    if (!hapticsEnabled) return;
    const haptic = (window as unknown as { WebApp?: { HapticFeedback?: {
      notificationOccurred?: (value: string) => unknown;
    } } })?.WebApp?.HapticFeedback;

    if (haptic && typeof haptic.notificationOccurred === 'function') {
      const handled = invokeSafely(() => haptic.notificationOccurred!(type));
      if (handled) return;
    }

    if (type === 'success') vibrate([10, 30, 20]);
    else if (type === 'error') vibrate([20, 40, 20, 40]);
    else vibrate(15);
  },

  selection: () => {
    if (!hapticsEnabled) return;
    const haptic = (window as unknown as { WebApp?: { HapticFeedback?: {
      selectionChanged?: () => unknown;
    } } })?.WebApp?.HapticFeedback;

    if (haptic && typeof haptic.selectionChanged === 'function') {
      const handled = invokeSafely(() => haptic.selectionChanged!());
      if (handled) return;
    }

    vibrate(5);
  },
};
