import React from 'react';
import { ChevronRight, Lock, Sparkles, Trophy } from 'lucide-react';
import { PracticeProgress, totalXp } from '../../../shared/storage/progressStore';
import { SECTIONS } from '../domain/sections';
import { SectionId } from '../domain/types';
import {
  bossXpRequired,
  isSectionDefeated,
  isSectionUnlocked,
  sectionXp,
} from '../domain/progression';
import { haptics } from '../../../shared/motion/haptics';

interface SectionsMapScreenProps {
  progress: PracticeProgress;
  /** После победы над боссом игрок выбирает неизвестный раздел. */
  choosing: boolean;
  onOpenSection: (sectionId: SectionId) => void;
  onChooseSection: (sectionId: SectionId) => void;
}

export const SectionsMapScreen: React.FC<SectionsMapScreenProps> = ({
  progress,
  choosing,
  onOpenSection,
  onChooseSection,
}) => (
  <div className="mg-screen">
    <div className="mg-scroll">
      <header className="mg-screen__head">
        <div>
          <h1 className="mg-screen__title">Подготовка · ОГЭ</h1>
          <p className="mg-screen__subtitle">
            {choosing
              ? 'Выберите следующий раздел — он откроется на карте'
              : 'Карта разделов: проходите уровни и добирайте опыт'}
          </p>
        </div>
        <span className="mg-xp">
          <Sparkles size={13} />
          <span className="mg-xp__value">{totalXp(progress)} XP</span>
        </span>
      </header>

      <div className="mg-sections">
        {SECTIONS.map(section => {
          const unlocked = isSectionUnlocked(progress, section.id);
          const defeated = isSectionDefeated(progress, section.id);
          const xp = sectionXp(progress, section.id);
          const required = bossXpRequired(section.id);
          const ratio = required ? Math.min(1, xp / required) : 0;
          const selectable = choosing && !unlocked;

          const className = [
            'mg-section-node',
            unlocked ? 'mg-section-node--open' : 'mg-section-node--unknown',
            defeated ? 'mg-section-node--done' : '',
            selectable ? 'mg-section-node--selectable' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={section.id}
              type="button"
              className={className}
              disabled={!unlocked && !selectable}
              onClick={() => {
                haptics.impact('medium');
                if (unlocked) onOpenSection(section.id);
                else if (selectable) onChooseSection(section.id);
              }}
            >
              <span
                className="mg-section-node__circle"
                style={{
                  borderColor: defeated
                    ? '#fbbf24'
                    : unlocked
                      ? section.color
                      : 'var(--border-strong)',
                }}
              >
                {defeated ? (
                  <Trophy size={30} color="#fbbf24" />
                ) : unlocked ? (
                  <Sparkles size={30} color={section.color} />
                ) : (
                  <span className="mg-section-node__question">?</span>
                )}
                {unlocked && !defeated && (
                  <svg className="mg-section-node__ring" viewBox="0 0 96 96" aria-hidden>
                    <circle cx="48" cy="48" r="44" className="mg-section-node__track" />
                    <circle
                      cx="48"
                      cy="48"
                      r="44"
                      className="mg-section-node__fill"
                      strokeDasharray={2 * Math.PI * 44}
                      strokeDashoffset={2 * Math.PI * 44 * (1 - ratio)}
                      transform="rotate(-90 48 48)"
                      style={{ stroke: section.color }}
                    />
                  </svg>
                )}
              </span>

              <span className="mg-section-node__label">
                {unlocked ? section.title : 'Неизвестный раздел'}
              </span>
              <span className="mg-section-node__meta">
                {defeated
                  ? 'Пройден'
                  : unlocked
                    ? `${xp} / ${required} XP`
                    : selectable
                      ? 'Выбрать'
                      : 'Закрыт'}
              </span>

              {unlocked && !selectable && (
                <ChevronRight size={18} color="var(--text-muted)" className="mg-section-node__chevron" />
              )}
              {!unlocked && !selectable && (
                <Lock size={16} color="var(--text-muted)" className="mg-section-node__chevron" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  </div>
);
