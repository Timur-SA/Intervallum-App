import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Button, StatusBadge } from '@maxhub/max-ui';
import { miniGamesApi } from '../api';
import { GradeResponse } from '../api/contracts';
import { MatchingTask } from '../domain/types';
import { getSectionByTopic, getTopic } from '../domain/sections';
import { shuffleBySeed } from '../engine/shuffle';
import { haptics } from '../../../shared/motion/haptics';
import { GameShell } from '../components/GameShell';
import { FeedbackPanel } from '../components/FeedbackPanel';
import { TaskViewProps } from './taskView';

const THREAD_COLORS = ['#38bdf8', '#a78bfa', '#34d399', '#fbbf24', '#fb7185', '#22d3ee'];

interface Thread {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

interface DragState {
  id: string;
  side: 'left' | 'right';
  originX: number;
  originY: number;
  x: number;
  y: number;
  active: boolean;
}

export const MatchingTaskView: React.FC<TaskViewProps<MatchingTask>> = ({
  task,
  step,
  total,
  headerRight,
  seed,
  onDone,
}) => {
  const [selected, setSelected] = useState<{ side: 'left' | 'right'; id: string } | null>(null);
  const [links, setLinks] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const [errors, setErrors] = useState(0);
  const [grade, setGrade] = useState<GradeResponse | null>(null);
  const [busy, setBusy] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [measureTick, setMeasureTick] = useState(0);
  const dragRef = useRef<DragState | null>(null);
  dragRef.current = drag;
  const suppressClickRef = useRef(false);

  const topic = getTopic(task.topic);
  const section = getSectionByTopic(task.topic);

  const rightItems = useMemo(() => shuffleBySeed(task.pairs, `${seed ?? 'session'}:${task.id}`), [task, seed]);
  const allLinked = Object.keys(links).length === task.pairs.length;

  const colorFor = (leftId: string): string => {
    const index = task.pairs.findIndex(pair => pair.id === leftId);
    return THREAD_COLORS[(index < 0 ? 0 : index) % THREAD_COLORS.length];
  };

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const base = container.getBoundingClientRect();
    const next: Thread[] = [];

    task.pairs.forEach(pair => {
      const rightId = links[pair.id];
      if (!rightId) return;

      const leftEl = container.querySelector<HTMLElement>(`[data-tile-left="${pair.id}"]`);
      const rightEl = container.querySelector<HTMLElement>(`[data-tile-right="${rightId}"]`);
      if (!leftEl || !rightEl) return;

      const leftRect = leftEl.getBoundingClientRect();
      const rightRect = rightEl.getBoundingClientRect();

      next.push({
        id: pair.id,
        x1: leftRect.right - base.left,
        y1: leftRect.top + leftRect.height / 2 - base.top,
        x2: rightRect.left - base.left,
        y2: rightRect.top + rightRect.height / 2 - base.top,
        color: colorFor(pair.id),
      });
    });

    setThreads(next);
  }, [links, task, measureTick]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => setMeasureTick(previous => previous + 1));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const resetCheck = () => {
    setChecked(false);
    setWrongIds([]);
  };

  const applyLink = (leftId: string, rightId: string) => {
    if (solved) return;
    resetCheck();
    haptics.selection();

    const next: Record<string, string> = {};
    for (const [linkedLeft, linkedRight] of Object.entries(links)) {
      if (linkedLeft !== leftId && linkedRight !== rightId) {
        next[linkedLeft] = linkedRight;
      }
    }
    next[leftId] = rightId;

    setLinks(next);
    setSelected(null);
  };

  const handleTapLeft = (id: string) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (solved) return;

    if (selected?.side === 'right') {
      applyLink(id, selected.id);
      return;
    }

    resetCheck();
    haptics.selection();

    if (links[id]) {
      const next = { ...links };
      delete next[id];
      setLinks(next);
    }

    setSelected(previous => (previous?.side === 'left' && previous.id === id ? null : { side: 'left', id }));
  };

  const handleTapRight = (rightId: string) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (solved) return;

    if (selected?.side === 'left') {
      applyLink(selected.id, rightId);
      return;
    }

    resetCheck();
    haptics.selection();
    setSelected(previous =>
      previous?.side === 'right' && previous.id === rightId ? null : { side: 'right', id: rightId },
    );
  };

  const beginDrag = (event: React.PointerEvent, id: string, side: 'left' | 'right') => {
    if (solved) return;
    const container = containerRef.current;
    if (!container) return;

    const base = container.getBoundingClientRect();
    const tile = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const y = tile.top + tile.height / 2 - base.top;

    setDrag({
      id,
      side,
      originX: event.clientX,
      originY: event.clientY,
      x: (side === 'left' ? tile.right : tile.left) - base.left,
      y,
      active: false,
    });
  };

  const moveDrag = (event: React.PointerEvent) => {
    const current = dragRef.current;
    const container = containerRef.current;
    if (!current || !container) return;

    const base = container.getBoundingClientRect();
    const moved =
      current.active ||
      Math.hypot(event.clientX - current.originX, event.clientY - current.originY) > 8;

    if (!moved) return;

    setDrag({
      ...current,
      active: true,
      x: event.clientX - base.left,
      y: event.clientY - base.top,
    });
  };

  const endDrag = (event: React.PointerEvent) => {
    const current = dragRef.current;
    if (!current) return;
    setDrag(null);

    if (!current.active) return;

    suppressClickRef.current = true;
    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>('[data-tile-left], [data-tile-right]');

    if (!target) return;

    const leftId = target.dataset.tileLeft;
    const rightId = target.dataset.tileRight;

    if (current.side === 'left' && rightId) {
      applyLink(current.id, rightId);
    } else if (current.side === 'right' && leftId) {
      applyLink(leftId, current.id);
    }
  };

  const handleCheck = async () => {
    if (!allLinked || busy) return;

    const wrong = task.pairs.filter(pair => links[pair.id] !== pair.id).map(pair => pair.id);

    setChecked(true);
    setWrongIds(wrong);

    if (!grade) {
      setBusy(true);
      try {
        const result = await miniGamesApi.grade({
          taskId: task.id,
          answer: { type: 'matching', links },
        });
        setGrade(result);
      } finally {
        setBusy(false);
      }
    }

    if (!wrong.length) {
      setSolved(true);
      haptics.notification('success');
      return;
    }

    setErrors(previous => previous + wrong.length);
    haptics.notification('error');
  };

  const rightOwner = (rightId: string) =>
    Object.entries(links).find(([, linkedRight]) => linkedRight === rightId)?.[0];

  const dragSource = drag?.active
    ? (() => {
        const container = containerRef.current;
        if (!container) return null;
        const el = container.querySelector<HTMLElement>(
          drag.side === 'left'
            ? `[data-tile-left="${drag.id}"]`
            : `[data-tile-right="${drag.id}"]`,
        );
        if (!el) return null;
        const tile = el.getBoundingClientRect();
        const base = container.getBoundingClientRect();
        return {
          x: (drag.side === 'left' ? tile.right : tile.left) - base.left,
          y: tile.top + tile.height / 2 - base.top,
        };
      })()
    : null;

  return (
    <GameShell
      title="Соответствие"
      step={step}
      total={total}
      headerRight={headerRight}
      footer={
        <>
          {checked && solved && (
            <FeedbackPanel
              status="correct"
              title="Все пары верны!"
              explanation={
                grade && grade.score < 1
                  ? `${task.explanation} Первая попытка была неверной, поэтому засчитано ${Math.round(
                      grade.score * 100,
                    )}%.`
                  : task.explanation
              }
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
            loading={busy}
            disabled={!solved && !allLinked}
            onClick={() => (solved && grade ? onDone(grade) : handleCheck())}
            style={{ marginTop: checked ? 12 : 0 }}
          >
            {solved ? 'Продолжить' : checked ? 'Проверить ещё раз' : 'Проверить'}
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
        Соедините пары: нажмите на две плитки или протяните нитку от одной к другой
        {errors > 0 ? ` · ошибок: ${errors}` : ''}
      </p>

      <div className="mg-match" ref={containerRef}>
        <svg className="mg-match__threads" aria-hidden>
          {threads.map(thread => (
            <g key={thread.id}>
              <path
                className="mg-thread"
                pathLength={1}
                d={`M ${thread.x1} ${thread.y1} C ${thread.x1 + 22} ${thread.y1}, ${
                  thread.x2 - 22
                } ${thread.y2}, ${thread.x2} ${thread.y2}`}
                stroke={thread.color}
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
              />
              <circle cx={thread.x1} cy={thread.y1} r={3.5} fill={thread.color} className="mg-thread__dot" />
              <circle cx={thread.x2} cy={thread.y2} r={3.5} fill={thread.color} className="mg-thread__dot" />
            </g>
          ))}

          {dragSource && drag && (
            <path
              className="mg-thread--temp"
              d={`M ${dragSource.x} ${dragSource.y} Q ${(dragSource.x + drag.x) / 2} ${
                (dragSource.y + drag.y) / 2 - 10
              }, ${drag.x} ${drag.y}`}
              stroke={drag.side === 'left' ? colorFor(drag.id) : 'var(--accent)'}
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
            />
          )}
        </svg>

        <div className="mg-match__col">
          <div className="mg-match__col-title">Слева</div>
          {task.pairs.map(pair => {
            const linkedRightId = links[pair.id];
            const color = colorFor(pair.id);
            const isSelected = selected?.side === 'left' && selected.id === pair.id;

            const className = [
              'mg-tile',
              linkedRightId ? 'mg-tile--linked' : '',
              isSelected ? 'mg-tile--selected' : '',
              wrongIds.includes(pair.id) ? 'mg-tile--wrong' : '',
              solved && links[pair.id] === pair.id ? 'mg-tile--correct' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <Button
                key={pair.id}
                data-tile-left={pair.id}
                variant={isSelected ? 'primary' : 'secondary'}
                size="small"
                stretched
                className={className}
                innerClassNames={{ content: 'mg-tile__content' }}
                style={
                  linkedRightId && !wrongIds.includes(pair.id)
                    ? { boxShadow: `inset 0 0 0 1.5px ${color}` }
                    : undefined
                }
                onPointerDown={event => beginDrag(event, pair.id, 'left')}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={() => setDrag(null)}
                onClick={() => handleTapLeft(pair.id)}
              >
                {pair.left}
              </Button>
            );
          })}
        </div>

        <div className="mg-match__col">
          <div className="mg-match__col-title">Справа</div>
          {rightItems.map(pair => {
            const owner = rightOwner(pair.id);
            const color = owner ? colorFor(owner) : undefined;
            const isSelected = selected?.side === 'right' && selected.id === pair.id;

            const className = [
              'mg-tile',
              owner ? 'mg-tile--taken' : '',
              isSelected ? 'mg-tile--selected' : '',
              owner && wrongIds.includes(owner) ? 'mg-tile--wrong' : '',
              solved && owner ? 'mg-tile--correct' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <Button
                key={pair.id}
                data-tile-right={pair.id}
                variant={isSelected ? 'primary' : 'secondary'}
                size="small"
                stretched
                className={className}
                innerClassNames={{ content: 'mg-tile__content' }}
                style={
                  owner && !wrongIds.includes(owner)
                    ? { boxShadow: `inset 0 0 0 1.5px ${color}` }
                    : undefined
                }
                onPointerDown={event => beginDrag(event, pair.id, 'right')}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={() => setDrag(null)}
                onClick={() => handleTapRight(pair.id)}
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
