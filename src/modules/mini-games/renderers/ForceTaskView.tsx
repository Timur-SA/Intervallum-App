import React, { useState } from 'react';
import { Button, StatusBadge } from '@maxhub/max-ui';
import { ForceCanvas } from '../../force-lab/components/ForceCanvas';
import { ForceCatalogSheet } from '../../force-lab/components/ForceCatalogSheet';
import { ForceToolbar } from '../../force-lab/components/ForceToolbar';
import { ReviewModal } from '../../force-lab/components/ReviewModal';
import { referenceVectors, reviewComparisons, validatePlacement } from '../../force-lab/engine/validator';
import { DrawnVector, ForceType, ReviewEntry, ValidationResult } from '../../force-lab/types';
import { ForcesTask } from '../domain/types';
import { getSectionByTopic, getTopic } from '../domain/sections';
import { xpForScore } from '../engine/grading';
import { GradeResponse } from '../api/contracts';
import { haptics } from '../../../shared/motion/haptics';
import { GameShell } from '../components/GameShell';
import { TaskViewProps } from './taskView';

export const ForceTaskView: React.FC<TaskViewProps<ForcesTask>> = ({
  task,
  step,
  total,
  headerRight,
  onDone,
}) => {
  const forceTask = task.forceTask;
  const topic = getTopic(task.topic);
  const section = getSectionByTopic(task.topic);

  const [vectors, setVectors] = useState<DrawnVector[]>([]);
  const [selectedForce, setSelectedForce] = useState<ForceType | null>(null);
  const [activeVectorType, setActiveVectorType] = useState<ForceType | null>(null);
  const [history, setHistory] = useState<DrawnVector[][]>([]);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [passed, setPassed] = useState(false);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewQueue, setReviewQueue] = useState<ReviewEntry[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);

  const checkpoint = () => {
    setHistory(previous => [...previous.slice(-19), vectors.map(vector => ({ ...vector }))]);
  };

  const handleCommitVector = (newVector: DrawnVector) => {
    if (checked) return;
    checkpoint();
    setVectors(previous => [...previous.filter(vector => vector.type !== newVector.type), newVector]);
    setActiveVectorType(newVector.type);
    setSelectedForce(newVector.type);
  };

  const handleUndo = () => {
    if (!history.length || checked) return;
    haptics.impact('light');
    const previous = history[history.length - 1];
    setHistory(items => items.slice(0, -1));
    setVectors(previous);
    setActiveVectorType(null);
  };

  const handleDelete = () => {
    if (!activeVectorType || checked) return;
    haptics.impact('light');
    checkpoint();
    setVectors(previous => previous.filter(vector => vector.type !== activeVectorType));
    setActiveVectorType(null);
  };

  const buildGrade = (value: number): GradeResponse => ({
    outcome: value >= 1 ? 'correct' : value > 0 ? 'partial' : 'wrong',
    score: value,
    xpByTopic: value > 0 ? { [task.topic]: xpForScore(value, task.difficulty) } : {},
    correctAnswer: null,
  });

  const handleCheck = () => {
    if (checked) return;

    const result = validatePlacement(forceTask, vectors);
    setValidationResult(result);
    setPassed(result.passed);
    setActiveVectorType(null);
    setSelectedForce(null);
    setChecked(true);

    const attemptScore = result.passed
      ? 1
      : Math.max(0, 1 - result.badTypes.length / Math.max(1, forceTask.refs.length));
    setScore(attemptScore);

    if (result.passed) {
      haptics.notification('success');
    } else {
      haptics.notification('error');
      setReviewQueue(reviewComparisons(forceTask, vectors, result));
      setReviewIndex(0);
      setIsReviewOpen(true);
    }
  };

  const refsDrawn = validationResult ? referenceVectors(forceTask, vectors) : [];

  return (
    <>
      <GameShell
        title="Расстановка сил"
        step={step}
        total={total}
        headerRight={headerRight}
        footer={
          <>
            <Button
              variant="primary"
              size="large"
              stretched
              disabled={!checked && vectors.length === 0}
              onClick={() => {
                if (checked) onDone(buildGrade(score));
                else handleCheck();
              }}
            >
              {checked ? 'Продолжить' : 'Проверить'}
            </Button>
            {checked && !passed && (
              <Button
                variant="secondary"
                size="medium"
                stretched
                style={{ marginTop: 8 }}
                onClick={() => {
                  setChecked(false);
                  setValidationResult(null);
                }}
              >
                Проверить ещё раз
              </Button>
            )}
          </>
        }
      >
        <div className="mg-question__meta">
          <StatusBadge status="neutral" text={section ? section.title : 'Механика'} />
          <span className="mg-question__meta-text">
            {topic ? topic.title : ''} · {step + 1} из {total}
          </span>
        </div>

        <p className="mg-question__prompt">{forceTask.title}</p>
        <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)' }}>
          {forceTask.condition}
        </p>

        <div className="mg-force-canvas">
          <ForceCanvas
            task={forceTask}
            vectors={vectors}
            referenceVectors={refsDrawn}
            selectedForce={selectedForce}
            activeType={activeVectorType}
            errorTypes={validationResult?.badTypes || []}
            passed={passed}
            onSelectVector={type => {
              if (checked) return;
              setActiveVectorType(type);
              setSelectedForce(type);
            }}
            onCommitVector={handleCommitVector}
            onRequireSelectForce={() => setIsCatalogOpen(true)}
          />
        </div>

        <div
          className={`mg-force-feedback ${
            passed ? 'is-pass' : validationResult ? 'is-fail' : ''
          }`}
        >
          {passed ? (
            <strong>Отлично! Все точки приложения и направления верны.</strong>
          ) : validationResult ? (
            <span>Есть неточности. Можно исправить и проверить снова.</span>
          ) : selectedForce ? (
            <span>Коснитесь точки на теле и протяните стрелку силы</span>
          ) : (
            <span>Выберите силу в каталоге снизу</span>
          )}
        </div>

        <ForceToolbar
          selectedForce={selectedForce}
          activeVectorType={activeVectorType}
          canUndo={history.length > 0 && !checked}
          canDelete={Boolean(activeVectorType) && !checked}
          onOpenLibrary={() => setIsCatalogOpen(true)}
          onUndo={handleUndo}
          onDelete={handleDelete}
        />
      </GameShell>

      <ForceCatalogSheet
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        selectedForce={selectedForce}
        drawnVectorTypes={vectors.map(vector => vector.type)}
        onSelectForce={type => {
          setSelectedForce(type);
          setActiveVectorType(null);
        }}
      />

      <ReviewModal
        isOpen={isReviewOpen}
        task={forceTask}
        reviewQueue={reviewQueue}
        currentIndex={reviewIndex}
        onNext={() => {
          if (reviewIndex + 1 < reviewQueue.length) setReviewIndex(index => index + 1);
          else setIsReviewOpen(false);
        }}
        onClose={() => setIsReviewOpen(false)}
        illustrationSvg=""
      />
    </>
  );
};
