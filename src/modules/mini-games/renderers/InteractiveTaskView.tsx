import React, { useRef, useState } from 'react';
import { Button, StatusBadge } from '@maxhub/max-ui';
import {
  FormulaTrainerModule,
  FormulaTrainerHandle,
} from '../../formula-trainer/FormulaTrainerModule';
import { InteractiveTask } from '../domain/types';
import { getSectionByTopic, getTopic } from '../domain/sections';
import { xpForScore } from '../engine/grading';
import { GameShell } from '../components/GameShell';
import { FeedbackPanel } from '../components/FeedbackPanel';
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
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    score: number;
    answerLabel: string;
    correctLabel: string;
  } | null>(null);
  const topic = getTopic(task.topic);
  const section = getSectionByTopic(task.topic);

  return (
    <GameShell
      title="Формулы"
      step={step}
      total={total}
      headerRight={headerRight}
      bodyClassName="mg-game__body--flush"
      footer={
        feedback ? (
          <>
            <FeedbackPanel
              status={feedback.correct ? 'correct' : 'partial'}
              title={feedback.correct ? 'Верно!' : 'Не совсем'}
              explanation={
                feedback.correct
                  ? 'Ответ совпал с решением. Переходите дальше.'
                  : 'Правильный ответ указан ниже.'
              }
              correctAnswer={feedback.correct ? undefined : feedback.correctLabel}
            />
            <Button
              variant="primary"
              size="large"
              stretched
              style={{ marginTop: 12 }}
              onClick={() =>
                onDone({
                  outcome: feedback.correct ? 'correct' : 'partial',
                  score: feedback.score,
                  xpByTopic: {
                    [task.topic]: xpForScore(feedback.score, task.difficulty),
                  },
                  correctAnswer: null,
                })
              }
            >
              Далее
            </Button>
          </>
        ) : (
          <Button
            variant="primary"
            size="large"
            stretched
            onClick={() => solverRef.current?.check()}
          >
            Проверить
          </Button>
        )
      }
    >
      <div className="mg-interactive__meta">
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
          onEmbeddedChecked={setFeedback}
        />
      </div>
    </GameShell>
  );
};
