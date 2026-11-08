import React, { useMemo, useState } from 'react';
import { Button, StatusBadge } from '@maxhub/max-ui';
import { miniGamesApi } from '../api';
import { GradeResponse } from '../api/contracts';
import { Outcome, SingleChoiceTask } from '../domain/types';
import { getSectionByTopic, getTopic } from '../domain/sections';
import { shuffleBySeed } from '../engine/shuffle';
import { MathText } from '../../../shared/components/MathView';
import { haptics } from '../../../shared/motion/haptics';
import { playSound } from '../../../shared/audio/soundEffects';
import { GameShell } from '../components/GameShell';
import { AnswerOption } from '../components/AnswerOption';
import { FeedbackPanel } from '../components/FeedbackPanel';
import { TaskViewProps } from './taskView';

const FEEDBACK_TITLE: Record<Outcome, string> = {
  correct: 'Верно!',
  partial: 'Частично верно',
  wrong: 'Не совсем',
};

export const SingleTaskView: React.FC<TaskViewProps<SingleChoiceTask>> = ({
  task,
  step,
  total,
  streak,
  headerRight,
  seed,
  onDone,
}) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [grade, setGrade] = useState<GradeResponse | null>(null);
  const [busy, setBusy] = useState(false);

  const topic = getTopic(task.topic);
  const section = getSectionByTopic(task.topic);

  const options = useMemo(() => shuffleBySeed(task.options, `${seed ?? 'session'}:${task.id}:options`), [task, seed]);

  const correctAnswer = useMemo(
    () => task.options.find(option => option.id === task.correctOptionId)?.text ?? '',
    [task],
  );

  const handleCheck = async () => {
    if (!selected || grade || busy) return;

    setBusy(true);
    let result;
    try {
      result = await miniGamesApi.grade({
      taskId: task.id,
      answer: { type: 'single', optionId: selected },
      });
    } finally {
      setBusy(false);
    }
    if (!result) return;
    setGrade(result);
    haptics.notification(result.outcome === 'correct' ? 'success' : 'error');
    playSound(result.outcome === 'correct' ? 'correct' : 'wrong');
  };

  return (
      <GameShell
        title="Выбор ответа"
        step={step}
        total={total}
        streak={streak}
        headerRight={headerRight}
        footer={
          <>
            {grade && (
              <FeedbackPanel
                status={grade.outcome}
                title={FEEDBACK_TITLE[grade.outcome]}
                explanation={task.explanation}
                correctAnswer={grade.outcome === 'correct' ? undefined : correctAnswer}
              />
            )}

            <Button
              variant="primary"
              size="large"
              stretched
              loading={busy}
              disabled={!grade && !selected}
              onClick={() => (grade ? onDone(grade) : handleCheck())}
              style={{ marginTop: grade ? 12 : 0 }}
            >
              {grade ? 'Продолжить' : 'Проверить'}
            </Button>
          </>
        }
      >
        <div className="mg-question__meta">
          <StatusBadge status="neutral" text={section ? section.title : 'Физика'} />
          <span className="mg-question__meta-text">
            {topic?.title}
          </span>
        </div>

        <p className="mg-question__prompt"><MathText text={task.prompt} /></p>


        <div className="mg-options" role="radiogroup" aria-label="Варианты ответа">
          {options.map(option => {
            const optionSelected = selected === option.id;
            const mark = !grade
              ? 'none'
              : option.id === task.correctOptionId
                ? 'correct'
                : optionSelected
                  ? 'wrong'
                  : 'none';

            return (
              <AnswerOption
                key={option.id}
                name={`single-${task.id}`}
                value={option.id}
                text={option.text}
                selected={optionSelected}
                locked={Boolean(grade)}
                mark={mark}
                onSelect={() => {
                  if (grade) return;
                  haptics.selection();
                  setSelected(option.id);
                }}
              />
            );
          })}
        </div>
    </GameShell>
  );
};
