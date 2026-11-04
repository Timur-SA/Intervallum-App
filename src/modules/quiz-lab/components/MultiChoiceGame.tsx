import React, { useMemo, useState } from 'react';
import { BottomSheet, Button, StatusBadge } from '@maxhub/max-ui';
import { Lightbulb } from 'lucide-react';
import { MULTI_CHOICE_QUESTIONS } from '../data/multiChoice';
import { AnswerStatus, GameResult, TOPIC_LABELS } from '../types';
import { multiChoiceCredit, scoreMultiChoice, starsForGame } from '../engine/scoring';
import { haptics } from '../../../shared/motion/haptics';
import { GameShell } from './GameShell';
import { AnswerOption } from './AnswerOption';
import { FeedbackPanel } from './FeedbackPanel';

interface GameProps {
  onExit: () => void;
  onFinish: (result: GameResult) => void;
}

const STATUS_COPY: Record<AnswerStatus, { title: string; status: 'correct' | 'partial' | 'wrong' }> = {
  correct: { title: 'Верно!', status: 'correct' },
  partial: { title: 'Почти! Выбраны не все верные варианты', status: 'partial' },
  wrong: { title: 'Не совсем', status: 'wrong' },
};

export const MultiChoiceGame: React.FC<GameProps> = ({ onExit, onFinish }) => {
  const total = MULTI_CHOICE_QUESTIONS.length;

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [status, setStatus] = useState<AnswerStatus>('wrong');
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [hintOpen, setHintOpen] = useState(false);

  const question = MULTI_CHOICE_QUESTIONS[index];

  const correctAnswer = useMemo(
    () =>
      question.options
        .filter(option => question.correctOptionIds.includes(option.id))
        .map(option => option.text)
        .join('; '),
    [question],
  );

  const toggleOption = (id: string) => {
    if (checked) return;
    haptics.selection();
    setSelected(previous =>
      previous.includes(id) ? previous.filter(item => item !== id) : [...previous, id],
    );
  };

  const handleCheck = () => {
    if (!selected.length || checked) return;

    const score = scoreMultiChoice(selected, question.correctOptionIds);
    const credit = multiChoiceCredit(score);
    const nextStatus: AnswerStatus =
      score === 'full' ? 'correct' : score === 'partial' ? 'partial' : 'wrong';

    setStatus(nextStatus);
    setChecked(true);
    setCorrectCount(previous => previous + credit);

    if (score === 'full') {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setBestStreak(previous => Math.max(previous, nextStreak));
      haptics.notification('success');
      return;
    }

    setStreak(0);
    haptics.notification(score === 'partial' ? 'warning' : 'error');
  };

  const handleContinue = () => {
    if (index + 1 >= total) {
      onFinish({
        gameId: 'multi',
        correct: correctCount,
        total,
        stars: starsForGame(correctCount, total),
        bestStreak,
      });
      return;
    }

    haptics.selection();
    setIndex(index + 1);
    setSelected([]);
    setChecked(false);
    setHintOpen(false);
  };

  const isLast = index + 1 >= total;
  const copy = STATUS_COPY[status];

  return (
    <>
      <GameShell
        title="Несколько ответов"
        step={index}
        total={total}
        streak={streak}
        onExit={onExit}
        footer={
          <>
            {checked && (
              <FeedbackPanel
                status={copy.status}
                title={copy.title}
                explanation={question.explanation}
                correctAnswer={status === 'correct' ? undefined : correctAnswer}
              />
            )}

            <Button
              variant="primary"
              size="large"
              stretched
              disabled={!checked && selected.length === 0}
              onClick={checked ? handleContinue : handleCheck}
              style={{ marginTop: checked ? 12 : 0 }}
            >
              {checked ? (isLast ? 'Завершить' : 'Продолжить') : 'Проверить'}
            </Button>
          </>
        }
      >
        <div className="ql-question__meta">
          <StatusBadge status="neutral" text={TOPIC_LABELS[question.topic]} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {question.source} · {index + 1} из {total}
          </span>
        </div>

        <p className="ql-question__prompt">{question.prompt}</p>
        <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-muted)' }}>
          Отметьте все подходящие варианты
        </p>

        {question.hint && (
          <div className="ql-question__hint-row">
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

        <div className="ql-options" role="group" aria-label="Варианты ответа">
          {question.options.map(option => {
            const optionSelected = selected.includes(option.id);
            const mark = !checked
              ? 'none'
              : question.correctOptionIds.includes(option.id)
                ? 'correct'
                : optionSelected
                  ? 'wrong'
                  : 'none';

            return (
              <AnswerOption
                key={option.id}
                name={`multi-${question.id}`}
                value={option.id}
                text={option.text}
                selected={optionSelected}
                multiple
                locked={checked}
                mark={mark}
                onSelect={() => toggleOption(option.id)}
              />
            );
          })}
        </div>
      </GameShell>

      {question.hint && (
        <BottomSheet
          open={hintOpen}
          title="Подсказка"
          onClose={() => setHintOpen(false)}
        >
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
            {question.hint}
          </p>
        </BottomSheet>
      )}
    </>
  );
};
