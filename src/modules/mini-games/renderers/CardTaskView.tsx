import React, { useRef, useState } from 'react';
import { Button } from '@maxhub/max-ui';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { miniGamesApi } from '../api';
import { TheoryCard } from '../domain/types';
import { getSectionByTopic, getTopic } from '../domain/sections';
import { ANSWER_KIND_LABELS } from '../data/cards';
import { MathText, MathView } from '../../../shared/components/MathView';
import { haptics } from '../../../shared/motion/haptics';
import { GameShell } from '../components/GameShell';
import { TaskViewProps } from './taskView';

const SWIPE_COMMIT_RATIO = 0.16;
const SWIPE_MIN_DISTANCE = 44;
const SWIPE_VELOCITY = 0.45;
const SWIPE_DEAD_ZONE = 6;

interface SwipeDrag {
  pointerId: number;
  startX: number;
  startY: number;
  lastX: number;
  lastTime: number;
  width: number;
  axis: 'x' | 'y' | null;
}

export const CardTaskView: React.FC<TaskViewProps<TheoryCard>> = ({
  task,
  step,
  total,
  cardIndex = 0,
  cardTotal = total,
  headerRight,
  onDone,
}) => {
  const [flipped, setFlipped] = useState(false);
  const [busy, setBusy] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exit, setExit] = useState<'left' | 'right' | null>(null);
  const [dragWidth, setDragWidth] = useState(320);

  const cardRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<SwipeDrag | null>(null);

  const topic = getTopic(task.topic);
  const section = getSectionByTopic(task.topic);

  const threshold = Math.max(SWIPE_MIN_DISTANCE, dragWidth * SWIPE_COMMIT_RATIO);
  const glowProgress = Math.min(1, Math.abs(offsetX) / threshold);
  const activeSide = offsetX < -12 ? 'left' : offsetX > 12 ? 'right' : null;

  const reveal = () => {
    if (busy || flipped) return;
    haptics.selection();
    setFlipped(true);
  };

  const commitSwipe = async (direction: 'left' | 'right') => {
    if (busy || !flipped) return;

    setBusy(true);
    setDragging(false);
    dragRef.current = null;
    setExit(direction);
    setOffsetX(direction === 'left' ? -window.innerWidth : window.innerWidth);
    haptics.notification(direction === 'right' ? 'success' : 'error');

    try {
      const result = await miniGamesApi.grade({
        taskId: task.id,
        answer: {
          type: 'cards',
          selfAssessment: direction === 'right' ? 3 : 0,
        },
      });
      await new Promise(resolve => window.setTimeout(resolve, 260));
      onDone(result);
    } catch {
      setBusy(false);
      setExit(null);
      setDragging(false);
      setOffsetX(0);
    }
  };

  const beginSwipe = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!flipped || busy || exit || event.button > 0) return;

    const card = cardRef.current;
    if (!card) return;

    const width = card.getBoundingClientRect().width;
    setDragWidth(width);
    setDragging(true);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastTime: performance.now(),
      width,
      axis: null,
    };

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture не поддерживается — обычные pointer events продолжат работать.
    }
  };

  const moveSwipe = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;

    if (!drag.axis) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_DEAD_ZONE) return;

      drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (drag.axis === 'y') {
        dragRef.current = null;
        setDragging(false);
        setOffsetX(0);
        return;
      }
    }

    if (drag.axis !== 'x') return;

    drag.lastX = event.clientX;
    drag.lastTime = performance.now();
    setOffsetX(Math.max(-drag.width * 1.2, Math.min(drag.width * 1.2, dx)));
  };

  const endSwipe = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;

    if (drag.axis === 'x') {
      const dx = event.clientX - drag.startX;
      const dt = performance.now() - drag.lastTime;
      const velocity = dt > 0 ? (event.clientX - drag.lastX) / dt : 0;
      const shouldCommit =
        Math.abs(dx) >= Math.max(SWIPE_MIN_DISTANCE, drag.width * SWIPE_COMMIT_RATIO) ||
        Math.abs(velocity) > SWIPE_VELOCITY;

      setDragging(false);
      if (shouldCommit) {
        void commitSwipe(dx < 0 ? 'left' : 'right');
      } else {
        setOffsetX(0);
      }
      return;
    }

    setDragging(false);
    setOffsetX(0);
  };

  const cancelSwipe = () => {
    dragRef.current = null;
    setDragging(false);
    setOffsetX(0);
  };

  const cardStyle: React.CSSProperties = {
    transform: `translateX(${offsetX}px) rotate(${offsetX / 24}deg)`,
    transition: dragging
      ? 'none'
      : 'transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 220ms ease',
    opacity: exit ? 0 : 1,
  };

  return (
    <GameShell
      title="Карточки"
      step={step}
      total={total}
      headerRight={headerRight}
      footer={
        flipped ? (
          <div className={`mg-cards__swipe-bar ${activeSide ? `is-${activeSide}` : ''}`}>
            <div
              className={`mg-cards__swipe-side mg-cards__swipe-side--left ${
                activeSide === 'left' ? 'is-active' : ''
              }`}
            >
              <span className="mg-cards__swipe-icon" aria-hidden>
                <X size={18} />
              </span>
              <ArrowLeft className="mg-cards__swipe-arrow" size={22} aria-hidden />
            </div>

            <span className="mg-cards__swipe-hint">Смахните влево или вправо</span>

            <div
              className={`mg-cards__swipe-side mg-cards__swipe-side--right ${
                activeSide === 'right' ? 'is-active' : ''
              }`}
            >
              <ArrowRight className="mg-cards__swipe-arrow" size={22} aria-hidden />
              <span className="mg-cards__swipe-icon" aria-hidden>
                <Check size={18} />
              </span>
            </div>
          </div>
        ) : (
          <Button
            variant="primary"
            size="large"
            stretched
            disabled={busy}
            onClick={reveal}
          >
            Показать ответ
          </Button>
        )
      }
    >
      <div className="mg-cards__counter">
        Карточка {cardIndex + 1} из {cardTotal}
      </div>

      <div className="mg-swipe-stage">
        <div
          className="mg-swipe-glow mg-swipe-glow--left"
          style={{ opacity: offsetX < 0 ? glowProgress * 0.8 : 0 }}
          aria-hidden
        />
        <div
          className="mg-swipe-glow mg-swipe-glow--right"
          style={{ opacity: offsetX > 0 ? glowProgress * 0.8 : 0 }}
          aria-hidden
        />

        <div className="mg-swipe-card">
          <div
            ref={cardRef}
            role="button"
            tabIndex={0}
            aria-expanded={flipped}
            aria-label={
              flipped
                ? 'Карточка с ответом. Смахните влево или вправо'
                : 'Карточка. Показать ответ'
            }
            className={`mg-flash ${flipped ? 'is-flipped' : ''} ${
              dragging ? 'is-dragging' : ''
            } ${exit ? `is-exiting-${exit}` : ''}`}
            style={cardStyle}
            onClick={reveal}
            onKeyDown={event => {
              if (!flipped && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault();
                reveal();
                return;
              }
              if (flipped && event.key === 'ArrowLeft') {
                event.preventDefault();
                void commitSwipe('left');
              }
              if (flipped && event.key === 'ArrowRight') {
                event.preventDefault();
                void commitSwipe('right');
              }
            }}
          >
            <span className="mg-flash__inner">
              <span className="mg-flash__face" aria-hidden={flipped}>
                <span className="mg-flash__deck">{section?.title ?? 'Физика'}</span>
                <span className="mg-flash__question">
                  <MathText text={task.question} />
                  {task.answerKind && ` (${ANSWER_KIND_LABELS[task.answerKind]})`}
                </span>
                <span className="mg-flash__tap">Показать ответ</span>
              </span>
              <span className="mg-flash__face mg-flash__face--back" aria-hidden={!flipped}>
                <span className="mg-flash__deck">{topic?.title ?? 'Физика'}</span>
                {task.formula && <MathView className="mg-theory__formula" latex={task.formula} />}
                <MathText className="mg-flash__answer" text={task.answer} />
              </span>
            </span>
          </div>

          {flipped && !exit && (
            <div
              className={`mg-swipe-catcher ${dragging ? 'is-dragging' : ''}`}
              aria-hidden
              onPointerDown={beginSwipe}
              onPointerMove={moveSwipe}
              onPointerUp={endSwipe}
              onPointerCancel={cancelSwipe}
            />
          )}
        </div>
      </div>
    </GameShell>
  );
};
