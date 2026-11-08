import { MathText } from '../../../shared/components/MathView';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Button, StatusBadge } from '@maxhub/max-ui';
import { miniGamesApi } from '../api';
import { GradeResponse } from '../api/contracts';
import { MatchingTask } from '../domain/types';
import { getSectionByTopic, getTopic } from '../domain/sections';
import { shuffleBySeed } from '../engine/shuffle';
import { haptics } from '../../../shared/motion/haptics';
import { playSound } from '../../../shared/audio/soundEffects';
import { GameShell } from '../components/GameShell';
import { FeedbackPanel } from '../components/FeedbackPanel';
import { TaskViewProps } from './taskView';

const THREAD_COLORS = ['#38bdf8', '#a78bfa', '#f97316', '#fbbf24', '#fb7185', '#22d3ee'];

const ANCHOR_INSET = 18;
const DOT_RADIUS = 9;
const HALO_RADIUS = 14;
const DRAG_THRESHOLD = 8;
const SNAP_MARGIN_X = 24;
const SNAP_MARGIN_Y = 16;
const LINK_DRAW_MS = 420;
const EXIT_MS = 600;
const BURST_MS = 900;

type Side = 'left' | 'right';

interface Point {
  x: number;
  y: number;
}

interface Thread {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

interface SnapTarget extends Point {
  id: string;
  side: Side;
}

interface DragState {
  id: string;
  side: Side;
  pointerId: number;
  originX: number;
  originY: number;
  sourceX: number;
  sourceY: number;
  x: number;
  y: number;
  active: boolean;
  snap: SnapTarget | null;
}

interface ExitingThread extends Thread {
  key: string;
}

interface Burst {
  key: number;
  x: number;
  y: number;
  color: string;
  delayed: boolean;
}

interface TileInfo {
  id: string;
  rect: DOMRect;
  anchor: Point;
}

/** Одна геометрия и для готовой нитки, и для временной. */
const buildThreadPath = (x1: number, y1: number, x2: number, y2: number): string => {
  const dx = Math.abs(x2 - x1);
  const bend = Math.max(18, Math.min(72, dx * 0.45));
  const direction = x2 >= x1 ? 1 : -1;

  return `M ${x1} ${y1} C ${x1 + direction * bend} ${y1}, ${
    x2 - direction * bend
  } ${y2}, ${x2} ${y2}`;
};

const anchorForRect = (rect: DOMRect, side: Side, base: DOMRect): Point => ({
  x: (side === 'left' ? rect.right - ANCHOR_INSET : rect.left + ANCHOR_INSET) - base.left,
  y: rect.top + rect.height / 2 - base.top,
});

const oppositeSide = (side: Side): Side => (side === 'left' ? 'right' : 'left');

/** Цвет блока-пары; тему (тёмная/светлая) CSS выбирает сам. */
const linkedTileStyle = (color: string): React.CSSProperties =>
  ({ '--tile-color': color }) as React.CSSProperties;

/**
 * Магнитная зона делится между плитками по серединам промежутков.
 * Поэтому соседние зоны точно касаются и никогда не перекрывают друг друга.
 */
const findSnapTarget = (
  container: HTMLElement,
  clientX: number,
  clientY: number,
  sourceSide: Side,
): SnapTarget | null => {
  const targetSide = oppositeSide(sourceSide);
  const selector = targetSide === 'right' ? '[data-tile-right]' : '[data-tile-left]';
  const base = container.getBoundingClientRect();

  const tiles = [...container.querySelectorAll<HTMLElement>(selector)]
    .map((element): TileInfo | null => {
      const id =
        targetSide === 'right' ? element.dataset.tileRight : element.dataset.tileLeft;
      if (!id) return null;
      const rect = element.getBoundingClientRect();
      return { id, rect, anchor: anchorForRect(rect, targetSide, base) };
    })
    .filter((tile): tile is TileInfo => tile !== null)
    .sort((left, right) => left.rect.top - right.rect.top);

  if (!tiles.length) return null;

  const zoneLeft = Math.min(...tiles.map(tile => tile.rect.left)) - SNAP_MARGIN_X;
  const zoneRight = Math.max(...tiles.map(tile => tile.rect.right)) + SNAP_MARGIN_X;
  if (clientX < zoneLeft || clientX > zoneRight) return null;

  for (let index = 0; index < tiles.length; index += 1) {
    const tile = tiles[index];
    const previous = tiles[index - 1];
    const next = tiles[index + 1];

    const zoneTop = previous
      ? (previous.rect.bottom + tile.rect.top) / 2
      : tile.rect.top - SNAP_MARGIN_Y;
    const zoneBottom = next
      ? (tile.rect.bottom + next.rect.top) / 2
      : tile.rect.bottom + SNAP_MARGIN_Y;

    if (clientY >= zoneTop && clientY <= zoneBottom) {
      return { id: tile.id, side: targetSide, ...tile.anchor };
    }
  }

  return null;
};

export const MatchingTaskView: React.FC<TaskViewProps<MatchingTask>> = ({
  task,
  step,
  total,
  headerRight,
  seed,
  onDone,
}) => {
  const [selected, setSelected] = useState<{ side: Side; id: string } | null>(null);
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

  const [animatedLinkId, setAnimatedLinkId] = useState<string | null>(null);
  const [exitingThreads, setExitingThreads] = useState<ExitingThread[]>([]);
  const [burst, setBurst] = useState<Burst | null>(null);
  const burstKeyRef = useRef(0);

  const topic = getTopic(task.topic);
  const section = getSectionByTopic(task.topic);

  const rightItems = useMemo(
    () => shuffleBySeed(task.pairs, `${seed ?? 'session'}:${task.id}`),
    [task, seed],
  );
  const allLinked = Object.keys(links).length === task.pairs.length;

  const colorFor = (leftId: string): string => {
    const index = task.pairs.findIndex(pair => pair.id === leftId);
    return THREAD_COLORS[(index < 0 ? 0 : index) % THREAD_COLORS.length];
  };

  const rightOwner = (rightId: string) =>
    Object.entries(links).find(([, linkedRight]) => linkedRight === rightId)?.[0];

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

      const left = anchorForRect(leftEl.getBoundingClientRect(), 'left', base);
      const right = anchorForRect(rightEl.getBoundingClientRect(), 'right', base);

      next.push({
        id: pair.id,
        x1: left.x,
        y1: left.y,
        x2: right.x,
        y2: right.y,
        color: colorFor(pair.id),
      });
    });

    setThreads(next);
  }, [links, task, measureTick]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => setMeasureTick(previous => previous + 1));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const resetCheck = () => {
    setChecked(false);
    setWrongIds([]);
  };

  const addExitingThread = (thread: Thread) => {
    const key = `${thread.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setExitingThreads(previous => [...previous, { ...thread, key }]);
    window.setTimeout(() => {
      setExitingThreads(previous => previous.filter(item => item.key !== key));
    }, EXIT_MS);
  };

  const applyLink = (
    leftId: string,
    rightId: string,
    method: 'drag' | 'tap',
    effectSide: Side,
  ) => {
    if (solved) return;

    const removedLeftIds = new Set<string>();
    for (const [linkedLeft, linkedRight] of Object.entries(links)) {
      if (linkedLeft === leftId || linkedRight === rightId) {
        removedLeftIds.add(linkedLeft);
      }
    }

    removedLeftIds.forEach(removedId => {
      const thread = threads.find(item => item.id === removedId);
      if (thread) addExitingThread(thread);
    });

    const nextLinks: Record<string, string> = {};
    for (const [linkedLeft, linkedRight] of Object.entries(links)) {
      if (linkedLeft !== leftId && linkedRight !== rightId) {
        nextLinks[linkedLeft] = linkedRight;
      }
    }
    nextLinks[leftId] = rightId;

    setLinks(nextLinks);
    setSelected(null);
    resetCheck();
    haptics.selection();

    if (method === 'tap') {
      setAnimatedLinkId(leftId);
      window.setTimeout(() => {
        setAnimatedLinkId(current => (current === leftId ? null : current));
      }, LINK_DRAW_MS);
    } else {
      setAnimatedLinkId(current => (current === leftId ? null : current));
    }

    const container = containerRef.current;
    if (!container) return;

    const effectTileId = effectSide === 'right' ? rightId : leftId;
    const effectElement = container.querySelector<HTMLElement>(
      effectSide === 'right'
        ? `[data-tile-right="${effectTileId}"]`
        : `[data-tile-left="${effectTileId}"]`,
    );
    if (!effectElement) return;

    const base = container.getBoundingClientRect();
    const anchor = anchorForRect(effectElement.getBoundingClientRect(), effectSide, base);
    const key = ++burstKeyRef.current;

    setBurst({
      key,
      x: anchor.x,
      y: anchor.y,
      color: colorFor(leftId),
      delayed: method === 'tap',
    });
    window.setTimeout(() => {
      setBurst(current => (current?.key === key ? null : current));
    }, BURST_MS);
  };

  const detachLink = (leftId: string) => {
    if (solved) return;

    const thread = threads.find(item => item.id === leftId);
    if (thread) addExitingThread(thread);

    setLinks(previous => {
      if (!(leftId in previous)) return previous;
      const next = { ...previous };
      delete next[leftId];
      return next;
    });
    setAnimatedLinkId(current => (current === leftId ? null : current));
    setSelected(null);
    resetCheck();
    haptics.selection();
  };

  const handleTapLeft = (id: string, fromPointer = false) => {
    if (!fromPointer && suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (solved) return;

    if (links[id]) {
      detachLink(id);
      return;
    }

    if (selected?.side === 'right') {
      applyLink(id, selected.id, 'tap', 'right');
      return;
    }

    resetCheck();
    haptics.selection();
    setSelected(previous =>
      previous?.side === 'left' && previous.id === id ? null : { side: 'left', id },
    );
  };

  const handleTapRight = (rightId: string, fromPointer = false) => {
    if (!fromPointer && suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (solved) return;

    const owner = rightOwner(rightId);
    if (owner) {
      detachLink(owner);
      return;
    }

    if (selected?.side === 'left') {
      applyLink(selected.id, rightId, 'tap', 'right');
      return;
    }

    resetCheck();
    haptics.selection();
    setSelected(previous =>
      previous?.side === 'right' && previous.id === rightId ? null : { side: 'right', id: rightId },
    );
  };

  const beginDrag = (event: React.PointerEvent, id: string, side: Side) => {
    if (solved || event.button > 0) return;

    const container = containerRef.current;
    if (!container) return;

    const element = event.currentTarget as HTMLElement;
    const base = container.getBoundingClientRect();
    const anchor = anchorForRect(element.getBoundingClientRect(), side, base);

    setDrag({
      id,
      side,
      pointerId: event.pointerId,
      originX: event.clientX,
      originY: event.clientY,
      sourceX: anchor.x,
      sourceY: anchor.y,
      x: anchor.x,
      y: anchor.y,
      active: false,
      snap: null,
    });

    try {
      element.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture не поддерживается — останется обычное поведение.
    }
  };

  const moveDrag = (event: React.PointerEvent) => {
    const current = dragRef.current;
    const container = containerRef.current;
    if (!current || !container) return;

    const moved =
      current.active ||
      Math.hypot(event.clientX - current.originX, event.clientY - current.originY) >
        DRAG_THRESHOLD;
    if (!moved) return;

    if (!current.active) {
      setSelected(null);
    }

    const base = container.getBoundingClientRect();
    const snap = findSnapTarget(container, event.clientX, event.clientY, current.side);

    setDrag({
      ...current,
      active: true,
      x: snap ? snap.x : event.clientX - base.left,
      y: snap ? snap.y : event.clientY - base.top,
      snap,
    });
  };

  const endDrag = (event: React.PointerEvent) => {
    const current = dragRef.current;
    if (!current) return;

    const container = containerRef.current;
    setDrag(null);

    if (!current.active) {
      // Обрабатываем тап на pointerup: клик по формулам внутри KaTeX
      // иногда не досылается браузером после pointer capture.
      if (current.side === 'left') {
        handleTapLeft(current.id, true);
      } else {
        handleTapRight(current.id, true);
      }
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 80);
      return;
    }

    suppressClickRef.current = true;
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 80);

    const snap =
      current.snap ??
      (container
        ? findSnapTarget(container, event.clientX, event.clientY, current.side)
        : null);

    if (!snap) return;

    if (current.side === 'left' && snap.side === 'right') {
      applyLink(current.id, snap.id, 'drag', 'right');
    } else if (current.side === 'right' && snap.side === 'left') {
      applyLink(snap.id, current.id, 'drag', 'left');
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
      playSound('correct');
      return;
    }

    setErrors(previous => previous + wrong.length);
    haptics.notification('error');
    playSound('wrong');
  };

  const draggingThreadId = drag
    ? drag.side === 'left'
      ? drag.id
      : rightOwner(drag.id)
    : null;

  const tempPath = drag
    ? drag.side === 'left'
      ? buildThreadPath(drag.sourceX, drag.sourceY, drag.x, drag.y)
      : buildThreadPath(drag.x, drag.y, drag.sourceX, drag.sourceY)
    : '';

  const renderDots = (thread: Thread, exiting = false) => (
    <>
      <circle
        cx={thread.x1}
        cy={thread.y1}
        r={HALO_RADIUS}
        fill={thread.color}
        className={`mg-thread__halo ${exiting ? 'mg-thread__halo--exit' : ''}`}
      />
      <circle
        cx={thread.x1}
        cy={thread.y1}
        r={DOT_RADIUS}
        fill={thread.color}
        className={`mg-thread__dot ${exiting ? 'mg-thread__dot--exit' : ''}`}
      />
      <circle
        cx={thread.x2}
        cy={thread.y2}
        r={HALO_RADIUS}
        fill={thread.color}
        className={`mg-thread__halo ${exiting ? 'mg-thread__halo--exit' : ''}`}
      />
      <circle
        cx={thread.x2}
        cy={thread.y2}
        r={DOT_RADIUS}
        fill={thread.color}
        className={`mg-thread__dot ${exiting ? 'mg-thread__dot--exit' : ''}`}
      />
    </>
  );

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
        <span className="mg-question__meta-text">{topic?.title}</span>
      </div>

      <p className="mg-question__prompt">
        <MathText text={task.prompt} />
      </p>
      <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-muted)' }}>
        Соедините пары: нажмите на две плитки или протяните нитку. Повторное нажатие
        на связанную плитку отвязывает её.
        {errors > 0 ? ` · ошибок: ${errors}` : ''}
      </p>

      <div className="mg-match" ref={containerRef}>
        <svg className="mg-match__threads" aria-hidden>
          {threads.map(thread => (
            <g
              key={thread.id}
              className={
                drag?.active && thread.id === draggingThreadId
                  ? 'mg-thread__group--dragging'
                  : undefined
              }
            >
              <path
                className={`mg-thread ${
                  animatedLinkId === thread.id ? 'mg-thread--draw' : ''
                }`}
                pathLength={1}
                d={buildThreadPath(thread.x1, thread.y1, thread.x2, thread.y2)}
                stroke={thread.color}
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
              />
              {renderDots(thread)}
            </g>
          ))}

          {exitingThreads.map(thread => (
            <g key={thread.key}>
              <path
                className="mg-thread mg-thread--exit"
                pathLength={1}
                d={buildThreadPath(thread.x1, thread.y1, thread.x2, thread.y2)}
                stroke={thread.color}
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
              />
              {renderDots(thread, true)}
            </g>
          ))}

          {drag?.active && (
            <g>
              <path
                className="mg-thread mg-thread--temp"
                d={tempPath}
                stroke={colorFor(drag.id)}
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
              />
              <circle
                cx={drag.side === 'left' ? drag.sourceX : drag.x}
                cy={drag.side === 'left' ? drag.sourceY : drag.y}
                r={HALO_RADIUS}
                fill={colorFor(drag.id)}
                className="mg-thread__halo"
              />
              <circle
                cx={drag.side === 'left' ? drag.sourceX : drag.x}
                cy={drag.side === 'left' ? drag.sourceY : drag.y}
                r={DOT_RADIUS}
                fill={colorFor(drag.id)}
                className="mg-thread__dot"
              />
              <circle
                cx={drag.side === 'left' ? drag.x : drag.sourceX}
                cy={drag.side === 'left' ? drag.y : drag.sourceY}
                r={HALO_RADIUS}
                fill={colorFor(drag.id)}
                className="mg-thread__halo"
              />
              <circle
                cx={drag.side === 'left' ? drag.x : drag.sourceX}
                cy={drag.side === 'left' ? drag.y : drag.sourceY}
                r={DOT_RADIUS}
                fill={colorFor(drag.id)}
                className="mg-thread__dot"
              />
            </g>
          )}

          {burst && (
            <circle
              key={burst.key}
              cx={burst.x}
              cy={burst.y}
              r={DOT_RADIUS}
              stroke={burst.color}
              strokeWidth={2}
              fill="none"
              className={`mg-thread__burst ${
                burst.delayed ? 'mg-thread__burst--delayed' : ''
              }`}
            />
          )}
        </svg>

        <div className="mg-match__col">
          {task.pairs.map(pair => {
            const linkedRightId = links[pair.id];
            const color = colorFor(pair.id);
            const isSelected = selected?.side === 'left' && selected.id === pair.id;
            const isSnapTarget = drag?.snap?.side === 'left' && drag.snap.id === pair.id;

            const className = [
              'mg-tile',
              'mg-tile--left',
              linkedRightId ? 'mg-tile--linked' : '',
              isSelected ? 'mg-tile--selected' : '',
              isSnapTarget ? 'mg-tile--snap' : '',
              checked
                ? links[pair.id] === pair.id
                  ? 'mg-tile--check-correct'
                  : 'mg-tile--check-wrong'
                : '',
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
                style={linkedRightId ? linkedTileStyle(color) : undefined}
                onPointerDown={event => beginDrag(event, pair.id, 'left')}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={() => setDrag(null)}
                onClick={() => handleTapLeft(pair.id)}
              >
                <MathText text={pair.left} />
              </Button>
            );
          })}
        </div>

        <div className="mg-match__col">
          {rightItems.map(pair => {
            const owner = rightOwner(pair.id);
            const color = owner ? colorFor(owner) : undefined;
            const isSelected = selected?.side === 'right' && selected.id === pair.id;
            const isSnapTarget = drag?.snap?.side === 'right' && drag.snap.id === pair.id;

            const className = [
              'mg-tile',
              'mg-tile--right',
              owner ? 'mg-tile--taken' : '',
              owner ? 'mg-tile--linked' : '',
              isSelected ? 'mg-tile--selected' : '',
              isSnapTarget ? 'mg-tile--snap' : '',
              checked
                ? owner === pair.id
                  ? 'mg-tile--check-correct'
                  : 'mg-tile--check-wrong'
                : '',
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
                style={owner && color ? linkedTileStyle(color) : undefined}
                onPointerDown={event => beginDrag(event, pair.id, 'right')}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={() => setDrag(null)}
                onClick={() => handleTapRight(pair.id)}
              >
                <MathText text={pair.right} />
              </Button>
            );
          })}
        </div>
      </div>
    </GameShell>
  );
};
