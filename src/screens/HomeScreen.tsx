import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@maxhub/max-ui';
import { ArrowRight, LockKeyhole, Sparkles } from 'lucide-react';
import {
  PracticeProgress,
  UserProgressData,
  loadUserProgress,
  totalXp,
} from '../shared/storage/progressStore';
import { StreakFlame } from '../shared/components/StreakFlame';
import { haptics } from '../shared/motion/haptics';
import { SECTIONS, getSection } from '../modules/mini-games/domain/sections';
import {
  isSectionDefeated,
  isSectionUnlocked,
  isTopicComplete,
  isTopicUnlocked,
} from '../modules/mini-games/domain/progression';
import { Section, TopicId } from '../modules/mini-games/domain/types';
import { SECTION_ICONS } from '../modules/mini-games/config/sectionIcons';
import { MiniMapPreview } from './MiniMapPreview';
import './HomeScreen.css';

interface HomeScreenProps {
  onOpenMap: (focusTopicId: TopicId | null) => void;
  onOpenProfile: () => void;
}

const getCurrentTopic = (
  progress: PracticeProgress,
): { section: Section | null; topicId: TopicId | null } => {
  const visible = SECTIONS.filter(section => isSectionUnlocked(progress, section.id));
  const active = visible.filter(section => !isSectionDefeated(progress, section.id));

  for (const section of active) {
    const topicId = section.topics.find(
      topic =>
        isTopicUnlocked(progress, section.id, topic) && !isTopicComplete(progress, topic),
    );
    if (topicId) return { section, topicId };
  }

  const lastSection = active[active.length - 1] ?? visible[visible.length - 1] ?? null;
  return {
    section: lastSection,
    topicId: lastSection?.topics[lastSection.topics.length - 1] ?? null,
  };
};

const sectionState = (
  progress: PracticeProgress,
  section: Section,
): 'locked' | 'active' | 'done' => {
  if (isSectionDefeated(progress, section.id)) return 'done';
  if (isSectionUnlocked(progress, section.id)) return 'active';
  return 'locked';
};

export const HomeScreen: React.FC<HomeScreenProps> = ({ onOpenMap, onOpenProfile }) => {
  const [data, setData] = useState<UserProgressData>(() => loadUserProgress());

  useEffect(() => {
    const refresh = () => setData(loadUserProgress());
    window.addEventListener('intervallum:progress-changed', refresh);
    return () => window.removeEventListener('intervallum:progress-changed', refresh);
  }, []);

  const progress = data.practice;

  const { section: currentSection, topicId: currentTopicId } = useMemo(
    () => getCurrentTopic(progress),
    [progress],
  );
  const xp = totalXp(progress);
  const streakDays = data.activity.currentStreak;

  return (
    <div className="home-screen">
      <div className="home-scroll">
        <header className="home-head">
          <div className="home-head__title-block">
            <span className="home-head__eyebrow">Твой трек</span>
            <h1>Подготовка к ОГЭ</h1>
            <span className="home-head__subtitle">9 класс · физика</span>
          </div>

          <div className="home-head__right">
            <span className="home-xp">
              <Sparkles size={13} />
              <strong>{xp}</strong>
              <span>XP</span>
            </span>
            <button
              type="button"
              className="home-streak"
              onClick={onOpenProfile}
              aria-label={`Daily Streak: ${streakDays} дней. Открыть профиль`}
            >
              <StreakFlame days={streakDays} size={39} />
            </button>
          </div>
        </header>

        <MiniMapPreview
          progress={progress}
          currentTopicId={currentTopicId}
          onOpen={topicId => {
            haptics.selection();
            onOpenMap(topicId);
          }}
        />

        <Button
          variant="primary"
          size="large"
          stretched
          disabled
          iconBefore={<Sparkles size={17} />}
          className="home-train-btn"
        >
          Начать персональную тренировку
        </Button>

        <section className="home-sections">
          <div className="home-section-head">
            <div>
              <span className="home-section-head__eyebrow">Программа</span>
              <h2>Разделы</h2>
            </div>
            {currentSection && (
              <span className="home-section-head__hint">
                Сейчас: {currentSection.title}
              </span>
            )}
          </div>

          <div className="home-section-rail">
            {SECTIONS.map(section => {
              const state = sectionState(progress, section);
              const SectionIcon = SECTION_ICONS[section.id];
              const isCurrent = currentSection?.id === section.id;
              const canOpen = state !== 'locked';

              return (
                <button
                  key={section.id}
                  type="button"
                  className={`home-section-card home-section-card--${state} ${
                    isCurrent ? 'is-current' : ''
                  }`}
                  style={{ '--home-section-color': `var(--section-${section.id})` } as React.CSSProperties}
                  disabled={!canOpen}
                  onClick={() => {
                    if (!canOpen) return;
                    haptics.selection();
                    onOpenMap(isCurrent ? currentTopicId : section.topics[0]);
                  }}
                >
                  <span className="home-section-card__icon">
                    {canOpen ? <SectionIcon size={17} /> : <LockKeyhole size={16} />}
                  </span>
                  <span className="home-section-card__title">{section.title}</span>
                  <span className="home-section-card__state">
                    {state === 'done' ? 'Пройден' : state === 'active' ? 'Активен' : 'Закрыт'}
                  </span>
                  {state === 'active' && <span className="home-section-card__pulse" />}
                </button>
              );
            })}
          </div>
        </section>

        {currentSection && (
          <button
            type="button"
            className="home-continue"
            onClick={() => {
              haptics.selection();
              onOpenMap(currentTopicId);
            }}
          >
            <span>
              <span className="home-continue__eyebrow">Продолжить путь</span>
              <strong>{getSection(currentSection.id)?.title ?? 'Карта'}</strong>
            </span>
            <ArrowRight size={17} />
          </button>
        )}
      </div>
    </div>
  );
};
