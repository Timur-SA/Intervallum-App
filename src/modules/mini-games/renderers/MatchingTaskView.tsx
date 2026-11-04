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

export const MatchingTaskView: React.FC<TaskViewProps<MatchingTask>> = ({
  task,
  step,
  total,
  headerRight,
  onDone,
}) => {
  const [leftSelected, setLeftSelected] = useState<string | null>(null);
  const [links, setLinks] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const [errors, setErrors] = useState(0);
  const [grade, setGrade] = useState<GradeResponse | null>(null);
  const [busy, setBusy] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [measureTick, setMeasureTick] = useState(0);

  const topic = getTopic(task.topic);
  const section = getSectionByTopic(task.topic);

  const rightItems = useMemo(() => shuffleBySeed(task.pairs, task.id), [task]);
  const allLinked = Object.keys(links).length === task.pairs.length;

  const colorFor = (leftId: string): string => {
    const index = task.pairs.findIndex(pair => pair.id === leftId);
    return THREAD_COLORS[(index < 0 ? 0 : index) % THREAD_COLORS.length];
  };

  // Нитки между парами: пересчитываем после каждого изменения связей.
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

  const handleCheck = async () => {
    if (!allLinked || busy) return;

    const wrong = task.pairs.filter(pair => links[pair.id] !== pair.id).map(pair => pair.id);

    setChecked(true);
    setWrongIds(wrong);

    // Оценка фиксируется по первой попытке — повторные исправления её не повышают.
    if (!grade) {
      setBusy(true);
      const result = await miniGamesApi.grade({
        taskId: task.id,
        answer: { type: 'matching', links },
      });
      setBusy(false);
      setGrade(result);
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
        Нажмите на элемент слева, затем на подходящий элемент справа
        {errors > 0 ? ` · ошибок: ${errors}` : ''}
      </p>

      <div className="mg-match" ref={containerRef}>
        <svg className="mg-match__threads" aria-hidden>
          {threads.map(thread => (
            <g key={thread.id}>
              <path
                d={`M ${thread.x1} ${thread.y1} C ${thread.x1 + 22} ${thread.y1}, ${
                  thread.x2 - 22
                } ${thread.y2}, ${thread.x2} ${thread.y2}`}
                stroke={thread.color}
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
              />
              <circle cx={thread.x1} cy={thread.y1} r={3.5} fill={thread.color} />
              <circle cx={thread.x2} cy={thread.y2} r={3.5} fill={thread.color} />
            </g>
          ))}
        </svg>

        <div className="mg-match__col">
          <div className="mg-match__col-title">Слева</div>
          {task.pairs.map(pair => {
            const linkedRightId = links[pair.id];
            const linkedRightText = linkedRightId
              ? task.pairs.find(item => item.id === linkedRightId)?.right
              : undefined;
            const color = colorFor(pair.id);

            const className = [
              'mg-tile',
              linkedRightId ? 'mg-tile--linked' : '',
              leftSelected === pair.id ? 'mg-tile--selected' : '',
              wrongIds.includes(pair.id) ? 'mg-tile--wrong' : '',
              solved && links[pair.id] === pair.id ? 'mg-tile--correct' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <Button
                key={pair.id}
                data-tile-left={pair.id}
                variant={leftSelected === pair.id ? 'primary' : 'secondary'}
                size="small"
                stretched
                className={className}
                innerClassNames={{ content: 'mg-tile__content' }}
                style={
                  linkedRightId && !wrongIds.includes(pair.id)
                    ? { boxShadow: `inset 0 0 0 1.5px ${color}` }
                    : undefined
                }
                onClick={() => handleLeft(pair.id)}
              >
                <span className="mg-tile__stack">
                  <span>{pair.left}</span>
                  {linkedRightText && (
                    <span className="mg-tile__link" style={{ color }}>
                      → {linkedRightText}
                    </span>
                  )}
                </span>
              </Button>
            );
          })}
        </div>

        <div className="mg-match__col">
          <div className="mg-match__col-title">Справа</div>
          {rightItems.map(pair => {
            const owner = rightOwner(pair.id);
            const color = owner ? colorFor(owner) : undefined;

            const className = [
              'mg-tile',
              owner ? 'mg-tile--taken' : '',
              owner && wrongIds.includes(owner) ? 'mg-tile--wrong' : '',
              solved && owner ? 'mg-tile--correct' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <Button
                key={pair.id}
                data-tile-right={pair.id}
                variant="secondary"
                size="small"
                stretched
                className={className}
                innerClassNames={{ content: 'mg-tile__content' }}
                style={
                  owner && !wrongIds.includes(owner)
                    ? { boxShadow: `inset 0 0 0 1.5px ${color}` }
                    : undefined
                }
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
