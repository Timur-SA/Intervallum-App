import React from 'react';
import { Button } from '@maxhub/max-ui';
import { Lock, Star, Swords, Trophy } from 'lucide-react';
import { PracticeProgress } from '../../../shared/storage/progressStore';
import { SECTIONS } from '../domain/sections';
import { SectionId } from '../domain/types';
import {
  BOSS_STARS_REQUIRED,
  isBossReady,
  isSectionDefeated,
  isSectionUnlocked,
  sectionStars,
} from '../domain/progression';
import { haptics } from '../../../shared/motion/haptics';

interface BossesScreenProps {
  progress: PracticeProgress;
  onStartBoss: (sectionId: SectionId) => void;
}

export const BossesScreen: React.FC<BossesScreenProps> = ({ progress, onStartBoss }) => (
  <div className="mg-screen">
    <div className="mg-scroll">
      <header className="mg-screen__head">
        <div>
          <h1 className="mg-screen__title">Боссы</h1>
          <p className="mg-screen__subtitle">
            Дуэль на время: {BOSS_STARS_REQUIRED} звёзд раздела открывают бой.
          </p>
        </div>
      </header>

      <div className="mg-list">
        {SECTIONS.map(section => {
          const unlocked = isSectionUnlocked(progress, section.id);
          const defeated = isSectionDefeated(progress, section.id);
          const ready = isBossReady(progress, section.id);
          const stars = sectionStars(progress, section.id);

          return (
            <div key={section.id} className="mg-boss-row">
              <div className="mg-boss-card__head">
                <span
                  className="mg-boss-card__avatar"
                  style={{ backgroundColor: section.color }}
                  aria-hidden
                >
                  {defeated ? <Trophy size={22} /> : <Swords size={22} />}
                </span>

                <div className="mg-boss-card__info">
                  <div className="mg-boss-card__name">{section.boss}</div>
                  <div className="mg-boss-card__item">
                    {section.title} · {section.item}
                  </div>
                </div>

                <span className="mg-boss-card__stars">
                  <Star size={13} fill="#f59e0b" />
                  {stars} / {BOSS_STARS_REQUIRED}
                </span>
              </div>

              <div className="mg-xpbar">
                <span
                  className="mg-xpbar__fill"
                  style={{
                    width: `${Math.min(100, (stars / BOSS_STARS_REQUIRED) * 100)}%`,
                    backgroundColor: defeated ? 'var(--success)' : section.color,
                  }}
                />
              </div>

              <Button
                variant={ready ? 'primary' : 'secondary'}
                size="medium"
                stretched
                disabled={!ready}
                onClick={() => {
                  haptics.impact('heavy');
                  onStartBoss(section.id);
                }}
              >
                {defeated
                  ? 'Побеждён'
                  : !unlocked
                    ? 'Раздел закрыт'
                    : ready
                      ? 'Начать дуэль'
                      : `Нужно ещё ${Math.max(0, BOSS_STARS_REQUIRED - stars)} ★`}
              </Button>
            </div>
          );
        })}
      </div>

      <p className="mg-note">
        Звёзды начисляются в Тренировке за верно решённые новые и сложные задачи.
        Дуэль: 10 задач, 6 минут, победа при 8 верных.
      </p>
    </div>
  </div>
);
