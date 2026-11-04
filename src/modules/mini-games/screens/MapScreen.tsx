import React from 'react';
import { ChevronDown, Lock, Sparkles, Star, Swords, Trophy } from 'lucide-react';
import {
  PracticeProgress,
  totalXp,
} from '../../../shared/storage/progressStore';
import { SECTIONS, getTopic } from '../domain/sections';
import { SectionId, TopicId } from '../domain/types';
import {
  bossXpRequired,
  isBossReady,
  isSectionDefeated,
  isSectionUnlocked,
  isTopicComplete,
  isTopicUnlocked,
  sectionXp,
  topicMaxXp,
} from '../domain/progression';
import { haptics } from '../../../shared/motion/haptics';

interface MapScreenProps {
  progress: PracticeProgress;
  onOpenTopic: (sectionId: SectionId, topicId: TopicId) => void;
  onStartBoss: (sectionId: SectionId) => void;
  onOpenForces: () => void;
  onOpenFormulas: () => void;
  onResetProgress: () => void;
  isSandbox: boolean;
}

const LevelRing: React.FC<{ value: number; max: number; complete: boolean }> = ({
  value,
  max,
  complete,
}) => {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const ratio = max > 0 ? Math.min(1, value / max) : 0;

  return (
    <svg className="mg-level__ring" viewBox="0 0 56 56" aria-hidden>
      <circle className="mg-level__track" cx="28" cy="28" r={radius} />
      <circle
        className="mg-level__fill"
        cx="28"
        cy="28"
        r={radius}
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - ratio)}
        transform="rotate(-90 28 28)"
        style={{ stroke: complete ? 'var(--success)' : 'var(--accent)' }}
      />
    </svg>
  );
};

