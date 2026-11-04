import React from 'react';
import { CellSimple } from '@maxhub/max-ui';
import { ChevronRight, Lock, Star, Trophy } from 'lucide-react';
import { PracticeProgress } from '../../../shared/storage/progressStore';
import { SECTIONS } from '../domain/sections';
import { SectionId } from '../domain/types';
import {
  isSectionDefeated,
  isSectionUnlocked,
  openTopicsCount,
  sectionStars,
} from '../domain/progression';
import { haptics } from '../../../shared/motion/haptics';

interface CourseScreenProps {
  progress: PracticeProgress;
  onOpenSection: (sectionId: SectionId) => void;
}

export const CourseScreen: React.FC<CourseScreenProps> = ({ progress, onOpenSection }) => (
  <div className="mg-screen">
    <div className="mg-scroll">
      <header className="mg-screen__head">
        <div>
          <h1 className="mg-screen__title">Курс</h1>
          <p className="mg-screen__subtitle">
            3 раздела трека ОГЭ. Темы открываются по мере накопления опыта.
          </p>
        </div>
      </header>

      <div className="mg-list">
        {SECTIONS.map(section => {
          const unlocked = isSectionUnlocked(progress, section.id);
          const defeated = isSectionDefeated(progress, section.id);
          const stars = sectionStars(progress, section.id);
          const openTopics = openTopicsCount(progress, section.id);

          return (
            <CellSimple
              key={section.id}
              as="button"
              className="mg-row"
              height="normal"
              disabled={!unlocked}
              onClick={() => {
                haptics.impact('medium');
                onOpenSection(section.id);
              }}
              overline={`Босс: ${section.boss}`}
              title={section.title}
              subtitle={`${openTopics} из ${section.topics.length} тем · ★ ${stars}`}
              before={
                <span
                  className="mg-row__icon"
                  style={{ backgroundColor: section.color }}
                  aria-hidden
                >
                  {defeated ? <Trophy size={20} /> : <Star size={20} />}
                </span>
              }
              after={
                !unlocked ? (
                  <Lock size={16} color="var(--text-muted)" />
                ) : defeated ? (
                  <span className="mg-row__badge">Пройден</span>
                ) : (
                  <ChevronRight size={18} color="var(--text-muted)" />
                )
              }
            />
          );
        })}
      </div>

      <p className="mg-note">
        Первый раздел открыт сразу. Остальные открываются после победы над боссом
        предыдущего раздела.
      </p>
    </div>
  </div>
);
