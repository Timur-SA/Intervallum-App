import React, { useEffect, useRef } from 'react';
import { isReducedMotion } from '../motion/webAnimations';

interface CelebrationSparksProps {
  active: boolean;
  onDone?: () => void;
}

export const CelebrationSparks: React.FC<CelebrationSparksProps> = ({ active, onDone }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !containerRef.current || isReducedMotion()) {
      if (active && onDone) onDone();
      return;
    }

    const sparks = containerRef.current.querySelectorAll('.fl-spark');
    const total = sparks.length;
    let completed = 0;

    sparks.forEach((el, i) => {
      const spark = el as HTMLElement;
      const theta = (i / total) * Math.PI * 2;
      const dx = Math.cos(theta) * 76;
      const dy = Math.sin(theta) * 58;

      const animation = spark.animate(
        [
          { transform: 'translate(0, 0) scale(0.3)', opacity: 0 },
          {
            transform: `translate(${dx * 0.45}px, ${dy * 0.45}px) rotate(${i * 42}deg) scale(1.1)`,
            opacity: 1,
            offset: 0.25,
          },
          {
            transform: `translate(${dx}px, ${dy + 20}px) rotate(${i * 85}deg) scale(0.4)`,
            opacity: 0,
          },
        ],
        {
          duration: 680,
          delay: i * 15,
          easing: 'cubic-bezier(.2,.8,.2,1)',
          fill: 'forwards',
        }
      );

      animation.finished.then(() => {
        completed++;
        if (completed === total && onDone) {
          onDone();
        }
      }).catch(() => {});
    });
  }, [active, onDone]);

  if (!active) return null;

  return (
    <div
      ref={containerRef}
      className="fl-celebration"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 50,
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      {[...Array(10)].map((_, i) => (
        <span
          key={i}
          className="fl-spark"
          style={{
            position: 'absolute',
            left: '50%',
            top: '45%',
            width: 7,
            height: 12,
            borderRadius: 3,
            backgroundColor:
              i % 3 === 0
                ? 'var(--max-color-accent, #3b82f6)'
                : i % 3 === 1
                ? 'var(--max-color-green, #10b981)'
                : 'var(--max-color-yellow, #f59e0b)',
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
};
