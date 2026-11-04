import React, { useState } from 'react';
import { Button, CellSimple } from '@maxhub/max-ui';
import { ChevronRight, Lock, Timer } from 'lucide-react';
import { PracticeProgress } from '../../../shared/storage/progressStore';
import { SECTIONS } from '../domain/sections';
import { SectionId } from '../domain/types';
import { isSectionUnlocked, TRAINING_TASKS } from '../domain/progression';
import { haptics } from '../../../shared/motion/haptics';

interface TrainingScreenProps {
  progress: PracticeProgress;
  onStart: (sectionId?: SectionId) => void;
}

type Choice = 'all' | SectionId;

export const TrainingScreen: React.FC<TrainingScreenProps> = ({ progress, onStart }) => {
  const [choice, setChoice] = useState<Choice>('all');

  const options: { id: Choice; title: string }[] = [
    { id: 'all', title: 'Все разделы' },
    ...SECTIONS.map(section => ({ id: section.id as Choice, title: section.title })),
  ];

  return (
    <div className="mg-screen">
      <div className="mg-scroll">
        <header className="mg-screen__head">
          <div>
            <h1 className="mg-screen__title">Тренировка</h1>
            <p className="mg-screen__subtitle">
              {TRAINING_TASKS} задач на разные темы. Сложные и новые задачи приносят звёзды.
            </p>
          </div>
        </header>

        <div className="mg-chips">
          {options.map(option => {
            const locked =
              option.id !== 'all' && !isSectionUnlocked(progress, option.id as SectionId);

            return (
              <button
                key={option.id}
                type="button"
                className={`mg-chip ${choice === option.id ? 'mg-chip--active' : ''}`}
                disabled={locked}
                onClick={() => {
                  haptics.selection();
                  setChoice(option.id);
                }}
              >
                {option.title}
                {locked && <Lock size={11} />}
              </button>
            );
          })}
        </div>

        <CellSimple
          className="mg-row"
          height="normal"
          overline="Сессия"
          title={`${TRAINING_TASKS} задач`}
          subtitle="Смешанные типы заданий, опыт по темам"
          before={
            <span className="mg-row__icon" style={{ backgroundColor: '#8b5cf6' }} aria-hidden>
              <Timer size={20} />
            </span>
          }
          after={<ChevronRight size={18} color="var(--text-muted)" />}
        />

        <div style={{ marginTop: 'auto', paddingTop: 8 }}>
          <Button
            variant="primary"
            size="large"
            stretched
            onClick={() => {
              haptics.impact('medium');
              onStart(choice === 'all' ? undefined : choice);
            }}
          >
            Начать тренировку
          </Button>
        </div>

        <p className="mg-note">
          За каждую верно решённую новую или сложную задачу начисляется 1 звезда. Звёзды
          раздела открывают дуэль с боссом.
        </p>
      </div>
    </div>
  );
};
