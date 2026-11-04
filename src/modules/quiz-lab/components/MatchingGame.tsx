import React, { useMemo, useState } from 'react';
import { Button, StatusBadge } from '@maxhub/max-ui';
import { MATCHING_QUESTIONS } from '../data/matching';
import { GameResult, TOPIC_LABELS } from '../types';
import { shuffleBySeed, starsForGame } from '../engine/scoring';
import { haptics } from '../../../shared/motion/haptics';
import { GameShell } from './GameShell';
import { FeedbackPanel } from './FeedbackPanel';

interface GameProps {
  onExit: () => void;
  onFinish: (result: GameResult) => void;
}

const TOTAL_PAIRS = MATCHING_QUESTIONS.reduce((sum, item) => sum + item.pairs.length, 0);

export const MatchingGame: React.FC<GameProps> = ({ onExit, onFinish }) => {
  const total = MATCHING_QUESTIONS.length;

  const [index, setIndex] = useState(0);
  const [leftSelected, setLeftSelected] = useState<string | null>(null);
  const [links, setLinks] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [errors, setErrors] = useState(0);
  const [solved, setSolved] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const question = MATCHING_QUESTIONS[index];
  const rightItems = useMemo(
    () => shuffleBySeed(question.pairs, question.id),
    [question],
  );

  const allLinked = Object.keys(links).length === question.pairs.length;
  const isLast = index + 1 >= total;

  /** Сколько пар засчитано в текущем задании. */
  const questionCredit = () =>
    Math.max(0, question.pairs.length - Math.min(errors, question.pairs.length));

  const resetCheck = () => {
    setChecked(false);
    setWrongIds([]);
  };

  const handleLeft = (id: string) => {
    if (solved) return;
    resetCheck();
    haptics.selection();

    if (links[id]) {
      const next = { ...links };
      delete next[id];
      setLinks(next);
    }

    setLeftSelected(previous => (previous === id ? null : id));
  };

  const handleRight = (rightId: string) => {
    if (solved || !leftSelected) return;
    resetCheck();
    haptics.selection();

    const next: Record<string, string> = {};
    for (const [leftId, linkedRightId] of Object.entries(links)) {
      if (leftId !== leftSelected && linkedRightId !== rightId) {
        next[leftId] = linkedRightId;
      }
    }
    next[leftSelected] = rightId;

    setLinks(next);
    setLeftSelected(null);
  };

  const handleCheck = () => {
    if (!allLinked) return;

    const wrong = question.pairs
      .filter(pair => links[pair.id] !== pair.id)
      .map(pair => pair.id);

    setChecked(true);
    setWrongIds(wrong);

    if (!wrong.length) {
      setSolved(true);
      haptics.notification('success');
      return;
    }

    setErrors(previous => previous + wrong.length);
    haptics.notification('error');
  };

  const handleContinue = () => {
    if (!solved) return;

    const nextCorrect = correctCount + questionCredit();

    if (isLast) {
      onFinish({
        gameId: 'matching',
        correct: nextCorrect,
        total: TOTAL_PAIRS,
        stars: starsForGame(nextCorrect, TOTAL_PAIRS),
        bestStreak: 0,
      });
      return;
    }

    haptics.selection();
    setCorrectCount(nextCorrect);
    setIndex(index + 1);
    setLeftSelected(null);
    setLinks({});
    setChecked(false);
    setWrongIds([]);
    setErrors(0);
    setSolved(false);
  };

  const rightOwner = (rightId: string) =>
    Object.entries(links).find(([, linkedRight]) => linkedRight === rightId)?.[0];

  return (
    <GameShell
      title="Соответствие"
      step={index}
      total={total}
      streak={0}
      onExit={onExit}
      footer={
        <>
          {checked && solved && (
            <FeedbackPanel
              status="correct"
              title="Все пары верны!"
              explanation={question.explanation}
            />
          )}

          {checked && !solved && (
            <FeedbackPanel
              status="wrong"
              title={`Ошибок: ${wrongIds.length}`}
              explanation="Пары, выделенные красным, составлены неверно. Измените их и проверьте снова."
            />
          )}

          <Button
            variant="primary"
            size="large"
            stretched
            disabled={!solved && !allLinked}
            onClick={solved ? handleContinue : handleCheck}
            style={{ marginTop: checked ? 12 : 0 }}
          >
            {solved
              ? isLast
                ? 'Завершить'
                : 'Продолжить'
              : checked
                ? 'Проверить ещё раз'
                : 'Проверить'}
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
        Нажмите на элемент слева, затем на подходящий элемент справа
      </p>

      <div className="ql-match">
        <div className="ql-match__col">
          <div className="ql-match__col-title">Величина / прибор</div>
          {question.pairs.map(pair => {
            const linkedRightId = links[pair.id];
            const linkedRightText = linkedRightId
              ? question.pairs.find(item => item.id === linkedRightId)?.right
              : undefined;

            const className = [
              'ql-tile',
              linkedRightId ? 'ql-tile--linked' : '',
              leftSelected === pair.id ? 'ql-tile--selected' : '',
              wrongIds.includes(pair.id) ? 'ql-tile--wrong' : '',
              solved && links[pair.id] === pair.id ? 'ql-tile--correct' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <Button
                key={pair.id}
                variant={leftSelected === pair.id ? 'primary' : 'secondary'}
                size="small"
                stretched
                className={className}
                onClick={() => handleLeft(pair.id)}
              >
                <span className="ql-tile__stack">
                  <span>{pair.left}</span>
                  {linkedRightText && (
                    <span className="ql-tile__link">→ {linkedRightText}</span>
                  )}
                </span>
              </Button>
            );
          })}
        </div>

        <div className="ql-match__col">
          <div className="ql-match__col-title">Соответствие</div>
          {rightItems.map(pair => {
            const owner = rightOwner(pair.id);
            const className = [
              'ql-tile',
              owner ? 'ql-tile--taken' : '',
              owner && wrongIds.includes(owner) ? 'ql-tile--wrong' : '',
              solved && owner ? 'ql-tile--correct' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <Button
                key={pair.id}
                variant="secondary"
                size="small"
                stretched
                className={className}
                onClick={() => handleRight(pair.id)}
              >
                {pair.right}
              </Button>
            );
          })}
        </div>
      </div>
    </GameShell>
  );
};
