import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnyTask } from '../domain/types';
import { GradeResponse } from '../api/contracts';
import { getSectionByTopic } from '../domain/sections';
import { recordTaskResult } from '../../../shared/storage/progressStore';
import { CardTaskView } from './CardTaskView';
import { TASK_RENDERERS } from './registry';
import { sumXp } from './taskView';

export interface SessionSummary {
  tasks: number;
  correct: number;
  solved: number;
  score: number;
  xp: number;
  bestStreak: number;
  timeout?: boolean;
}

interface SessionRunnerProps {
  tasks: AnyTask[];
  timerSeconds?: number;
  seed?: string;
  onComplete: (summary: SessionSummary) => void;
}

interface Accumulator {
  index: number;
  xp: number;
  correct: number;
  solved: number;
  streak: number;
  bestStreak: number;
}

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
  });
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

  const handleDone = (grade: GradeResponse) => {
    if (!task) return;

    if (isCardsPhase) {
      const gainedXp = sumXp(grade.xpByTopic);

      recordTaskResult({
        taskId: task.id,
        taskType: task.type,
        topicId: task.topic,
        sectionId: getSectionByTopic(task.topic)?.id ?? 'mechanics',
        xp: gainedXp,
        score: grade.score,
      });

      const next: Accumulator = {
        ...acc,
        xp: acc.xp + gainedXp,
        correct: acc.correct + grade.score,
        solved: acc.solved + (grade.score >= 1 ? 1 : 0),
      };
      accRef.current = next;
      setAcc(next);

      const nextCard = cardIndex + 1;
      if (nextCard >= cards.length) {
        finish(false);
      } else {
        setCardIndex(nextCard);
      }
      return;
    }

    const gainedXp = sumXp(grade.xpByTopic);
    const nextStreak = grade.score >= 1 ? acc.streak + 1 : 0;

    recordTaskResult({
      taskId: task.id,
      taskType: task.type,
      topicId: task.topic,
      sectionId: getSectionByTopic(task.topic)?.id ?? 'mechanics',
      xp: gainedXp,
      score: grade.score,
    });

    const next: Accumulator = {
      index: acc.index + 1,
      xp: acc.xp + gainedXp,
      correct: acc.correct + grade.score,
      solved: acc.solved + (grade.score >= 1 ? 1 : 0),
      streak: nextStreak,
      bestStreak: Math.max(acc.bestStreak, nextStreak),
    };

    accRef.current = next;
    setAcc(next);

    if (next.index >= practice.length) {
      if (cards.length) {
        setPhase('cards');
      } else {
        finish(false);
      }
    }
  };

  if (!task) return null;

  const headerRight =
    timerSeconds !== undefined ? (
      <span className={`mg-timer ${remaining <= 60 ? 'mg-timer--low' : ''}`}>
        {formatTime(remaining)}
      </span>
    ) : undefined;

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
