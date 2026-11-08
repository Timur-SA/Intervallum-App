import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnyTask } from '../domain/types';
import { GradeResponse } from '../api/contracts';
import { getSectionByTopic } from '../domain/sections';
import { Button } from '@maxhub/max-ui';
import { BookOpen } from 'lucide-react';
import { loadUserProgress, markTaskGuideSeen, recordTaskResult } from '../../../shared/storage/progressStore';
import { GameShell } from '../components/GameShell';
import { recordTrainingResult, type TopicXpChange } from '../domain/training';
import { CardTaskView } from './CardTaskView';
import { TASK_RENDERERS } from './registry';

export interface SessionSummary {
  tasks: number;
  correct: number;
  solved: number;
  score: number;
  xp: number;
  bestStreak: number;
  timeout?: boolean;
  topicChanges: TopicXpChange[];
}

interface SessionRunnerProps {
  tasks: AnyTask[];
  timerSeconds?: number;
  seed?: string;
  personalTraining?: boolean;
  onComplete: (summary: SessionSummary) => void;
}

interface Accumulator {
  index: number;
  xp: number;
  correct: number;
  solved: number;
  streak: number;
  bestStreak: number;
  topicChanges: TopicXpChange[];
}

const FORMAT_INTROS = {
  single: ['Один верный ответ', 'Прочитай условие, выбери один вариант и нажми «Проверить». После проверки появится объяснение.'],
  multi: ['Несколько верных ответов', 'Проверь каждое утверждение отдельно и отметь все верные. Лишний или пропущенный вариант снизит результат.'],
  matching: ['Соотнеси пары', 'Соедини каждый элемент слева с подходящим вариантом справа. Нажми на любой элемент пары, чтобы убрать связь.'],
  cards: ['Вспомни ответ', 'Сначала попробуй ответить по памяти. Открой ответ и смахни вправо, если вспомнил, или влево, если нужно повторить.'],
} as const;

const formatTime = (seconds: number): string => {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
};

