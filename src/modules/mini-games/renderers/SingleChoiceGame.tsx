import React, { useMemo, useState } from 'react';
import { BottomSheet, Button, StatusBadge } from '@maxhub/max-ui';
import { Lightbulb } from 'lucide-react';
import { miniGamesApi } from '../api';
import { GradeResponse } from '../api/contracts';
import { SINGLE_TASKS } from '../data/single';
import { GameSummary, Outcome } from '../domain/types';
import { getSectionByTopic, getTopic } from '../domain/sections';
import { haptics } from '../../../shared/motion/haptics';
import { recordPracticeResult } from '../../../shared/storage/progressStore';
import { GameShell } from '../components/GameShell';
import { AnswerOption } from '../components/AnswerOption';
import { FeedbackPanel } from '../components/FeedbackPanel';

interface GameProps {
  onFinish: (summary: GameSummary) => void;
}

const FEEDBACK_TITLE: Record<Outcome, string> = {
  correct: 'Верно!',
  partial: 'Частично верно',
  wrong: 'Не совсем',
};

const sumXp = (xp: Record<string, number | undefined>): number =>
  Object.values(xp).reduce((sum: number, value) => sum + (value ?? 0), 0);

export const SingleChoiceGame: React.FC<GameProps> = ({ onFinish }) => {
  const total = SINGLE_TASKS.length;

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [grade, setGrade] = useState<GradeResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [correctSum, setCorrectSum] = useState(0);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [hintOpen, setHintOpen] = useState(false);

  const task = SINGLE_TASKS[index];
  const topic = getTopic(task.topic);
  const section = getSectionByTopic(task.topic);
  const isLast = index + 1 >= total;

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
    setCorrectSum(previous => previous + result.score);
    setXp(previous => previous + sumXp(result.xpByTopic));

    recordPracticeResult({
      taskType: 'single',
      topicId: task.topic,
      xp: sumXp(result.xpByTopic),
      score: result.score,
    });

    if (result.outcome === 'correct') {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setBestStreak(previous => Math.max(previous, nextStreak));
      haptics.notification('success');
      return;
    }

    setStreak(0);
    haptics.notification('error');
  };

  const handleContinue = () => {
    if (!grade) return;

    if (isLast) {
      onFinish({
        type: 'single',
        tasks: total,
        score: correctSum / total,
        correct: correctSum,
        xp,
        bestStreak,
      });
      return;
    }

    haptics.selection();
    setIndex(index + 1);
    setSelected(null);
    setGrade(null);
    setHintOpen(false);
  };

  return (
    <>
      <GameShell
        title="Выбор ответа"
        step={index}
        total={total}
        streak={streak}
        footer={
          <>
            {grade && (
              <FeedbackPanel
                status={grade.outcome}
                title={FEEDBACK_TITLE[grade.outcome]}
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
              disabled={!grade && !selected}
              onClick={grade ? handleContinue : handleCheck}
              style={{ marginTop: grade ? 12 : 0 }}
            >
              {grade ? (isLast ? 'Завершить' : 'Продолжить') : 'Проверить'}
            </Button>
          </>
        }
      >
        <div className="mg-question__meta">
          <StatusBadge status="neutral" text={section ? section.title : 'Физика'} />
          <span className="mg-question__meta-text">
            {topic ? topic.title : ''} · {index + 1} из {total}
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