export const MapScreen: React.FC<MapScreenProps> = ({
  progress,
  onOpenTopic,
  onStartBoss,
  onOpenForces,
  onOpenFormulas,
  onResetProgress,
  isSandbox,
}) => {
  const currentSectionId =
    SECTIONS.find(
      section => isSectionUnlocked(progress, section.id) && !isSectionDefeated(progress, section.id),
    )?.id ?? SECTIONS[SECTIONS.length - 1].id;

  return (
    <div className="mg-screen">
      <div className="mg-scroll">
        <header className="mg-screen__head">
          <div>
            <h1 className="mg-screen__title">Подготовка · ОГЭ</h1>
            <p className="mg-screen__subtitle">Карта тем: проходите уровни и добирайте опыт</p>
          </div>
          <span className="mg-xp">
            <Sparkles size={13} />
            <span className="mg-xp__value">{totalXp(progress)} XP</span>
          </span>
        </header>

        {SECTIONS.map(section => {
          const unlocked = isSectionUnlocked(progress, section.id);
          const defeated = isSectionDefeated(progress, section.id);
          const isCurrent = section.id === currentSectionId;
          const collapsed = defeated;

          if (collapsed && !isCurrent) {
            return (
              <div key={section.id} className="mg-map__section mg-map__section--collapsed">
                <div className="mg-map__section-head">
                  <span className="mg-map__section-icon" style={{ backgroundColor: section.color }}>
                    <Trophy size={16} />
                  </span>
                  <span className="mg-map__section-title">{section.title}</span>
                  <span className="mg-map__section-xp">{sectionXp(progress, section.id)} XP</span>
                  <ChevronDown size={16} color="var(--text-muted)" />
                </div>
              </div>
            );
          }

          const topics = section.topics.map(topicId => {
            const topic = getTopic(topicId);
            const xp = progress.xpByTopic[topicId] ?? 0;
            const max = topicMaxXp(topicId);
            return {
              topicId,
              title: topic?.title ?? '',
              xp,
              max,
              unlocked: isTopicUnlocked(progress, section.id, topicId),
              complete: isTopicComplete(progress, topicId),
              ready: xp >= bossXpRequired(topicId),
            };
          });

          const bossReady = isBossReady(progress, section.id);
          const allReady = topics.every(topic => topic.ready);

          return (
            <div key={section.id} className="mg-map__section">
              <div className="mg-map__section-head">
                <span className="mg-map__section-icon" style={{ backgroundColor: section.color }}>
                  {defeated ? <Trophy size={16} /> : <Star size={16} />}
                </span>
                <span className="mg-map__section-title">{section.title}</span>
                <span className="mg-map__section-xp">{sectionXp(progress, section.id)} XP</span>
                {!unlocked && <Lock size={14} color="var(--text-muted)" />}
              </div>

              <div className="mg-map__path">
                {topics.map((topic, index) => (
                  <div key={topic.topicId} className="mg-level-row">
                    <div className="mg-level-row__rail">
                      {index > 0 && <span className="mg-level-row__line" />}
                      <button
                        type="button"
                        className={`mg-level ${topic.complete ? 'mg-level--complete' : ''} ${
                          topic.ready && !topic.complete ? 'mg-level--ready' : ''
                        } ${!topic.unlocked ? 'mg-level--locked' : ''}`}
                        disabled={!topic.unlocked}
                        onClick={() => {
                          haptics.impact('medium');
                          onOpenTopic(section.id, topic.topicId);
                        }}
                        aria-label={topic.title}
                      >
                        <LevelRing value={topic.xp} max={topic.max} complete={topic.complete} />
                        <span className="mg-level__inner">
                          {topic.unlocked ? (
                            topic.complete ? (
                              <Trophy size={16} />
                            ) : (
                              index + 1
                            )
                          ) : (
                            <Lock size={14} />
                          )}
                        </span>
                      </button>
                    </div>

                    <div className="mg-level-row__info">
                      <span className="mg-level-row__title">{topic.title}</span>
                      <span className="mg-level-row__state">
                        {topic.complete
                          ? 'Пройден'
                          : topic.ready
                            ? 'Готов к боссу'
                            : `${topic.xp} / ${topic.max} XP`}
                      </span>
                    </div>
                  </div>
                ))}

                {section.id === 'mechanics' && (
                  <div className="mg-level-row">
                    <div className="mg-level-row__rail">
                      <span className="mg-level-row__line" />
                      <button
                        type="button"
                        className="mg-level mg-level--special"
                        onClick={onOpenForces}
                        aria-label="Расстановка сил"
                      >
                        <span className="mg-level__inner">F</span>
                      </button>
                    </div>
                    <div className="mg-level-row__info">
                      <span className="mg-level-row__title">Расстановка сил</span>
                      <span className="mg-level-row__state">Практика · механика</span>
                    </div>
                  </div>
                )}

                <div className="mg-level-row">
                  <div className="mg-level-row__rail">
                    <span className="mg-level-row__line" />
                    <button
                      type="button"
                      className="mg-level mg-level--special"
                      onClick={onOpenFormulas}
                      aria-label="Тренажёр формул"
                    >
                      <span className="mg-level__inner">ƒ</span>
                    </button>
                  </div>
                  <div className="mg-level-row__info">
                    <span className="mg-level-row__title">Тренажёр формул</span>
                    <span className="mg-level-row__state">Интерактивная задача</span>
                  </div>
                </div>

                <div className="mg-level-row mg-level-row--boss">
                  <div className="mg-level-row__rail">
                    <span className="mg-level-row__line" />
                    <button
                      type="button"
                      className={`mg-level mg-level--boss ${bossReady ? 'mg-level--ready' : ''}`}
                      disabled={!bossReady}
                      onClick={() => {
                        haptics.impact('heavy');
                        onStartBoss(section.id);
                      }}
                      aria-label={`Босс ${section.boss}`}
                    >
                      <span className="mg-level__inner">
                        <Swords size={20} />
                      </span>
                    </button>
                  </div>
                  <div className="mg-level-row__info">
                    <span className="mg-level-row__title">Босс: {section.boss}</span>
                    <span className="mg-level-row__state">
                      {defeated
                        ? `Побеждён · ${section.item}`
                        : bossReady
                          ? 'Дуэль открыта'
                          : allReady
                            ? 'Пройдите босса, чтобы выбрать новый раздел'
                            : 'Наберите опыт на всех уровнях'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {isSandbox && (
          <button type="button" className="mg-reset" onClick={onResetProgress}>
            Сбросить прогресс (тест)
          </button>
        )}
      </div>
    </div>
  );
};
