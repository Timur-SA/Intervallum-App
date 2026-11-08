import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@maxhub/max-ui';
import { LockKeyhole } from 'lucide-react';
import {
  PracticeProgress,
  UserProgressData,
  loadUserProgress,
  totalXp,
} from '../shared/storage/progressStore';
import { StreakFlame } from '../shared/components/StreakFlame';
import { haptics } from '../shared/motion/haptics';
import { SECTIONS } from '../modules/mini-games/domain/sections';
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

const pluralDays = (count: number): string => {
  const abs = Math.abs(count) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return 'дней';
  if (last > 1 && last < 5) return 'дня';
  if (last === 1) return 'день';
  return 'дней';
};

export const HomeScreen: React.FC<HomeScreenProps> = ({ onOpenMap }) => {
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
          <h1>Подготовка к ОГЭ</h1>
          <span className="home-xp">
            <strong>{xp}</strong>
            <span>XP</span>
          </span>
        </header>

        <div className="home-dash">
          <MiniMapPreview
            progress={progress}
            section={currentSection}
            currentTopicId={currentTopicId}
            onOpen={topicId => {
              haptics.selection();
              onOpenMap(topicId);
            }}
          />

          <div className="home-streak-card">
            <StreakFlame days={streakDays} size={72} />
            <span className="home-streak-card__label">
              {pluralDays(streakDays)} подряд
            </span>
          </div>
        </div>

        <section className="home-sections">
          <div className="home-section-head">
            <h2>Разделы</h2>
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
                  style={
                    {
                      '--home-section-color': `var(--section-${section.id})`,
                    } as React.CSSProperties
                  }
                  disabled={!canOpen}
                  onClick={() => {
                    if (!canOpen) return;
                    haptics.selection();
                    onOpenMap(isCurrent ? currentTopicId : section.topics[0]);
                  }}
                >
                  <span className="home-section-card__icon">
                    {canOpen ? <SectionIcon size={20} /> : <LockKeyhole size={18} />}
                  </span>
                  <span className="home-section-card__title">{section.title}</span>
                  <span className="home-section-card__state">
                    {state === 'done'
                      ? 'Пройден'
                      : state === 'active'
                        ? 'Активен'
                        : 'Недоступен'}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <div className="home-cta">
        <Button
          variant="primary"
          size="large"
          stretched
          disabled
          className="home-train-btn"
        >
          Начать персональную тренировку
        </Button>
      </div>
    </div>
  );
};
