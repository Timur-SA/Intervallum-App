/**
 * Web Animations API helpers with prefers-reduced-motion support
 */

export const isReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const animateElement = (
  element: HTMLElement | SVGElement | null,
  keyframes: Keyframe[] | PropertyIndexedKeyframes,
  options: KeyframeAnimationOptions = {}
): Animation | null => {
  if (!element || isReducedMotion() || typeof element.animate !== 'function') {
    return null;
  }
  try {
    element.getAnimations?.().forEach(a => a.cancel());
    const anim = element.animate(keyframes, {
      duration: 260,
      easing: 'cubic-bezier(.2,.8,.2,1)',
      fill: 'both',
      ...options,
    });
    anim.finished.catch(() => {});
    return anim;
  } catch {
    return null;
  }
};

/**
 * Spring-like pop feedback for newly placed or selected items
 */
export const springPop = (element: HTMLElement | SVGElement | null, scale = 1.08) => {
  return animateElement(
    element,
    [
      { transform: 'scale(0.92)', opacity: 0.8 },
      { transform: `scale(${scale})`, opacity: 1, offset: 0.65 },
      { transform: 'scale(1)', opacity: 1 },
    ],
    { duration: 250 }
  );
};

/**
 * Shake effect for invalid placement or incorrect formula step
 */
export const shakeError = (element: HTMLElement | SVGElement | null) => {
  return animateElement(
    element,
    [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-7px)', offset: 0.2 },
      { transform: 'translateX(7px)', offset: 0.4 },
      { transform: 'translateX(-5px)', offset: 0.6 },
      { transform: 'translateX(5px)', offset: 0.8 },
      { transform: 'translateX(0)' },
    ],
    { duration: 340, easing: 'ease-in-out' }
  );
};

/**
 * Subtle pulse for highlighting a key action
 */
export const pulseHighlight = (element: HTMLElement | SVGElement | null) => {
  return animateElement(
    element,
    [
      { transform: 'scale(1)' },
      { transform: 'scale(1.05)', offset: 0.5 },
      { transform: 'scale(1)' },
    ],
    { duration: 320, easing: 'ease-out' }
  );
};
