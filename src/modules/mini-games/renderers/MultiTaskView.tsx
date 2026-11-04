import React, { useMemo, useState } from 'react';
import { BottomSheet, Button, StatusBadge } from '@maxhub/max-ui';
import { Lightbulb } from 'lucide-react';
import { miniGamesApi } from '../api';
import { GradeResponse } from '../api/contracts';
import { MultiChoiceTask } from '../domain/types';
import { getSectionByTopic, getTopic } from '../domain/sections';
import { haptics } from '../../../shared/motion/haptics';
import { GameShell } from '../components/GameShell';
import { AnswerOption } from '../components/AnswerOption';
import { FeedbackPanel } from '../components/FeedbackPanel';
import { TaskViewProps, sumXp } from './taskView';

export const MultiTaskView: React.FC<TaskViewProps<MultiChoiceTask>> = ({
  task,
  step,
  total,
  streak,
  headerRight,
  onDone,
}) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [grade, setGrade] = useState<GradeResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);

  const topic = getTopic(task.topic);
  const section = getSectionByTopic(task.topic);

  const correctAnswer = useMemo(
    () =>
      task.options
        .filter(option => task.correctOptionIds.includes(option.id))
        .map(option => option.text)
        .join('; '),
    [task],
  );

  const toggleOption = (id: string) => {
    if (grade) return;
    haptics.selection();
    setSelected(previous =>
      previous.includes(id) ? previous.filter(item => item !== id) : [...previous, id],
    );
  };

  const handleCheck = async () => {
    if (!selected.length || grade || busy) return;

    setBusy(true);
    const result = await miniGamesApi.grade({
      taskId: task.id,
      answer: { type: 'multi', optionIds: selected },
    });
    setBusy(false);
    setGrade(result);
    haptics.notification(
      result.outcome === 'correct' ? 'success' : result.outcome === 'partial' ? 'warning' : 'error',
    );
  };

  const feedbackTitle =
    grade?.outcome === 'correct'
      ? 'Верно!'
      : grade?.outcome === 'partial'
        ? 'Частично верно'
        : 'Не совсем';

  return (
    <>
      <GameShell
        title="Множественный выбор"
        step={step}
        total={total}
        streak={streak}
        headerRight={headerRight}
        footer={
          <>
            {grade && (
              <FeedbackPanel
                status={grade.outcome}
                title={feedbackTitle}
                explanation={task.explanation}
                correctAnswer={grade.outcome === 'correct' ? undefined : correctAnswer}
                xp={sumXp(grade.xpByTopic)}
              />
            )}

            <Button
              variant="primary"
              size="large"
              stretched
              loading={busy}
              disabled={!grade && selected.length === 0}
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
        <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-muted)' }}>
          Отметьте все подходящие варианты. Штраф за пропущенные и лишние.
        </p>

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

        <div className="mg-options" role="group" aria-label="Варианты ответа">
          {task.options.map(option => {
            const optionSelected = selected.includes(option.id);
            const mark = !grade
              ? 'none'
              : task.correctOptionIds.includes(option.id)
                ? 'correct'
                : optionSelected
                  ? 'wrong'
                  : 'none';

            return (
              <AnswerOption
                key={option.id}
                name={`multi-${task.id}`}
                value={option.id}
                text={option.text}
                selected={optionSelected}
                multiple
                locked={Boolean(grade)}
                mark={mark}
                onSelect={() => toggleOption(option.id)}
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
