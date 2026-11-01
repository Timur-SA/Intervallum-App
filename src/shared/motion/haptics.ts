/**
 * Tactile / Haptic feedback bridge for MAX WebApp & Telegram Mini Apps
 */

export const haptics = {
  impact: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'light') => {
    try {
      const haptic = (window as any)?.WebApp?.HapticFeedback;
      if (haptic && typeof haptic.impactOccurred === 'function') {
        haptic.impactOccurred(style);
        return;
      }
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(style === 'heavy' ? 25 : style === 'medium' ? 15 : 8);
      }
    } catch {
      // Ignore vibration errors on unsupported environments
    }
  },

  notification: (type: 'error' | 'success' | 'warning' = 'success') => {
    try {
      const haptic = (window as any)?.WebApp?.HapticFeedback;
      if (haptic && typeof haptic.notificationOccurred === 'function') {
        haptic.notificationOccurred(type);
        return;
      }
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        if (type === 'success') navigator.vibrate([10, 30, 20]);
        else if (type === 'error') navigator.vibrate([20, 40, 20, 40]);
        else navigator.vibrate(15);
      }
    } catch {
      // Ignore
    }
  },

  selection: () => {
    try {
      const haptic = (window as any)?.WebApp?.HapticFeedback;
      if (haptic && typeof haptic.selectionChanged === 'function') {
        haptic.selectionChanged();
        return;
      }
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(5);
      }
    } catch {
      // Ignore
    }
  }
};
