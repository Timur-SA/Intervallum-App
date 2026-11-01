import React, { useState, useEffect } from 'react';
import { FORCE_TASKS } from './data/tasks';
import { DrawnVector, ForceType, ReviewEntry, ValidationResult } from './types';
import { referenceVectors, reviewComparisons, validatePlacement } from './engine/validator';
import { ForceCanvas } from './components/ForceCanvas';
import { ForceCatalogSheet } from './components/ForceCatalogSheet';
import { ForceToolbar } from './components/ForceToolbar';
import { ReviewModal } from './components/ReviewModal';
import { CelebrationSparks } from '../../shared/components/CelebrationSparks';
import { haptics } from '../../shared/motion/haptics';
import { loadUserProgress, markForceTaskCompleted } from '../../shared/storage/progressStore';

interface ForceLabModuleProps {
  onBackToHub: () => void;
}

export const ForceLabModule: React.FC<ForceLabModuleProps> = ({ onBackToHub }) => {
  const [taskIndex, setTaskIndex] = useState(0);
  const [vectors, setVectors] = useState<DrawnVector[]>([]);
  const [selectedForce, setSelectedForce] = useState<ForceType | null>(null);
  const [activeVectorType, setActiveVectorType] = useState<ForceType | null>(null);
  const [history, setHistory] = useState<DrawnVector[][]>([]);

  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [passed, setPassed] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewQueue, setReviewQueue] = useState<ReviewEntry[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);

  const currentTask = FORCE_TASKS[taskIndex];

  // Restore saved vectors from store if previously saved
  useEffect(() => {
    const progress = loadUserProgress();
    const saved = progress.forceLab.savedVectors[currentTask.id];
    if (saved && saved.length > 0) {
      setVectors(saved as DrawnVector[]);
    } else {
      setVectors([]);
    }
    setHistory([]);
    setSelectedForce(null);
    setActiveVectorType(null);
    setValidationResult(null);
    setPassed(false);
  }, [taskIndex, currentTask.id]);

  const checkpoint = () => {
    setHistory(prev => [...prev.slice(-19), vectors.map(v => ({ ...v }))]);
  };

  const handleCommitVector = (newVector: DrawnVector) => {
    checkpoint();
    setVectors(prev => [...prev.filter(v => v.type !== newVector.type), newVector]);
    setActiveVectorType(newVector.type);
    setSelectedForce(newVector.type);
    setValidationResult(null);
    setPassed(false);
  };

  const handleUndo = () => {
    if (!history.length || passed) return;
    haptics.impact('light');
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setVectors(prev);
    setActiveVectorType(null);
    setValidationResult(null);
    setPassed(false);
  };

  const handleDelete = () => {
    if (!activeVectorType || passed) return;
    haptics.impact('light');
    checkpoint();
    setVectors(prev => prev.filter(v => v.type !== activeVectorType));
    setActiveVectorType(null);
    setValidationResult(null);
    setPassed(false);
  };

  const handleCheck = () => {
    if (completed) {
      setTaskIndex(0);
      setCompleted(false);
      setPassed(false);
      setValidationResult(null);
      setVectors([]);
      return;
    }

    if (passed) {
      if (taskIndex < FORCE_TASKS.length - 1) {
        haptics.selection();
        setTaskIndex(i => i + 1);
      } else {
        setCompleted(true);
        setShowCelebration(true);
        haptics.notification('success');
      }
      return;
    }

    const result = validatePlacement(currentTask, vectors);
    setValidationResult(result);
    setPassed(result.passed);
    setActiveVectorType(null);
    setSelectedForce(null);

    if (result.passed) {
      haptics.notification('success');
      setShowCelebration(true);
      markForceTaskCompleted(currentTask.id, vectors);
    } else {
      haptics.notification('error');
      const queue = reviewComparisons(currentTask, vectors, result);
      setReviewQueue(queue);
      setReviewIndex(0);
      setIsReviewOpen(true);
    }
  };

  const refsDrawn = validationResult ? referenceVectors(currentTask, vectors) : [];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        backgroundColor: 'var(--fl-paper)',
        color: 'var(--fl-ink)',
      }}
    >
      <CelebrationSparks active={showCelebration} onDone={() => setShowCelebration(false)} />

      {/* Top Header */}
      <div
        style={{
          padding: '12px 18px 8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fl-accent)' }}>
          Расстановка сил
        </span>
        <span style={{ fontSize: 12, color: 'var(--fl-soft)' }}>
          Задача {taskIndex + 1} из {FORCE_TASKS.length}
        </span>
      </div>

      {/* Task Heading & Condition */}
      <div style={{ padding: '0 18px 6px' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 600, letterSpacing: -0.4 }}>
          {currentTask.title}
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--fl-soft)', lineHeight: 1.35 }}>
          {currentTask.condition}
        </p>
      </div>

      {/* SVG Canvas Scene */}
      <ForceCanvas
        task={currentTask}
        vectors={vectors}
        referenceVectors={refsDrawn}
        selectedForce={selectedForce}
        activeType={activeVectorType}
        errorTypes={validationResult?.badTypes || []}
        passed={passed}
        onSelectVector={type => {
          setActiveVectorType(type);
          setSelectedForce(type);
        }}
        onCommitVector={handleCommitVector}
        onRequireSelectForce={() => setIsCatalogOpen(true)}
      />

      {/* Feedback slot (keeps layout stable) */}
      <div
        style={{
          minHeight: 52,
          padding: '4px 18px',
          fontSize: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: passed
            ? 'var(--fl-pass)'
            : validationResult
            ? 'var(--fl-error)'
            : 'var(--fl-soft)',
          textAlign: 'center',
        }}
      >
        {passed ? (
          <strong>Отлично! Все точки приложения, направления и пропорции верны.</strong>
        ) : validationResult ? (
          <span>Есть неточности. Нажми кнопку ниже для повторной проверки или открой разбор.</span>
        ) : selectedForce ? (
          <span>Коснись точки на теле и протяни стрелку силы</span>
        ) : (
          <span>Выбери силу в библиотеке снизу</span>
        )}
      </div>

      {/* Bottom Toolbar */}
      <ForceToolbar
        selectedForce={selectedForce}
        activeVectorType={activeVectorType}
        canUndo={history.length > 0}
        canDelete={Boolean(activeVectorType)}
        passed={passed}
        completed={completed}
        onOpenLibrary={() => setIsCatalogOpen(true)}
        onUndo={handleUndo}
        onDelete={handleDelete}
        onCheck={handleCheck}
      />

      {/* Catalog Bottom Sheet */}
      <ForceCatalogSheet
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        selectedForce={selectedForce}
        drawnVectorTypes={vectors.map(v => v.type)}
        onSelectForce={type => {
          setSelectedForce(type);
          setActiveVectorType(null);
        }}
      />

      {/* Per-vector Review Modal */}
      <ReviewModal
        isOpen={isReviewOpen}
        task={currentTask}
        reviewQueue={reviewQueue}
        currentIndex={reviewIndex}
        onNext={() => {
          if (reviewIndex + 1 < reviewQueue.length) {
            setReviewIndex(i => i + 1);
          } else {
            setIsReviewOpen(false);
          }
        }}
        onClose={() => setIsReviewOpen(false)}
        illustrationSvg=""
      />
    </div>
  );
};
