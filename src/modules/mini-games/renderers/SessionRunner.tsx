import React, { useEffect, useRef, useState } from 'react';
import { AnyTask } from '../domain/types';
import { GradeResponse } from '../api/contracts';
import { getSectionByTopic } from '../domain/sections';
import { recordTaskResult } from '../../../shared/storage/progressStore';
import { earnedStars } from '../engine/session';
import { SingleTaskView } from './SingleTaskView';
import { MultiTaskView } from './MultiTaskView';
import { MatchingTaskView } from './MatchingTaskView';
import { CardTaskView } from './CardTaskView';
import { sumXp } from './taskView';

export interface SessionSummary {
  tasks: number;
  /** Сумма долей верного ответа (может быть дробной). */
  correct: number;
  /** Сколько заданий решено полностью. */
  solved: number;
  score: number;
  xp: number;
  stars: number;
  bestStreak: number;
  timeout?: boolean;
}

interface SessionRunnerProps {
  tasks: AnyTask[];
  /** Начислять звёзды за новые и сложные задачи (только Тренировка). */
  awardStars?: boolean;
  /** Таймер дуэли; по нулю сессия завершается. */
  timerSeconds?: number;
  onComplete: (summary: SessionSummary) => void;
}

interface Accumulator {
  index: number;
  xp: number;
  correct: number;
  solved: number;
  stars: number;
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
  awardStars = false,
  timerSeconds,
  onComplete,
}) => {
  const [acc, setAcc] = useState<Accumulator>({
    index: 0,
    xp: 0,
    correct: 0,
    solved: 0,
    stars: 0,
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
      tasks: tasks.length,
      correct: current.correct,
      solved: current.solved,
      score: tasks.length ? current.correct / tasks.length : 0,
      xp: current.xp,
      stars: current.stars,
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
    // finish читает актуальные значения через ref
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerSeconds]);

  const task = tasks[acc.index];

  const handleDone = (grade: GradeResponse) => {
    if (!task) return;

    const gainedXp = sumXp(grade.xpByTopic);
    const earnedStar = earnedStars(task, grade.score, awardStars);
    const nextStreak = grade.score >= 1 ? acc.streak + 1 : 0;

    const next: Accumulator = {
      index: acc.index + 1,
      xp: acc.xp + gainedXp,
      correct: acc.correct + grade.score,
      solved: acc.solved + (grade.score >= 1 ? 1 : 0),
      stars: acc.stars + earnedStar,
      streak: nextStreak,
      bestStreak: Math.max(acc.bestStreak, nextStreak),
    };

    recordTaskResult({
      taskId: task.id,
      taskType: task.type,
      topicId: task.topic,
      sectionId: getSectionByTopic(task.topic)?.id ?? 'mechanics',
      xp: gainedXp,
      score: grade.score,
      stars: earnedStar,
    });

    accRef.current = next;
    setAcc(next);

    if (next.index >= tasks.length) {
      finish(false);
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
    step: acc.index,
    total: tasks.length,
    streak: acc.streak,
    headerRight,
    onDone: handleDone,
  };

  if (task.type === 'single') {
    return <SingleTaskView key={`${task.id}-${acc.index}`} task={task} {...viewProps} />;
  }

  if (task.type === 'multi') {
    return <MultiTaskView key={`${task.id}-${acc.index}`} task={task} {...viewProps} />;
  }

  if (task.type === 'matching') {
    return <MatchingTaskView key={`${task.id}-${acc.index}`} task={task} {...viewProps} />;
  }

  return <CardTaskView key={`${task.id}-${acc.index}`} task={task} {...viewProps} />;
};
