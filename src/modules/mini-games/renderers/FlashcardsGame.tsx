import React, { useState } from 'react';
import { Button } from '@maxhub/max-ui';
import { miniGamesApi } from '../api';
import { CARDS } from '../data/cards';
import { CardGrade, GameSummary } from '../domain/types';
import { getSectionByTopic, getTopic } from '../domain/sections';
import { haptics } from '../../../shared/motion/haptics';
import { recordPracticeResult } from '../../../shared/storage/progressStore';
import { GameShell } from '../components/GameShell';

interface GameProps {
  onFinish: (summary: GameSummary) => void;
}

const sumXp = (xp: Record<string, number | undefined>): number =>
  Object.values(xp).reduce((sum: number, value) => sum + (value ?? 0), 0);

/**
 * Самооценка из Core: 0 — неверно/пропуск, 1 — легко, 2 — ок, 3 — сложно.
 */
const OPTIONS: { value: CardGrade; label: string; variant: 'secondary' | 'primary' }[] = [
  { value: 0, label: 'Не знаю', variant: 'secondary' },
  { value: 1, label: 'Слишком легко', variant: 'secondary' },
  { value: 2, label: 'Нормально', variant: 'primary' },
  { value: 3, label: 'Сложно', variant: 'secondary' },
];

export const FlashcardsGame: React.FC<GameProps> = ({ onFinish }) => {
  const total = CARDS.length;

  const [queue, setQueue] = useState<string[]>(() => CARDS.map(card => card.id));
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [repeats, setRepeats] = useState(0);
  const [xp, setXp] = useState(0);
  const [scoreSum, setScoreSum] = useState(0);
  const [busy, setBusy] = useState(false);

  const card = CARDS.find(item => item.id === queue[0]);
  const topic = card ? getTopic(card.topic) : undefined;
  const section = card ? getSectionByTopic(card.topic) : undefined;

  const handleGrade = async (value: CardGrade) => {
    if (!card || busy) return;

    setBusy(true);
    const result = await miniGamesApi.grade({
      taskId: card.id,
      answer: { type: 'cards', selfAssessment: value },
    });
    setBusy(false);

    const gained = sumXp(result.xpByTopic);
    const nextXp = xp + gained;
    const nextScoreSum = scoreSum + result.score;

    setXp(nextXp);
    setScoreSum(nextScoreSum);
    setFlipped(false);

    recordPracticeResult({
      taskType: 'cards',
      topicId: card.topic,
      xp: gained,
      score: result.score,
    });

    if (value === 0) {
      setRepeats(previous => previous + 1);
      setQueue(previous => [...previous.slice(1), previous[0]]);
      haptics.impact('light');
      return;
    }

    const nextKnown = known + 1;
    setKnown(nextKnown);
    haptics.selection();

    if (queue.length === 1) {
      onFinish({
        type: 'cards',
        tasks: total,
        score: nextScoreSum / total,
        correct: nextKnown,
        xp: nextXp,
        bestStreak: 0,
        repeats,
      });
      return;
    }

    setQueue(previous => previous.slice(1));
  };

  return (
    <GameShell
      title="Карточки"
      step={known}
      total={total}
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
        Осталось: {queue.length} · повторено: {repeats}
      </div>

      {card && (
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
                {section ? section.title : 'Физика'} · сложность {card.difficulty}
              </span>
              <span className="mg-flash__question">{card.question}</span>
              <span className="mg-flash__tap">Нажмите на карточку, чтобы увидеть ответ</span>
            </div>

            <div className="mg-flash__face mg-flash__face--back">
              <span className="mg-flash__deck">{topic ? topic.title : 'Физика'}</span>
              <p className="mg-flash__answer">{card.answer}</p>
              {card.formula && <span className="mg-flash__formula">{card.formula}</span>}
              <span className="mg-flash__tap">Оцените, насколько уверенно вы это знаете</span>
            </div>
          </div>
        </div>
      )}
    </GameShell>
  );
};
