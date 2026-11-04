import React, { useRef } from 'react';
import { Button, StatusBadge } from '@maxhub/max-ui';
import {
  FormulaTrainerModule,
  FormulaTrainerHandle,
} from '../../formula-trainer/FormulaTrainerModule';
import { InteractiveTask } from '../domain/types';
import { getSectionByTopic, getTopic } from '../domain/sections';
import { xpForScore } from '../engine/grading';
import { GameShell } from '../components/GameShell';
import { TaskViewProps } from './taskView';

/**
 * Адаптер тренажёра формул под общий каркас уровня.
 * Всё взаимодействие с движком формул — только здесь.
 */
export const InteractiveTaskView: React.FC<TaskViewProps<InteractiveTask>> = ({
  task,
  step,
  total,
  headerRight,
  onDone,
}) => {
  const solverRef = useRef<FormulaTrainerHandle>(null);
  const topic = getTopic(task.topic);
  const section = getSectionByTopic(task.topic);

  return (
    <GameShell
      title="Формулы"
      step={step}
      total={total}
      headerRight={headerRight}
      footer={
        <Button
          variant="primary"
          size="large"
          stretched
          onClick={() => solverRef.current?.check()}
        >
          Проверить
        </Button>
      }
    >
      <div className="mg-question__meta">
        <StatusBadge status="neutral" text={section ? section.title : 'Физика'} />
        <span className="mg-question__meta-text">
          {topic ? topic.title : ''} · {step + 1} из {total}
        </span>
      </div>

      <div className="mg-interactive">
        <FormulaTrainerModule
          ref={solverRef}
          embeddedTask={task.physicsTask}
          onBackToHub={() => undefined}
          onEmbeddedDone={score => {
            onDone({
              outcome: score >= 1 ? 'correct' : 'partial',
              score,
              xpByTopic: score > 0 ? { [task.topic]: xpForScore(score, task.difficulty) } : {},
              correctAnswer: null,
            });
          }}
        />
      </div>
    </GameShell>
  );
};
