import React, { useState } from 'react';
import { Button } from '@maxhub/max-ui';
import { miniGamesApi } from '../api';
import { CardGrade, TheoryCard } from '../domain/types';
import { getSectionByTopic, getTopic } from '../domain/sections';
import { ANSWER_KIND_LABELS } from '../data/cards';
import { MathText, MathView } from '../../../shared/components/MathView';
import { haptics } from '../../../shared/motion/haptics';
import { GameShell } from '../components/GameShell';
import { TaskViewProps } from './taskView';

/**
 * Самооценка из Core: 0 — неверно/пропуск, 1 — легко, 2 — ок, 3 — сложно.
 */
const OPTIONS: { value: CardGrade; label: string; variant: 'secondary' | 'primary' }[] = [
  { value: 0, label: 'Не знаю', variant: 'secondary' },
  { value: 1, label: 'Слишком легко', variant: 'secondary' },
  { value: 2, label: 'Нормально', variant: 'primary' },
  { value: 3, label: 'Сложно', variant: 'secondary' },
];

export const CardTaskView: React.FC<TaskViewProps<TheoryCard>> = ({
  task,
  step,
  total,
  headerRight,
  onDone,
}) => {
  const [flipped, setFlipped] = useState(false);
  const [busy, setBusy] = useState(false);

  const topic = getTopic(task.topic);
  const section = getSectionByTopic(task.topic);

  const handleGrade = async (value: CardGrade) => {
    if (busy) return;
    setBusy(true);
    let result;
    try {
      result = await miniGamesApi.grade({
      taskId: task.id,
      answer: { type: 'cards', selfAssessment: value },
      });
    } finally {
      setBusy(false);
    }
    if (!result) return;
    haptics.selection();
    onDone(result);
  };

  return (
    <GameShell
      title="Карточки"
      step={step}
      total={total}
      headerRight={headerRight}
      footer={
        flipped ? (
          <div className="mg-cards__grades">
            {OPTIONS.map(option => (
              <Button
                key={option.value}
                variant={option.variant}
                size="small"
                stretched
                disabled={busy}
                onClick={() => handleGrade(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        ) : (
          <Button
            variant="primary"
            size="large"
            stretched
            onClick={() => {
              haptics.selection();
              setFlipped(true);
            }}
          >
            Показать ответ
          </Button>
        )
      }
    >
      <button
        type="button"
        className="mg-flash"
        aria-pressed={flipped}
        onClick={() => {
          haptics.selection();
          setFlipped(previous => !previous);
        }}
      >
        <span key={flipped ? 'answer' : 'question'} className="mg-flash__face">
          <span className="mg-flash__deck">
            {(flipped ? topic?.title : section?.title) ?? 'Физика'}
          </span>
          {flipped ? (
            <>
              {task.formula && <MathView className="mg-theory__formula" latex={task.formula} />}
              <MathText className="mg-flash__answer" text={task.answer} />
            </>
          ) : (
            <span className="mg-flash__question">
              <MathText text={task.question} />
              {task.answerKind && ` (${ANSWER_KIND_LABELS[task.answerKind]})`}
            </span>
          )}
          <span className="mg-flash__tap">{flipped ? 'Показать вопрос' : 'Показать ответ'}</span>
        </span>
      </button>
    </GameShell>
  );
};
