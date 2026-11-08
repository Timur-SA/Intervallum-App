import React, { useEffect, useState } from 'react';
import { Button, StatusBadge } from '@maxhub/max-ui';
import { BookOpen } from 'lucide-react';
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
import { hasSeenTaskGuide, loadUserProgress, markTaskGuideSeen, saveUserProgress } from '../../../shared/storage/progressStore';
import { GameShell } from '../components/GameShell';
import { TaskViewProps } from './taskView';
import { getForceGuideStep } from './forceGuide';

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
  const [score, setScore] = useState(0);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewQueue, setReviewQueue] = useState<ReviewEntry[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [guideOpen, setGuideOpen] = useState(() => {
    const progress = loadUserProgress();
    return headerRight === undefined &&
      !progress.forceGuideDismissed &&
      !hasSeenTaskGuide(progress.practice, 'forces') &&
      progress.forceLab.completedTaskIds.length === 0;
  });

  useEffect(() => {
    if (guideOpen) markTaskGuideSeen('forces');
  }, [guideOpen]);

  const checked = validationResult !== null;
  const passed = validationResult?.passed ?? false;
  const guide = guideOpen ? getForceGuideStep(forceTask, vectors, selectedForce) : null;

  const toggleGuide = () => {
    if (guideOpen) {
      const progress = loadUserProgress();
      progress.forceGuideDismissed = true;
      saveUserProgress(progress);
    }
    setGuideOpen(!guideOpen);
  };

  const checkpoint = () => {
    setHistory(previous => [...previous.slice(-19), vectors.map(vector => ({ ...vector }))]);
  };

  const handleCommitVector = (newVector: DrawnVector) => {
    if (passed) return;
    checkpoint();
    setVectors(previous => [...previous.filter(vector => vector.type !== newVector.type), newVector]);
    setValidationResult(null);
    setActiveVectorType(newVector.type);
    setSelectedForce(newVector.type);
  };

  const handleUndo = () => {
    if (!history.length || passed) return;
    haptics.impact('light');
    const previous = history[history.length - 1];
    setHistory(items => items.slice(0, -1));
    setVectors(previous);
    setValidationResult(null);
    setActiveVectorType(null);
  };

  const handleDelete = () => {
    if (!activeVectorType || passed) return;
    haptics.impact('light');
    checkpoint();
    setVectors(previous => previous.filter(vector => vector.type !== activeVectorType));
    setValidationResult(null);
    setActiveVectorType(null);
  };

  const buildGrade = (value: number): GradeResponse => ({
    outcome: value >= 1 ? 'correct' : value > 0 ? 'partial' : 'wrong',
    score: value,
    xpByTopic: value > 0 ? { [task.topic]: xpForScore(value, task.difficulty) } : {},
    correctAnswer: null,
  });

  const handleCheck = () => {
    if (passed || !vectors.length) return;

    const result = validatePlacement(forceTask, vectors);
    setGuideOpen(false);
    setValidationResult(result);
    setActiveVectorType(null);

    const attemptScore = result.passed
      ? 1
      : Math.max(0, 1 - result.badTypes.length / Math.max(1, forceTask.refs.length));
    setScore(attemptScore);

    if (result.passed) {
      setSelectedForce(null);
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
        bodyClassName="mg-game__body--force"
        step={step}
        total={total}
        headerRight={headerRight}
        footer={
          <>
            <ForceToolbar
              selectedForce={selectedForce}
              canUndo={history.length > 0 && !passed}
              canDelete={Boolean(activeVectorType) && !passed}
              onOpenLibrary={() => {
                if (!passed) setIsCatalogOpen(true);
              }}
              onUndo={handleUndo}
              onDelete={handleDelete}
            />
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
          </>
        }
      >
        <div className={guide ? "mg-force-head mg-force-head--guided" : "mg-force-head"}>
          {!guide && (
            <div className="mg-question__meta">
              <StatusBadge status="neutral" text={section ? section.title : 'Механика'} />
              <span className="mg-question__meta-text">{topic?.title}</span>
            </div>
          )}

          <div className="mg-force-title-row">
            <p className="mg-question__prompt">{forceTask.title}</p>
            {!passed && (
              <button
                type="button"
                className="mg-force-guide-toggle"
                aria-expanded={guideOpen}
                aria-controls={guideOpen ? 'mg-force-guide' : undefined}
                onClick={toggleGuide}
              >
                <BookOpen size={14} aria-hidden="true" />
                {guideOpen ? 'Свернуть' : 'Как решать'}
              </button>
            )}
          </div>
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)' }}>
            {forceTask.condition}
          </p>
          {guide && (
            <div id="mg-force-guide" role="status" className="mg-force-feedback mg-force-guide">
              <strong>{guide.title}</strong>
              <span>{guide.instruction}</span>
            </div>
          )}
        </div>

        <div className="mg-force-canvas">
          <ForceCanvas
            task={forceTask}
            vectors={vectors}
            referenceVectors={refsDrawn}
            guideOrigin={guide?.origin}
            selectedForce={selectedForce}
            activeType={activeVectorType}
            errorTypes={validationResult?.badTypes || []}
            passed={passed}
            onSelectVector={type => {
              if (passed) return;
              setActiveVectorType(type);
              setSelectedForce(type);
            }}
            onCommitVector={handleCommitVector}
            onRequireSelectForce={() => setIsCatalogOpen(true)}
          />
        </div>

        {!guide && (
          <div
            role="status"
            className={`mg-force-feedback ${
              passed ? 'is-pass' : validationResult ? 'is-fail' : ''
            }`}
          >
            {passed ? (
              <strong>Отлично! Все точки приложения и направления верны.</strong>
            ) : validationResult ? (
              <span>Исправьте стрелки на схеме и проверьте снова.</span>
            ) : selectedForce ? (
              <span>Коснитесь точки на теле и протяните стрелку силы</span>
            ) : (
              <span>Выберите силу в каталоге снизу</span>
            )}
          </div>
        )}
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
