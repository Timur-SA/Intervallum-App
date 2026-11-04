import React, { useMemo, useState } from 'react';
import { BottomSheet, Button, StatusBadge } from '@maxhub/max-ui';
import { Lightbulb } from 'lucide-react';
import { miniGamesApi } from '../api';
import { GradeResponse } from '../api/contracts';
import { Outcome, SingleChoiceTask } from '../domain/types';
import { getSectionByTopic, getTopic } from '../domain/sections';
import { haptics } from '../../../shared/motion/haptics';
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
  onDone,
}) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [grade, setGrade] = useState<GradeResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);

  const topic = getTopic(task.topic);
  const section = getSectionByTopic(task.topic);

  const correctAnswer = useMemo(
    () => task.options.find(option => option.id === task.correctOptionId)?.text ?? '',
    [task],
  );

  const handleCheck = async () => {
    if (!selected || grade || busy) return;

    setBusy(true);
    const result = await miniGamesApi.grade({
      taskId: task.id,
      answer: { type: 'single', optionId: selected },
    });
    setBusy(false);
    setGrade(result);
    haptics.notification(result.outcome === 'correct' ? 'success' : 'error');
  };

  return (
    <>
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
            {topic ? topic.title : ''} · {step + 1} из {total}
          </span>
        </div>

        <p className="mg-question__prompt">{task.prompt}</p>

        {task.hint && (
          <div className="mg-question__hint-row">
            <Button
              variant="ghost"
              size="xsmall"
              iconBefore={<Lightbulb size={14} />}
              onClick={() => setHintOpen(true)}
            >
              Подсказка
            </Button>
          </div>
        )}

        <div className="mg-options" role="radiogroup" aria-label="Варианты ответа">
          {task.options.map(option => {
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

      {task.hint && (
        <BottomSheet open={hintOpen} title="Подсказка" onClose={() => setHintOpen(false)}>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
            {task.hint}
          </p>
        </BottomSheet>
      )}
    </>
  );
};
