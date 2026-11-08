import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@maxhub/max-ui';
import { Brain, Check, RotateCcw, Sparkles } from 'lucide-react';
import { miniGamesApi } from '../api';
import { CardGrade, TheoryCard } from '../domain/types';
import { getSectionByTopic, getTopic } from '../domain/sections';
import { ANSWER_KIND_LABELS } from '../data/cards';
import { MathText, MathView } from '../../../shared/components/MathView';
import { haptics } from '../../../shared/motion/haptics';
import { GameShell } from '../components/GameShell';
import { TaskViewProps } from './taskView';

const GRADES = [
  { value: 0, rating: 'again', label: 'Не вспомнил', description: 'Забыл или ошибся', icon: RotateCcw },
  { value: 3, rating: 'hard', label: 'С трудом', description: 'Верно, но долго', icon: Brain },
  { value: 2, rating: 'good', label: 'Вспомнил', description: 'Верно, с усилием', icon: Check },
  { value: 1, rating: 'easy', label: 'Легко', description: 'Верно и сразу', icon: Sparkles },
] as const;

const HOLD_MS = 260;
const HOLD_SLOP = 10;
const DROP_VERTICAL_MARGIN = 12;
const DROP_HORIZONTAL_MARGIN = 3;

interface Press {
  pointerId: number;
  x: number;
  y: number;
  timer: number;
  held: boolean;
}

export const CardTaskView: React.FC<TaskViewProps<TheoryCard>> = ({
  task,
  step,
  total,
  headerRight,
  onDone,
}) => {
  const [flipped, setFlipped] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [activeGrade, setActiveGrade] = useState<CardGrade | null>(null);
  const [saveError, setSaveError] = useState(false);
  const cardRef = useRef<HTMLButtonElement>(null);
  const targets = useRef<Partial<Record<CardGrade, HTMLButtonElement | null>>>({});
  const press = useRef<Press | null>(null);
  const suppressClick = useRef(false);
  const submitting = useRef(false);
  const hoveredGrade = useRef<CardGrade | null>(null);

  useEffect(() => () => {
    if (press.current) window.clearTimeout(press.current.timer);
  }, []);

  const topic = getTopic(task.topic);
  const section = getSectionByTopic(task.topic);

  const handleGrade = async (value: CardGrade) => {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setSaveError(false);
    let result;
    try {
      result = await miniGamesApi.grade({
        taskId: task.id,
        answer: { type: 'cards', selfAssessment: value },
      });
    } catch {
      setSaveError(true);
      return;
    } finally {
      submitting.current = false;
      setBusy(false);
    }

    if (cardRef.current) {
      haptics.selection();
      onDone(result);
    }
  };

  const gradeAt = (x: number, y: number): CardGrade | null => {
    const stage = cardRef.current?.parentElement?.getBoundingClientRect();
    if (!stage || x < stage.left || x > stage.right || y < stage.top || y > stage.bottom) {
      return null;
    }

    for (const { value } of GRADES) {
      const rect = targets.current[value]?.getBoundingClientRect();
      if (
        rect &&
        x >= rect.left - DROP_HORIZONTAL_MARGIN &&
        x <= rect.right + DROP_HORIZONTAL_MARGIN &&
        y >= rect.top - DROP_VERTICAL_MARGIN &&
        y <= rect.bottom + DROP_VERTICAL_MARGIN
      ) {
        return value;
      }
    }
    return null;
  };

  const endPress = (event: React.PointerEvent<HTMLButtonElement>, commit = false) => {
    const current = press.current;
    if (!current || current.pointerId !== event.pointerId) return;
    window.clearTimeout(current.timer);
    press.current = null;

    if (current.held) {
      event.currentTarget.style.removeProperty('translate');
      hoveredGrade.current = null;
      setActiveGrade(null);
      setDragging(false);
      const value = commit ? gradeAt(event.clientX, event.clientY) : null;
      if (value !== null) void handleGrade(value);
    }
  };

  const startPress = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!event.isPrimary || event.button !== 0 || press.current || submitting.current) return;
    suppressClick.current = false;
    if (!flipped) return;

    const { pointerId, clientX: x, clientY: y } = event;
    event.currentTarget.setPointerCapture(pointerId);
    const timer = window.setTimeout(() => {
      if (!press.current) return;
      press.current.held = true;
      suppressClick.current = true;
      setDragging(true);
      haptics.impact('light');
    }, HOLD_MS);
    press.current = { pointerId, x, y, timer, held: false };
  };

  const movePress = (event: React.PointerEvent<HTMLButtonElement>) => {
    const current = press.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;

    if (!current.held) {
      if (Math.hypot(dx, dy) > HOLD_SLOP) {
        suppressClick.current = true;
        endPress(event);
      }
      return;
    }

    event.currentTarget.style.translate = `${dx}px ${dy}px`;
    const value = gradeAt(event.clientX, event.clientY);
    if (value !== hoveredGrade.current) {
      hoveredGrade.current = value;
      setActiveGrade(value);
      if (value !== null) haptics.selection();
    }
  };

  const renderTargets = (start: number) => (
    <div className="mg-cards__targets" aria-hidden={!flipped} data-dragging={dragging}>
      {GRADES.slice(start, start + 2).map(({ value, rating, label, description, icon: Icon }) => (
        <button
          key={value}
          ref={node => { targets.current[value] = node; }}
          type="button"
          className="mg-cards__target"
          data-rating={rating}
          data-active={activeGrade === value}
          disabled={busy || dragging}
          onClick={() => void handleGrade(value)}
        >
          <Icon size={15} aria-hidden="true" />
          <span>
            <strong>{label}</strong>
            <small>{description}</small>
          </span>
        </button>
      ))}
    </div>
  );

  return (
    <GameShell
      title="Карточки"
      step={step}
      total={total}
      headerRight={headerRight}
      bodyClassName="mg-game__body--cards"
      footer={
        <div className="mg-cards__actions" data-flipped={flipped}>
          <Button
            className="mg-cards__reveal"
            variant="primary"
            size="large"
            stretched
            onClick={() => {
              haptics.selection();
              setFlipped(true);
              cardRef.current?.focus({ preventScroll: true });
            }}
          >
            Показать ответ
          </Button>
          {flipped && (
            <p id="mg-card-instructions" className="mg-cards__hint" role={saveError ? 'alert' : undefined}>
              {saveError ? 'Оценка не сохранилась. Попробуй ещё раз.' : 'Удержи карточку и перенеси в угол'}
            </p>
          )}
        </div>
      }
    >
      {renderTargets(0)}
      <button
        ref={cardRef}
        type="button"
        className="mg-flash"
        aria-expanded={flipped}
        aria-describedby={flipped ? 'mg-card-instructions' : undefined}
        data-dragging={dragging}
        disabled={busy}
        onPointerDown={startPress}
        onPointerMove={movePress}
        onPointerUp={event => endPress(event, true)}
        onPointerCancel={event => endPress(event)}
        onLostPointerCapture={event => endPress(event)}
        onContextMenu={event => {
          if (flipped) event.preventDefault();
        }}
        onClick={event => {
          if (press.current?.held) return;
          if (event.detail > 0 && suppressClick.current) {
            suppressClick.current = false;
            return;
          }
          haptics.selection();
          setFlipped(previous => !previous);
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
      </button>
      {renderTargets(2)}
    </GameShell>
  );
};
