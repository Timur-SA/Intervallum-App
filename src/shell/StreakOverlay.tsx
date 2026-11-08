import React, { useEffect, useState } from 'react';
import { Button } from '@maxhub/max-ui';
import { Flame, Sparkles } from 'lucide-react';
import { StreakFlame } from '../shared/components/StreakFlame';
import './StreakOverlay.css';

export type StreakNotice =
  | { type: 'update'; days: number }
  | { type: 'break'; lostDays: number };

interface StreakOverlayProps {
  notice: StreakNotice;
  onContinue: () => void;
}

const daysAfterBreak = (count: number): string => {
  const abs = Math.abs(count) % 100;
  const last = abs % 10;
  return last === 1 && abs !== 11 ? 'дня' : 'дней';
};

export const StreakOverlay: React.FC<StreakOverlayProps> = ({ notice, onContinue }) => {
  const [phase, setPhase] = useState<'white' | 'flash' | 'final' | 'break'>(
    notice.type === 'break' ? 'break' : 'white',
  );

  useEffect(() => {
    setPhase(notice.type === 'break' ? 'break' : 'white');
    if (notice.type === 'break') return;

    const flash = window.setTimeout(() => setPhase('flash'), 430);
    const final = window.setTimeout(() => setPhase('final'), 620);

    return () => {
      window.clearTimeout(flash);
      window.clearTimeout(final);
    };
  }, [notice.type, notice.type === 'update' ? notice.days : 0]);

  const isBreak = notice.type === 'break';

  return (
    <div className={`streak-overlay ${isBreak ? 'streak-overlay--break' : ''}`} role="dialog" aria-modal="true">
      <div className="streak-overlay__backdrop" />
      <div className="streak-overlay__panel">
        {isBreak ? (
          <div className="streak-overlay__flame-wrap is-break">
            <div className="streak-overlay__ghost-flame">
              <StreakFlame days={notice.lostDays} size={118} animate={false} />
            </div>
            <div className="streak-overlay__flame is-extinguished">
              <StreakFlame days={notice.lostDays} size={118} animate={false} />
            </div>
            <span className="streak-overlay__ash" aria-hidden />
          </div>
        ) : (
          <div className={`streak-overlay__flame-wrap is-${phase}`}>
            <div className="streak-overlay__white-flame">
              <StreakFlame
                days={notice.type === 'update' ? notice.days : 0}
                size={phase === 'white' ? 128 : 118}
                animate={false}
              />
            </div>
            <div className="streak-overlay__final-flame">
              <StreakFlame
                days={notice.type === 'update' ? notice.days : 0}
                size={118}
                animate={phase === 'final'}
              />
            </div>
            <span className="streak-overlay__flash" aria-hidden />
          </div>
        )}

        {isBreak ? (
          <>
            <span className="streak-overlay__eyebrow">
              <Flame size={14} />
              Daily Streak
            </span>
            <h2>К сожалению, ваша серия прервана :(</h2>
            <p>
              {notice.lostDays > 0
                ? `Серия из ${notice.lostDays} ${daysAfterBreak(notice.lostDays)} закончилась.`
                : 'Не переживай — начни новую серию сегодня.'}{' '}
              Каждое новое задание снова зажжёт огонёк.
            </p>
            <Button variant="primary" size="large" stretched onClick={onContinue}>
              Продолжить
            </Button>
          </>
        ) : (
          <>
            <span className="streak-overlay__eyebrow">
              <Sparkles size={14} />
              Серия обновлена
            </span>
            <h2>дней подряд</h2>
            <p>
              Продолжай в том же духе — огонёк становится ярче с каждым днём.
            </p>
            <Button variant="primary" size="large" stretched onClick={onContinue}>
              Продолжить
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