export const SessionRunner: React.FC<SessionRunnerProps> = ({
  tasks,
  timerSeconds,
  seed,
  personalTraining = false,
  onComplete,
}) => {
  const practice = useMemo(() => tasks.filter(task => task.type !== 'cards'), [tasks]);
  const cards = useMemo(() => tasks.filter(task => task.type === 'cards'), [tasks]);
  const totalTasks = practice.length + cards.length;

  const [phase, setPhase] = useState<'practice' | 'cards'>(
    practice.length ? 'practice' : 'cards',
  );
  const [cardIndex, setCardIndex] = useState(0);
  const [acc, setAcc] = useState<Accumulator>({
    index: 0,
    xp: 0,
    correct: 0,
    solved: 0,
    streak: 0,
    bestStreak: 0,
    topicChanges: [],
  });
  const [seenFormats, setSeenFormats] = useState(() => {
    const progress = loadUserProgress().practice;
    return new Set([...progress.exploredTypes, ...(progress.introducedTypes ?? [])]);
  });
  const handled = useRef(new Set<number>());
  const [remaining, setRemaining] = useState(timerSeconds ?? 0);

  const accRef = useRef(acc);
  accRef.current = acc;

  const finishedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const finish = (timeout: boolean) => {
    if (finishedRef.current) return;
    finishedRef.current = true;

    const current = accRef.current;
    onCompleteRef.current({
      tasks: totalTasks,
      correct: current.correct,
      solved: current.solved,
      score: totalTasks ? current.correct / totalTasks : 0,
      xp: current.xp,
      bestStreak: current.bestStreak,
      timeout,
      topicChanges: current.topicChanges,
    });
  };

  useEffect(() => {
    if (!timerSeconds) return;

    const id = window.setInterval(() => {
      setRemaining(previous => {
        if (previous <= 1) {
          window.clearInterval(id);
          finish(true);
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerSeconds]);

  const isCardsPhase = phase === 'cards';
  const task = isCardsPhase ? cards[cardIndex] : practice[acc.index];

  const taskIndex = isCardsPhase ? practice.length + cardIndex : acc.index;
  const intro = personalTraining && task && !seenFormats.has(task.type) && task.type in FORMAT_INTROS
    ? FORMAT_INTROS[task.type as keyof typeof FORMAT_INTROS]
    : null;

  useEffect(() => {
    if (intro && task) markTaskGuideSeen(task.type);
  }, [intro, task]);

  const handleDone = (grade: GradeResponse) => {
    if (!task || finishedRef.current || handled.current.has(taskIndex)) return;
    handled.current.add(taskIndex);

    let gainedXp = 0;
    let topicChanges = acc.topicChanges;
    if (personalTraining) {
      const change = recordTrainingResult(task, grade.score);
      gainedXp = change.after - change.before;
      const prior = topicChanges.find(item => item.topicId === task.topic);
      topicChanges = prior
        ? topicChanges.map(item => item === prior ? { ...item, after: change.after } : item)
        : [...topicChanges, change];
    } else {
      recordTaskResult({
        taskId: task.id,
        taskType: task.type,
        topicId: task.topic,
        sectionId: getSectionByTopic(task.topic)?.id ?? 'mechanics',
        xp: 0,
        score: grade.score,
      });
    }

    const nextStreak = isCardsPhase ? acc.streak : grade.score >= 1 ? acc.streak + 1 : 0;
    const next: Accumulator = {
      index: isCardsPhase ? acc.index : acc.index + 1,
      xp: acc.xp + gainedXp,
      correct: acc.correct + grade.score,
      solved: acc.solved + (grade.score >= 1 ? 1 : 0),
      streak: nextStreak,
      bestStreak: Math.max(acc.bestStreak, nextStreak),
      topicChanges,
    };
    accRef.current = next;
    setAcc(next);

    if (isCardsPhase) {
      if (cardIndex + 1 === cards.length) finish(false);
      else setCardIndex(cardIndex + 1);
    } else if (next.index === practice.length) {
      if (cards.length) setPhase('cards');
      else finish(false);
    }
  };

  if (!task) return null;

  const headerRight =
    timerSeconds !== undefined ? (
      <span className={`mg-timer ${remaining <= 60 ? 'mg-timer--low' : ''}`}>
        {formatTime(remaining)}
      </span>
    ) : undefined;

  if (intro) {
    return (
      <GameShell
        title="Новый формат"
        step={taskIndex}
        total={totalTasks}
        footer={
          <Button
            variant="primary"
            size="large"
            stretched
            onClick={() => setSeenFormats(previous => new Set([...previous, task.type]))}
          >
            К заданию
          </Button>
        }
      >
        <div className="mg-format-intro">
          <BookOpen size={22} aria-hidden="true" />
          <h2>{intro[0]}</h2>
          <p>{intro[1]}</p>
        </div>
      </GameShell>
    );
  }

  const viewProps = {
    streak: acc.streak,
    headerRight,
    seed: seed ?? 'session',
    onDone: handleDone,
  };

  if (isCardsPhase && task.type === 'cards') {
    return (
      <CardTaskView
        key={`${task.id}-card-${cardIndex}`}
        task={task}
        step={practice.length + cardIndex}
        total={totalTasks}
        cardIndex={cardIndex}
        cardTotal={cards.length}
        {...viewProps}
      />
    );
  }

  const Renderer = TASK_RENDERERS[task.type];
  if (Renderer) {
    return (
      <Renderer
        key={`${task.id}-${acc.index}`}
        task={task as never}
        step={acc.index}
        total={totalTasks}
        {...viewProps}
      />
    );
  }

  if (task.type === 'cards') {
    return (
      <CardTaskView
        key={`${task.id}-${acc.index}`}
        task={task}
        step={practice.length + acc.index}
        total={totalTasks}
        cardIndex={acc.index}
        cardTotal={cards.length}
        {...viewProps}
      />
    );
  }

  return null;
};
