import React, { useState, useRef, useEffect, useLayoutEffect, forwardRef, useImperativeHandle } from 'react';
import { Typography, Button } from '@maxhub/max-ui';
import { BookOpen } from 'lucide-react';
import { PhysicsTask, FormulaCard, PhysicalLaw, ComputedResult } from './types/physics';
import { PHYSICS_TASKS } from './data/tasksDb';
import { TaskScreen } from './components/TaskScreen';
import { CollapsibleProblemPanel } from './components/CollapsibleProblemPanel';
import { FormulaCardItem, FormulaDropTarget } from './components/FormulaCardItem';
import { BottomSheetLaws } from './components/BottomSheetLaws';
import { VariablePopover } from './components/VariablePopover';
import { ResultModal } from './components/ResultModal';
import { CelebrationSparks } from '../../shared/components/CelebrationSparks';
import { haptics } from '../../shared/motion/haptics';
import { playSound } from '../../shared/audio/soundEffects';
import { hasSeenTaskGuide, loadUserProgress, markFormulaTaskCompleted, markTaskGuideSeen, saveUserProgress } from '../../shared/storage/progressStore';
import { MathText } from '../../shared/components/MathView';
import { getFormulaGuideStep, hasFormulaGuide } from './utils/formulaGuide';
import { useNavigation } from '../../shell/HeaderContext';
import {
  moveTokenInCard,
  swapSidesInCard,
  setVarValueInCard,
  clearVarValueInCard,
  recomputeCards,
} from './utils/algebra';
import './styles/index.css';

interface DragState {
  type: 'token' | 'given' | 'out' | null;
  cardId?: number;
  symbol?: string;
  fromSide?: 'left' | 'right';
  fromPos?: 'num' | 'den';
  fromIdx?: number;
  value?: number;
  unit?: string;
  label?: string;
  ghostPos?: { x: number; y: number } | null;
}

interface FormulaTrainerModuleProps {
  onBackToHub: () => void;
  /** Встроенный режим: одна задача внутри общего каркаса уровня. */
  embeddedTask?: PhysicsTask;
  autoShowGuide?: boolean;
  onEmbeddedDone?: (score: number) => void;
  onEmbeddedChecked?: (result: {
    correct: boolean;
    score: number;
    answerLabel: string;
    correctLabel: string;
  }) => void;
}

function getFormulaDropTarget(
  cardId: number,
  clientX: number,
  clientY: number
): FormulaDropTarget | null {
  const cardEl = document.querySelector(`.formula-card[data-card-id="${cardId}"]`);
  if (!cardEl) return null;

  const workspaceEl = cardEl.querySelector('.equation-workspace');
  if (!workspaceEl) return null;

  const wsRect = workspaceEl.getBoundingClientRect();
  // Allow a forgiving margin around the workspace (35px)
  if (
    clientX < wsRect.left - 35 ||
    clientX > wsRect.right + 35 ||
    clientY < wsRect.top - 35 ||
    clientY > wsRect.bottom + 35
  ) {
    return null;
  }

  // Determine left vs right side
  const equalsEl = workspaceEl.querySelector('.equation-equals-group');
  let side: 'left' | 'right' = 'left';
  if (equalsEl) {
    const eqRect = equalsEl.getBoundingClientRect();
    const eqMidX = (eqRect.left + eqRect.right) / 2;
    side = clientX < eqMidX ? 'left' : 'right';
  }

  const sideEl = workspaceEl.querySelector(`.equation-side-${side}`) as HTMLElement | null;
  if (!sideEl) return null;

  // Check if side has an existing fraction or is inline
  const fractionBarEl = sideEl.querySelector('.fraction-bar');
  let position: 'num' | 'den' = 'num';

  if (fractionBarEl) {
    const barRect = fractionBarEl.getBoundingClientRect();
    position = clientY < barRect.bottom ? 'num' : 'den';
  } else {
    // Inline row: check if pointer is below the row to create a fraction
    const rowEl = sideEl.querySelector('.equation-row');
    if (rowEl) {
      const rowRect = rowEl.getBoundingClientRect();
      if (clientY > rowRect.bottom - 4) {
        return { cardId, side, position: 'den', index: 0 };
      }
    }
    position = 'num';
  }

  // Find target row
  const rowSelector = position === 'num' ? '.num-row, .inline-row' : '.den-row';
  const targetRowEl = sideEl.querySelector(rowSelector);
  if (!targetRowEl) {
    return { cardId, side, position, index: 0 };
  }

  // Find all tokens in this row
  const tokenEls = Array.from(targetRowEl.querySelectorAll('.var-token')) as HTMLElement[];
  if (tokenEls.length === 0) {
    return { cardId, side, position, index: 0 };
  }

  // Find slot index based on clientX
  const firstRect = tokenEls[0].getBoundingClientRect();
  if (clientX < (firstRect.left + firstRect.right) / 2) {
    return { cardId, side, position, index: 0 };
  }

  for (let i = 0; i < tokenEls.length - 1; i++) {
    const rectA = tokenEls[i].getBoundingClientRect();
    const rectB = tokenEls[i + 1].getBoundingClientRect();
    const midX = (rectA.right + rectB.left) / 2;
    if (clientX < midX) {
      return { cardId, side, position, index: i + 1 };
    }
  }

  return { cardId, side, position, index: tokenEls.length };
}

