import React from 'react';
import { Button } from '@maxhub/max-ui';
import { ChevronRight, Lock, Star, Trophy } from 'lucide-react';
import { PracticeProgress } from '../../../shared/storage/progressStore';
import { SECTIONS, getSection } from '../domain/sections';
import { SectionId } from '../domain/types';
import { isSectionUnlocked } from '../domain/progression';
import { haptics } from '../../../shared/motion/haptics';

interface BossVictoryScreenProps {
  sectionId: SectionId;
  progress: PracticeProgress;
  onChooseSection: (sectionId: SectionId) => void;
  onFinish: () => void;
}

/** Экран после победы над боссом: предмет и выбор следующего раздела. */
export const BossVictoryScreen: React.FC<BossVictoryScreenProps> = ({
  sectionId,
  progress,
  onChooseSection,
  onFinish,
}) => {
  const section = getSection(sectionId);
  const lockedSections = SECTIONS.filter(item => !isSectionUnlocked(progress, item.id));

  return (
    <div className="mg-result">
      <div
        className="mg-result__badge"
        style={{ backgroundColor: section?.color ?? 'var(--accent)' }}
      >
        <Trophy size={30} />
      </div>

      <h2 className="mg-result__title">Босс повержен</h2>
      <p className="mg-result__subtitle">{section?.boss}</p>

      <div className="mg-item">
        <Star size={16} fill="#f59e0b" />
        <span>Получен предмет: {section?.item}</span>
      </div>

      {lockedSections.length > 0 ? (
        <>
          <p className="mg-result__hint">Выберите следующий раздел</p>

          <div className="mg-list" style={{ width: '100%' }}>
            {lockedSections.map(item => (
              <button
                key={item.id}
                type="button"
                className="mg-next-section"
                onClick={() => {
                  haptics.impact('medium');
                  onChooseSection(item.id);
                }}
              >
                <span
                  className="mg-row__icon"
                  style={{ backgroundColor: item.color }}
                  aria-hidden
                >
                  <Lock size={18} />
                </span>
                <span className="mg-next-section__title">{item.title}</span>
                <ChevronRight size={18} color="var(--text-muted)" />
              </button>
            ))}
          </div>

          <Button variant="secondary" size="large" stretched onClick={onFinish}>
            Позже
          </Button>
        </>
      ) : (
        <Button variant="primary" size="large" stretched onClick={onFinish}>
          Все разделы пройдены
        </Button>
      )}
    </div>
  );
};
