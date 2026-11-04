import React, { useState } from 'react';
import { Button } from '@maxhub/max-ui';
import { THEORY_CARDS } from '../data/theoryCards';
import { GameResult, TheoryCard } from '../types';
import { starsForRatio } from '../engine/scoring';
import { haptics } from '../../../shared/motion/haptics';
import { GameShell } from './GameShell';

interface GameProps {
  onExit: () => void;
  onFinish: (result: GameResult) => void;
}

const DECK_LABELS: Record<TheoryCard['deck'], string> = {
  formula: 'Формула',
  quantity: 'Величина',
  law: 'Закон',
};

export const FlashcardsGame: React.FC<GameProps> = ({ onExit, onFinish }) => {
  const total = THEORY_CARDS.length;

  const [queue, setQueue] = useState<string[]>(() => THEORY_CARDS.map(card => card.id));
  const [known, setKnown] = useState<string[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [repeats, setRepeats] = useState(0);

  const card = THEORY_CARDS.find(item => item.id === queue[0]);

  const finish = (nextRepeats: number) => {
    const ratio = total / Math.max(1, total + nextRepeats);
    onFinish({
      gameId: 'cards',
      correct: total,
      total,
      stars: starsForRatio(ratio),
      bestStreak: 0,
    });
  };

  const handleKnow = () => {
    if (!card) return;

    haptics.notification('success');
    const nextKnown = [...known, card.id];
    const nextQueue = queue.slice(1);

    setKnown(nextKnown);
    setFlipped(false);

    if (!nextQueue.length) {
      setQueue(nextQueue);
      finish(repeats);
      return;
    }

    setQueue(nextQueue);
  };

  const handleRepeat = () => {
    if (!card) return;

    haptics.impact('light');
    const nextRepeats = repeats + 1;
    setRepeats(nextRepeats);
    setFlipped(false);
    setQueue(previous => [...previous.slice(1), previous[0]]);
  };

  return (
    <GameShell
      title="Карточки"
      step={known.length}
      total={total}
      onExit={onExit}
      footer={
        flipped ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <Button
              variant="secondary"
              size="large"
              stretched
              onClick={handleRepeat}
            >
              Повторить
            </Button>
            <Button variant="primary" size="large" stretched onClick={handleKnow}>
              Знаю
            </Button>
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
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 12,
        }}
      >
        <div className="ql-flash__counter">
          Осталось карточек: {queue.length} · повторено: {repeats}
        </div>

        {card && (
          <div
            className={`ql-flash ${flipped ? 'is-flipped' : ''}`}
            onClick={() => {
              haptics.selection();
              setFlipped(previous => !previous);
            }}
            role="button"
            tabIndex={0}
            aria-label={flipped ? 'Показать термин' : 'Показать определение'}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setFlipped(previous => !previous);
              }
            }}
          >
            <div className="ql-flash__inner">
              <div className="ql-flash__face">
                <span className="ql-flash__deck">{DECK_LABELS[card.deck]}</span>
                <span className="ql-flash__term">{card.term}</span>
                <span className="ql-flash__tap">Нажмите на карточку, чтобы увидеть определение</span>
              </div>

              <div className="ql-flash__face ql-flash__face--back">
                <span className="ql-flash__deck">{DECK_LABELS[card.deck]}</span>
                <span className="ql-flash__term" style={{ fontSize: 16 }}>
                  {card.term}
                </span>
                <p className="ql-flash__definition">{card.definition}</p>
                {card.formula && <span className="ql-flash__formula">{card.formula}</span>}
              </div>
            </div>
          </div>
        )}
      </div>
    </GameShell>
  );
};
