import React, { useMemo, useState } from 'react';
import { BottomSheet, Button, StatusBadge } from '@maxhub/max-ui';
import { Lightbulb } from 'lucide-react';
import { SINGLE_CHOICE_QUESTIONS } from '../data/singleChoice';
import { GameResult, TOPIC_LABELS } from '../types';
import { starsForGame } from '../engine/scoring';
import { haptics } from '../../../shared/motion/haptics';
import { GameShell } from './GameShell';
import { AnswerOption } from './AnswerOption';
import { FeedbackPanel } from './FeedbackPanel';

interface GameProps {
  onExit: () => void;
  onFinish: (result: GameResult) => void;
}

export const SingleChoiceGame: React.FC<GameProps> = ({ onExit, onFinish }) => {
  const total = SINGLE_CHOICE_QUESTIONS.length;

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [hintOpen, setHintOpen] = useState(false);

  const question = SINGLE_CHOICE_QUESTIONS[index];
  const isCorrect = selected === question.correctOptionId;

  const correctAnswer = useMemo(
    () => question.options.find(option => option.id === question.correctOptionId)?.text ?? '',
    [question],
  );

  const handleCheck = () => {
    if (!selected || checked) return;

    setChecked(true);

    if (isCorrect) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setBestStreak(previous => Math.max(previous, nextStreak));
      setCorrectCount(previous => previous + 1);
      haptics.notification('success');
      return;
    }

    setStreak(0);
    haptics.notification('error');
  };

  const handleContinue = () => {
    if (index + 1 >= total) {
      onFinish({
        gameId: 'single',
        correct: correctCount,
        total,
        stars: starsForGame(correctCount, total),
        bestStreak,
      });
      return;
    }

    haptics.selection();
    setIndex(index + 1);
    setSelected(null);
    setChecked(false);
    setHintOpen(false);
  };

  const isLast = index + 1 >= total;

  return (
    <>
      <GameShell
        title="Один ответ"
        step={index}
        total={total}
        streak={streak}
        onExit={onExit}
        footer={
          <>
            {checked && (
              <FeedbackPanel
                status={isCorrect ? 'correct' : 'wrong'}
                title={isCorrect ? 'Верно!' : 'Не совсем'}
                explanation={question.explanation}
                correctAnswer={isCorrect ? undefined : correctAnswer}
              />
            )}

            <Button
              variant="primary"
              size="large"
              stretched
              disabled={!checked && !selected}
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

        <div className="ql-options" role="radiogroup" aria-label="Варианты ответа">
          {question.options.map(option => {
            const optionSelected = selected === option.id;
            const mark = !checked
              ? 'none'
              : option.id === question.correctOptionId
                ? 'correct'
                : optionSelected
                  ? 'wrong'
                  : 'none';

            return (
              <AnswerOption
                key={option.id}
                name={`single-${question.id}`}
                value={option.id}
                text={option.text}
                selected={optionSelected}
                locked={checked}
                mark={mark}
                onSelect={() => {
                  if (checked) return;
                  haptics.selection();
                  setSelected(option.id);
                }}
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
