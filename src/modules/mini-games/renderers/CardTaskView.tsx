import React, { useState } from 'react';
import { Button } from '@maxhub/max-ui';
import { miniGamesApi } from '../api';
import { CardGrade, TheoryCard } from '../domain/types';
import { getSectionByTopic, getTopic } from '../domain/sections';
import { ANSWER_KIND_LABELS } from '../data/cards';
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
      <div className="mg-cards__counter">
        Карточка {step + 1} из {total}
      </div>

      <div
        className={`mg-flash ${flipped ? 'is-flipped' : ''}`}
        onClick={() => {
          haptics.selection();
          setFlipped(previous => !previous);
        }}
        role="button"
        tabIndex={0}
        aria-label={flipped ? 'Показать вопрос' : 'Показать ответ'}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setFlipped(previous => !previous);
          }
        }}
      >
        <div className="mg-flash__inner">
          <div className="mg-flash__face">
            <span className="mg-flash__deck">
              {section ? section.title : 'Физика'} · сложность {task.difficulty}
            </span>
            <span className="mg-flash__question">
              {task.question}
              {task.answerKind && ` (${ANSWER_KIND_LABELS[task.answerKind]})`}
            </span>
            <span className="mg-flash__tap">Нажмите на карточку, чтобы увидеть ответ</span>
          </div>

          <div className="mg-flash__face mg-flash__face--back">
            <span className="mg-flash__deck">{topic ? topic.title : 'Физика'}</span>
            <p className="mg-flash__answer">{task.answer}</p>
            {task.formula && <span className="mg-flash__formula">{task.formula}</span>}
            <span className="mg-flash__tap">Оцените, насколько уверенно вы это знаете</span>
          </div>
        </div>
      </div>
    </GameShell>
  );
};