export interface FormulaTrainerHandle {
  check: () => void;
}

export const FormulaTrainerModule = forwardRef<FormulaTrainerHandle, FormulaTrainerModuleProps>(
  ({ onBackToHub, embeddedTask, autoShowGuide, onEmbeddedDone, onEmbeddedChecked }, ref) => {
  const embedded = Boolean(embeddedTask);
  const [currentTask, setCurrentTask] = useState<PhysicsTask | null>(embeddedTask ?? null);
  const [answer, setAnswer] = useState<{ symbol: string; value: number; unit?: string } | null>(null);
  const [cards, setCards] = useState<FormulaCard[]>([]);
  const [cardCounter, setCardCounter] = useState(0);
  const tapeRef = useRef<HTMLDivElement>(null);
  const [guideOpen, setGuideOpen] = useState(() => {
    if (!embeddedTask || !autoShowGuide) return false;
    const progress = loadUserProgress();
    return !progress.formulaGuideDismissed &&
      !hasSeenTaskGuide(progress.practice, 'interactive') &&
      progress.formulaTrainer.completedTaskIds.length === 0;
  });

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    isSuccess: boolean;
    result: ComputedResult | null;
  }>({
    isOpen: false,
    isSuccess: false,
    result: null,
  });

  const [activePopover, setActivePopover] = useState<{
    cardId: number;
    symbol: string;
    rect: DOMRect;
  } | null>(null);

  const [dragState, setDragState] = useState<DragState>({ type: null });
  const [formulaDropTarget, setFormulaDropTarget] = useState<FormulaDropTarget | null>(null);
  const dropTargetRef = useRef<FormulaDropTarget | null>(null);
  const [hoveredCandidate, setHoveredCandidate] = useState<{ cardId: number; symbol: string } | null>(
    null
  );

  useEffect(() => {
    if (guideOpen && currentTask && hasFormulaGuide(currentTask)) markTaskGuideSeen('interactive');
  }, [currentTask, guideOpen]);

  useLayoutEffect(() => {
    const tape = tapeRef.current;
    if (guideOpen && cardCounter > 1 && tape) tape.scrollTop = tape.scrollHeight;
  }, [cardCounter, guideOpen]);

  const toggleGuide = () => {
    if (guideOpen) {
      const progress = loadUserProgress();
      progress.formulaGuideDismissed = true;
      saveUserProgress(progress);
    }
    setGuideOpen(!guideOpen);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast(null);
    }, 2800);
  };

  const handleSelectTask = (task: PhysicsTask) => {
    haptics.impact('light');
    setCurrentTask(task);
    setCards([]);
    setCardCounter(0);
    setSelectionMode(false);
    setActivePopover(null);
  };

  const handleAddLaw = (law: PhysicalLaw) => {
    haptics.impact('medium');
    const nextId = cardCounter + 1;
    setCardCounter(nextId);

    const values: Record<string, any> = {};
    for (const [sym, info] of Object.entries(law.variables)) {
      values[sym] = {
        value: null,
        source: null,
        ref: null,
        name: info.name,
        unit: info.unit,
      };
    }

    const newCard: FormulaCard = {
      id: nextId,
      law,
      structure: {
        left: { num: [...law.structure.left.num], den: [...law.structure.left.den] },
        right: { num: [...law.structure.right.num], den: [...law.structure.right.den] },
      },
      values,
      computed: null,
    };

    setCards(prev => recomputeCards([...prev, newCard]));
  };

  const handleRemoveCard = (cardId: number) => {
    haptics.impact('light');
    setCards(prev => recomputeCards(prev.filter(c => c.id !== cardId)));
  };

  const handleResetCard = (cardId: number) => {
    haptics.impact('light');
    setCards(prev =>
      recomputeCards(
        prev.map(c => {
          if (c.id !== cardId) return c;
          const freshValues: Record<string, any> = {};
          for (const [sym, info] of Object.entries(c.law.variables)) {
            freshValues[sym] = {
              value: null,
              source: null,
              ref: null,
              name: info.name,
              unit: info.unit,
            };
          }
          return {
            ...c,
            structure: {
              left: { num: [...c.law.structure.left.num], den: [...c.law.structure.left.den] },
              right: { num: [...c.law.structure.right.num], den: [...c.law.structure.right.den] },
            },
            values: freshValues,
            computed: null,
          };
        })
      )
    );
  };

  const handleSwapSides = (cardId: number) => {
    haptics.selection();
    setCards(prev => recomputeCards(prev.map(c => (c.id === cardId ? swapSidesInCard(c) : c))));
  };

  const handleClearValue = (cardId: number, symbol: string) => {
    haptics.impact('light');
    setCards(prev => recomputeCards(prev.map(c => (c.id === cardId ? clearVarValueInCard(c, symbol) : c))));
  };

  const handleSetValue = (
    cardId: number,
    symbol: string,
    val: number,
    source: 'given' | 'link' | 'manual',
    ref: { cardId: number; symbol: string } | null = null
  ) => {
    haptics.impact('medium');
    setCards(prev =>
      recomputeCards(prev.map(c => (c.id === cardId ? setVarValueInCard(c, symbol, val, source, ref) : c)))
    );
  };

  // Pointer drag for formula tokens
  const handlePointerDownToken = (
    e: React.PointerEvent,
    cardId: number,
    symbol: string,
    side: 'left' | 'right',
    position: 'num' | 'den',
    index: number
  ) => {
    if (e.button !== undefined && e.button !== 0) return;
    const startX = e.clientX;
    const startY = e.clientY;
    let isDragging = false;

    const onPointerMove = (me: PointerEvent) => {
      const dx = me.clientX - startX;
      const dy = me.clientY - startY;

      if (!isDragging && Math.hypot(dx, dy) > 5) {
        isDragging = true;
        haptics.selection();
        setDragState({
          type: 'token',
          cardId,
          symbol,
          fromSide: side,
          fromPos: position,
          fromIdx: index,
          ghostPos: { x: me.clientX, y: me.clientY },
        });
      }

      if (isDragging) {
        setDragState(prev => ({
          ...prev,
          ghostPos: { x: me.clientX, y: me.clientY },
        }));

        const newTarget = getFormulaDropTarget(cardId, me.clientX, me.clientY);
        const prevTarget = dropTargetRef.current;
        const changed =
          (!prevTarget && !!newTarget) ||
          (!!prevTarget && !newTarget) ||
          (!!prevTarget &&
            !!newTarget &&
            (prevTarget.cardId !== newTarget.cardId ||
              prevTarget.side !== newTarget.side ||
              prevTarget.position !== newTarget.position ||
              prevTarget.index !== newTarget.index));

        if (changed) {
          if (newTarget) {
            haptics.selection();
          }
          dropTargetRef.current = newTarget;
          setFormulaDropTarget(newTarget);
        }
      }
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      if (isDragging) {
        const target = dropTargetRef.current;
        dropTargetRef.current = null;
        setFormulaDropTarget(null);
        setDragState({ type: null });

        if (target && target.cardId === cardId) {
          haptics.impact('medium');
          setCards(prev =>
            recomputeCards(
              prev.map(c =>
                c.id === cardId
                  ? moveTokenInCard(c, side, position, index, target.side, target.position, target.index)
                  : c
              )
            )
          );
        }
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Pointer drag for Given pill
  const handlePointerDownGiven = (
    e: React.PointerEvent,
    symbol: string,
    value: number,
    unit: string
  ) => {
    if (e.button !== undefined && e.button !== 0) return;
    const startX = e.clientX;
    const startY = e.clientY;
    let isDragging = false;

    const onPointerMove = (me: PointerEvent) => {
      if (!isDragging && Math.hypot(me.clientX - startX, me.clientY - startY) > 5) {
        isDragging = true;
        haptics.selection();
        setDragState({
          type: 'given',
          symbol,
          value,
          unit,
          ghostPos: { x: me.clientX, y: me.clientY },
        });
      }

      if (isDragging) {
        setDragState(prev => ({ ...prev, ghostPos: { x: me.clientX, y: me.clientY } }));
        const elem = document.elementFromPoint(me.clientX, me.clientY);
        const targetToken = elem?.closest('.var-token') as HTMLElement | null;
        if (targetToken) {
          setHoveredCandidate({
            cardId: parseInt(targetToken.dataset.cardId || '-1'),
            symbol: targetToken.dataset.symbol || '',
          });
        } else {
          setHoveredCandidate(null);
        }
      }
    };

    const onPointerUp = (ue: PointerEvent) => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      if (isDragging) {
        let targetToken: HTMLElement | null = null;
        const elem = document.elementFromPoint(ue.clientX, ue.clientY);
        if (elem) targetToken = elem.closest('.var-token');

        setDragState({ type: null });
        setHoveredCandidate(null);


        if (targetToken) {
          const targetCardId = parseInt(targetToken.dataset.cardId || '-1');
          const targetSym = targetToken.dataset.symbol || '';
          if (targetCardId > 0 && targetSym) {
            handleSetValue(targetCardId, targetSym, value, 'given');
          }
        }
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Pointer drag for [Out] cell
  const handlePointerDownOut = (e: React.PointerEvent, card: FormulaCard) => {
    if (!card.computed) return;
    const startX = e.clientX;
    const startY = e.clientY;
    let isDragging = false;

    const onPointerMove = (me: PointerEvent) => {
      if (!isDragging && Math.hypot(me.clientX - startX, me.clientY - startY) > 5) {
        isDragging = true;
        haptics.selection();
        setDragState({
          type: 'out',
          cardId: card.id,
          symbol: card.computed!.symbol,
          value: card.computed!.value,
          ghostPos: { x: me.clientX, y: me.clientY },
        });
      }

      if (isDragging) {
        setDragState(prev => ({ ...prev, ghostPos: { x: me.clientX, y: me.clientY } }));
        const elem = document.elementFromPoint(me.clientX, me.clientY);
        const targetToken = elem?.closest('.var-token') as HTMLElement | null;
        if (targetToken) {
          const tCardId = parseInt(targetToken.dataset.cardId || '-1');
          if (tCardId !== card.id) {
            setHoveredCandidate({
              cardId: tCardId,
              symbol: targetToken.dataset.symbol || '',
            });
          }
        } else {
          setHoveredCandidate(null);
        }
      }
    };

    const onPointerUp = (ue: PointerEvent) => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      if (isDragging) {
        let targetToken: HTMLElement | null = null;
        const elem = document.elementFromPoint(ue.clientX, ue.clientY);
        if (elem) targetToken = elem.closest('.var-token');

        setDragState({ type: null });
        setHoveredCandidate(null);

        if (elem?.closest('.mg-answer-slot')) {
          setAnswer({
            symbol: card.computed!.symbol,
            value: card.computed!.value,
            unit: card.computed!.unit,
          });
          haptics.notification('success');
          return;
        }


        if (elem?.closest('.mg-answer-slot')) {
          setAnswer({
            symbol: card.computed!.symbol,
            value: card.computed!.value,
            unit: card.computed!.unit,
          });
          haptics.notification('success');
          return;
        }
        if (targetToken) {
          const targetCardId = parseInt(targetToken.dataset.cardId || '-1');
          const targetSym = targetToken.dataset.symbol || '';
          if (targetCardId > 0 && targetCardId !== card.id && targetSym) {
            handleSetValue(targetCardId, targetSym, card.computed!.value, 'link', {
              cardId: card.id,
              symbol: card.computed!.symbol,
            });
          }
        }
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handleCheckClick = () => {
    if (!answer || !currentTask) {
      showToast('Перетащите результат в слот ответа');
      return;
    }

    const expected = currentTask.find;
    const correct =
      answer.symbol === expected.symbol &&
      Math.abs(answer.value - expected.value) / Math.abs(expected.value || 1) < 0.02;
    const score = correct ? 1 : 0.5;

    if (embedded) {
      setGuideOpen(false);
      haptics.notification(correct ? 'success' : 'error');
      playSound(correct ? 'correct' : 'wrong');
      onEmbeddedChecked?.({
        correct,
        score,
        answerLabel: `${answer.symbol} = ${answer.value} ${answer.unit ?? ''}`.trim(),
        correctLabel: `$${expected.symbol} = ${String(expected.value).replace('.', '{,}')}$ ${expected.unit ?? ''}`.trim(),
      });
      return;
    }

    haptics.notification(correct ? 'success' : 'error');
    playSound(correct ? 'correct' : 'wrong');
    setModalState({
      isOpen: true,
      isSuccess: correct,
      result: { symbol: answer.symbol, value: answer.value, unit: answer.unit ?? '' },
    });
  };

  const handleSelectAnswerCard = (card: FormulaCard) => {
    setSelectionMode(false);
    if (!card.computed || !currentTask) return;

    const isSymbolMatch = card.computed.symbol === currentTask.find.symbol;
    const isValueMatch =
      Math.abs(card.computed.value - currentTask.find.value) / Math.abs(currentTask.find.value) < 0.02;

    const success = isSymbolMatch && isValueMatch;

    if (success) {
      haptics.notification('success');
      playSound('correct');
      setShowCelebration(true);
      markFormulaTaskCompleted(currentTask.id);
    } else {
      haptics.notification('error');
      playSound('wrong');
    }

    setModalState({
      isOpen: true,
      isSuccess: success,
      result: card.computed,
    });
  };

  const handleNextTask = () => {
    setModalState({ isOpen: false, isSuccess: false, result: null });
    const curIdx = PHYSICS_TASKS.findIndex(t => t.id === currentTask?.id);
    const next = PHYSICS_TASKS[(curIdx + 1) % PHYSICS_TASKS.length];
    handleSelectTask(next);
  };

  const { setNavigationConfig } = useNavigation();
  const guide = guideOpen && currentTask ? getFormulaGuideStep(currentTask, cards, answer) : null;
  const hasComputedResults = cards.some(c => c.computed && c.computed.value !== null);
  const showAnswerSlot = !guide || answer ||
    cards.some(card => card.computed?.symbol === currentTask?.find.symbol);

  useImperativeHandle(ref, () => ({ check: handleCheckClick }));

  // Inform host messenger BackButton
  useEffect(() => {
    if (embedded) return;
    if (!currentTask) {
      setNavigationConfig({ canGoBack: true, onBack: onBackToHub });
    } else {
      setNavigationConfig({ canGoBack: true, onBack: () => setCurrentTask(null) });
    }
  }, [currentTask, onBackToHub, setNavigationConfig, embedded]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        backgroundColor: 'var(--bg-app)',
      }}
    >
      <CelebrationSparks active={showCelebration} onDone={() => setShowCelebration(false)} />

      {!currentTask ? (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, minHeight: 0 }}>
          {/* Task List In-App Header */}
          <div className="inapp-header">
            <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
              Тренажёр формул
            </span>
            {loadUserProgress().formulaTrainer.stars > 0 && (
              <span style={{ fontSize: 13, fontWeight: 600, color: '#f59e0b' }}>
                ★ {loadUserProgress().formulaTrainer.stars}
              </span>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            <TaskScreen
              onSelectTask={handleSelectTask}
              completedTaskIds={loadUserProgress().formulaTrainer.completedTaskIds}
            />
          </div>
        </div>
      ) : (
        <div className={guide ? "app-screen-solver app-screen-solver--guided" : "app-screen-solver"} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {/* Solver In-App Header */}
          {!embedded && (
          <div className="inapp-header">
            <span
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
                minWidth: 0,
              }}
            >
              {currentTask.title}
            </span>

            <Button
              variant="primary"
              size="small"
              className={hasComputedResults ? 'ready-pulse' : ''}
              onClick={handleCheckClick}
            >
              Проверить
            </Button>
          </div>
          )}

          <CollapsibleProblemPanel
            task={currentTask}
            compact={Boolean(guide)}
            onPointerDownGiven={handlePointerDownGiven}
            guideControl={embedded && hasFormulaGuide(currentTask) && (
              <button
                type="button"
                className="formula-guide-toggle"
                aria-expanded={Boolean(guide)}
                aria-controls={guide ? 'mg-formula-guide' : undefined}
                onClick={toggleGuide}
              >
                <BookOpen size={14} aria-hidden="true" />
                {guide ? 'Свернуть помощь' : 'Как решать'}
              </button>
            )}
          />

          {guide && (
            <div id="mg-formula-guide" className="formula-guide" role="status">
              <strong>{guide.title}</strong>
              <MathText text={guide.text} />
            </div>
          )}

          {showAnswerSlot && (
            <div className="mg-answer-slot">
              <span className="mg-answer-slot__label">Ответ:</span>
              <div className={`mg-answer-slot__drop ${answer ? 'is-filled' : ''}`}>
                {answer ? (
                  <span className="given-chip mg-answer-slot__pill">
                    <b>{answer.symbol}</b> ={' '}
                    {Number.isInteger(answer.value)
                      ? answer.value
                      : parseFloat(answer.value.toFixed(3))}{' '}
                    {answer.unit}
                  </span>
                ) : (
                  <span className="mg-answer-slot__hint">Перетащите сюда величину</span>
                )}
              </div>
            </div>
          )}

          {selectionMode && (
            <div className="tape-prompt-bar visible">
              <span>
                🎯 <b>Выберите полученный ответ</b> (кликните на блок [Out] нужной формулы)
              </span>
              <button
                type="button"
                className="btn-cancel-select"
                onClick={() => setSelectionMode(false)}
              >
                ✕
              </button>
            </div>
          )}

          <div ref={tapeRef} className="formula-tape" style={{ flex: 1, overflowY: 'auto' }}>
            {cards.length === 0 ? (
              <div className="tape-placeholder">
                <div className="placeholder-icon">📐</div>
                <h3>Лента формул пуста</h3>
                <p>
                  Свайпните шторку снизу или нажмите кнопку, чтобы добавить физический закон в решение
                </p>
                <Button variant="primary" size="small" onClick={() => setIsSheetOpen(true)}>
                  + Добавить закон
                </Button>
              </div>
            ) : (
              cards.map(card => (
                <FormulaCardItem
                  key={card.id}
                  card={card}
                  isRearranging={dragState.type === 'token' && dragState.cardId === card.id}
                  dropTarget={
                    formulaDropTarget && formulaDropTarget.cardId === card.id
                      ? formulaDropTarget
                      : null
                  }
                  dragSource={
                    dragState.type === 'token' && dragState.cardId === card.id
                      ? {
                          cardId: card.id,
                          side: dragState.fromSide!,
                          position: dragState.fromPos!,
                          index: dragState.fromIdx!,
                          symbol: dragState.symbol!,
                        }
                      : null
                  }
                  activeCandidateCardId={hoveredCandidate?.cardId ?? null}
                  activeCandidateTokenSym={hoveredCandidate?.symbol ?? null}
                  selectionMode={selectionMode}
                  onSwapSides={handleSwapSides}
                  onResetCard={handleResetCard}
                  onRemoveCard={handleRemoveCard}
                  onPointerDownToken={handlePointerDownToken}
                  onClearValue={handleClearValue}
                  onClickToken={(cId, sym, anchorEl) => {
                    setActivePopover({
                      cardId: cId,
                      symbol: sym,
                      rect: anchorEl.getBoundingClientRect(),
                    });
                  }}
                  onPointerDownOut={handlePointerDownOut}
                  onSelectAnswerCard={handleSelectAnswerCard}
                />
              ))
            )}
          </div>

          <div className="sheet-dock-handle" onClick={() => setIsSheetOpen(true)}>
            <div className="handle-pill" />
            <div className="dock-content">
              <span className="dock-icon">📚</span>
              <span className="dock-label">Законы физики</span>
            </div>
          </div>

          <BottomSheetLaws
            isOpen={isSheetOpen}
            onClose={() => setIsSheetOpen(false)}
            onSelectLaw={handleAddLaw}
          />

          {activePopover && (
            <VariablePopover
              cardId={activePopover.cardId}
              symbol={activePopover.symbol}
              anchorRect={activePopover.rect}
              task={currentTask}
              allCards={cards}
              onSelectGiven={(cId, sym, val) => handleSetValue(cId, sym, val, 'given')}
              onSelectLink={(cId, sym, fId, fSym, val) =>
                handleSetValue(cId, sym, val, 'link', { cardId: fId, symbol: fSym })
              }
              onManualInput={(cId, sym, val) => handleSetValue(cId, sym, val, 'manual')}
              onClear={handleClearValue}
              onClose={() => setActivePopover(null)}
            />
          )}

          <ResultModal
            isOpen={modalState.isOpen}
            isSuccess={modalState.isSuccess}
            result={modalState.result}
            task={currentTask}
            onClose={() => setModalState({ isOpen: false, isSuccess: false, result: null })}
            onNextTask={handleNextTask}
            onToList={() => {
              setModalState({ isOpen: false, isSuccess: false, result: null });
              setCurrentTask(null);
            }}
          />
        </div>
      )}

      {/* Drag Ghost */}
      {dragState.ghostPos && (
        <div
          className={`drag-ghost ${
            dragState.type === 'out'
              ? 'out-ghost'
              : dragState.type === 'given'
              ? 'given-ghost'
              : ''
          }`}
          style={{
            left: `${dragState.ghostPos.x}px`,
            top: `${dragState.ghostPos.y}px`,
          }}
        >
          {dragState.type === 'token' && dragState.symbol}
          {dragState.type === 'given' && (
            <span>
              <b>{dragState.symbol}</b> = {dragState.value} {dragState.unit}
            </span>
          )}
          {dragState.type === 'out' && (
            <span>
              🔗 {dragState.symbol} = {dragState.value}
            </span>
          )}
        </div>
      )}

      {toast && <div className="max-toast show">{toast}</div>}
    </div>
  );
  },
);

FormulaTrainerModule.displayName = 'FormulaTrainerModule';
