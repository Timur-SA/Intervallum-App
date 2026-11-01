import React, { useState, useEffect } from 'react';
import { Button } from '@maxhub/max-ui';
import { FORCE_TASKS } from './data/tasks';
import { DrawnVector, ForceTask, ForceType, ReviewEntry, ValidationResult } from './types';
import { referenceVectors, reviewComparisons, validatePlacement } from './engine/validator';
import { ForceCanvas } from './components/ForceCanvas';
import { ForceCatalogSheet } from './components/ForceCatalogSheet';
import { ForceToolbar } from './components/ForceToolbar';
import { ForceTaskScreen } from './components/ForceTaskScreen';
import { ReviewModal } from './components/ReviewModal';
import { CelebrationSparks } from '../../shared/components/CelebrationSparks';
import { haptics } from '../../shared/motion/haptics';
import { loadUserProgress, markForceTaskCompleted } from '../../shared/storage/progressStore';
import { useNavigation } from '../../shell/HeaderContext';

interface ForceLabModuleProps {
  onBackToHub: () => void;
}

export const ForceLabModule: React.FC<ForceLabModuleProps> = ({ onBackToHub }) => {
  const [currentTask, setCurrentTask] = useState<ForceTask | null>(null);
  const [vectors, setVectors] = useState<DrawnVector[]>([]);
  const [selectedForce, setSelectedForce] = useState<ForceType | null>(null);
  const [activeVectorType, setActiveVectorType] = useState<ForceType | null>(null);
  const [history, setHistory] = useState<DrawnVector[][]>([]);

  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [passed, setPassed] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewQueue, setReviewQueue] = useState<ReviewEntry[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);

  const { setNavigationConfig } = useNavigation();

  // Inform host messenger BackButton
  useEffect(() => {
    if (!currentTask) {
      setNavigationConfig({ canGoBack: true, onBack: onBackToHub });
    } else {
      setNavigationConfig({ canGoBack: true, onBack: () => setCurrentTask(null) });
    }
  }, [currentTask, onBackToHub, setNavigationConfig]);

  // Restore saved vectors when entering a task
  useEffect(() => {
    if (!currentTask) return;
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
  }, [currentTask]);

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

  const handleSelectTask = (task: ForceTask) => {
    haptics.impact('light');
    setCurrentTask(task);
  };

  const handleCheck = () => {
    if (!currentTask) return;

    if (passed) {
      // Find index of current task and advance to next, or return to list
      const curIdx = FORCE_TASKS.findIndex(t => t.id === currentTask.id);
      if (curIdx >= 0 && curIdx < FORCE_TASKS.length - 1) {
        haptics.selection();
        setCurrentTask(FORCE_TASKS[curIdx + 1]);
      } else {
        // All completed, back to task list
        setCurrentTask(null);
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

  const refsDrawn = currentTask && validationResult ? referenceVectors(currentTask, vectors) : [];
  const progress = loadUserProgress();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-primary)',
      }}
    >
      <CelebrationSparks active={showCelebration} onDone={() => setShowCelebration(false)} />

      {!currentTask ? (
        /* Screen 1: Task Selection List (Identical to Formula Trainer) */
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, minHeight: 0 }}>
          <div className="inapp-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                className="unified-header-btn"
                onClick={onBackToHub}
                aria-label="В главное меню"
                title="В главное меню"
              >
                <span style={{ fontSize: 18, lineHeight: 1 }}>←</span>
              </button>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                Расстановка сил
              </span>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            <ForceTaskScreen
              onSelectTask={handleSelectTask}
              completedTaskIds={progress.forceLab.completedTaskIds}
            />
          </div>
        </div>
      ) : (
        /* Screen 2: Vector Drawing Canvas Workspace */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {/* In-App Header with Back button, Title & Check Button (Identical to Formula Trainer) */}
          <div className="inapp-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
              <button
                type="button"
                className="unified-header-btn"
                onClick={() => setCurrentTask(null)}
                aria-label="Назад к списку задач"
                title="Назад к списку"
              >
                <span style={{ fontSize: 18, lineHeight: 1 }}>←</span>
              </button>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {currentTask.title}
              </span>
            </div>

            <Button
              variant="primary"
              size="small"
              className={vectors.length > 0 ? 'ready-pulse' : ''}
              onClick={handleCheck}
            >
              {passed ? 'Далее →' : 'Проверить'}
            </Button>
          </div>

          {/* Task Heading & Condition */}
          <div
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--bg-card)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.35 }}>
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

          {/* Feedback bar */}
          <div
            style={{
              minHeight: 40,
              padding: '4px 16px',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: passed
                ? 'var(--success)'
                : validationResult
                ? 'var(--danger)'
                : 'var(--text-muted)',
              textAlign: 'center',
              backgroundColor: 'var(--bg-card)',
              borderTop: '1px solid var(--border)',
            }}
          >
            {passed ? (
              <strong>Отлично! Все точки приложения и направления верны.</strong>
            ) : validationResult ? (
              <span>Есть неточности. Нажмите «Проверить» для повторного анализа или разбора.</span>
            ) : selectedForce ? (
              <span>Коснитесь точки на теле и протяните стрелку силы</span>
            ) : (
              <span>Выберите силу в каталоге снизу</span>
            )}
          </div>

          {/* Bottom Toolbar: Catalog opener + Undo + Delete */}
          <ForceToolbar
            selectedForce={selectedForce}
            activeVectorType={activeVectorType}
            canUndo={history.length > 0 && !passed}
            canDelete={Boolean(activeVectorType) && !passed}
            onOpenLibrary={() => setIsCatalogOpen(true)}
            onUndo={handleUndo}
            onDelete={handleDelete}
          />

          {/* Catalog Bottom Sheet matching Formula Trainer laws catalog */}
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
      )}
    </div>
  );
};
