import React from 'react';
import { Button, CellSimple } from '@maxhub/max-ui';
import { ChevronRight, Lock, Star, Swords, Trophy } from 'lucide-react';
import { PracticeProgress } from '../../../shared/storage/progressStore';
import { getSection, getTopic } from '../domain/sections';
import { SectionId, TopicId } from '../domain/types';
import {
  BOSS_STARS_REQUIRED,
  isBossReady,
  isSectionDefeated,
  isTopicUnlocked,
  sectionStars,
  TOPIC_XP_THRESHOLD,
} from '../domain/progression';
import { haptics } from '../../../shared/motion/haptics';

interface SectionScreenProps {
  sectionId: SectionId;
  progress: PracticeProgress;
  onOpenTopic: (topicId: TopicId) => void;
  onStartBoss: () => void;
}

export const SectionScreen: React.FC<SectionScreenProps> = ({
  sectionId,
  progress,
  onOpenTopic,
  onStartBoss,
}) => {
  const section = getSection(sectionId);
  if (!section) return null;

  const stars = sectionStars(progress, sectionId);
  const defeated = isSectionDefeated(progress, sectionId);
  const ready = isBossReady(progress, sectionId);
  const progressPercent = Math.min(100, (stars / BOSS_STARS_REQUIRED) * 100);

  return (
    <div className="mg-screen">
      <div className="mg-scroll">
        <header className="mg-screen__head">
          <div>
            <h1 className="mg-screen__title">{section.title}</h1>
            <p className="mg-screen__subtitle">
              {section.topics.length} тем · босс {section.boss}
            </p>
          </div>
          <span className="mg-xp">
            <Star size={13} fill="#f59e0b" />
            <span className="mg-xp__value">{stars}</span>
          </span>
        </header>

        <div className={`mg-boss-card ${defeated ? 'mg-boss-card--defeated' : ''}`}>
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
                {defeated ? `Предмет получен: ${section.item}` : `Награда: ${section.item}`}
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
                width: `${defeated ? 100 : progressPercent}%`,
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
              onStartBoss();
            }}
          >
            {defeated
              ? 'Босс побеждён'
              : ready
                ? 'Начать дуэль'
                : `Нужно ещё ${Math.max(0, BOSS_STARS_REQUIRED - stars)} ★`}
          </Button>
        </div>

        <div className="mg-list">
          {section.topics.map((topicId, index) => {
            const unlocked = isTopicUnlocked(progress, sectionId, topicId);
            const xp = progress.xpByTopic[topicId] ?? 0;
            const title = getTopic(topicId)?.title ?? '';

            return (
              <CellSimple
                key={topicId}
                as="button"
                className="mg-row"
                height="compact"
                disabled={!unlocked}
                onClick={() => {
                  haptics.selection();
                  onOpenTopic(topicId);
                }}
                overline={`Тема ${index + 1}`}
                title={title}
                subtitle={
                  <span className="mg-topic-progress">
                    <span className="mg-topic-progress__bar">
                      <span
                        className="mg-topic-progress__fill"
                        style={{
                          width: `${Math.min(100, (xp / TOPIC_XP_THRESHOLD) * 100)}%`,
                          backgroundColor: unlocked ? section.color : 'var(--text-muted)',
                        }}
                      />
                    </span>
                    <span className="mg-topic-progress__value">
                      {Math.min(xp, TOPIC_XP_THRESHOLD)} / {TOPIC_XP_THRESHOLD}
                    </span>
                  </span>
                }
                before={
                  <span
                    className="mg-row__icon mg-row__icon--small"
                    style={{ backgroundColor: unlocked ? section.color : '#475569' }}
                    aria-hidden
                  >
                    {unlocked ? index + 1 : <Lock size={16} />}
                  </span>
                }
                after={
                  unlocked ? (
                    <ChevronRight size={18} color="var(--text-muted)" />
                  ) : (
                    <span className="mg-row__badge">Закрыто</span>
                  )
                }
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
