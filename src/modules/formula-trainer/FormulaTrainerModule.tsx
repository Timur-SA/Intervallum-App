import React, { useState, useRef, useEffect } from 'react';
import { Typography, Button } from '@maxhub/max-ui';
import { PhysicsTask, FormulaCard, PhysicalLaw, ComputedResult } from './types/physics';
import { PHYSICS_TASKS } from './data/tasksDb';
import { TaskScreen } from './components/TaskScreen';
import { CollapsibleProblemPanel } from './components/CollapsibleProblemPanel';
import { FormulaCardItem } from './components/FormulaCardItem';
import { BottomSheetLaws } from './components/BottomSheetLaws';
import { VariablePopover } from './components/VariablePopover';
import { ResultModal } from './components/ResultModal';
import { CelebrationSparks } from '../../shared/components/CelebrationSparks';
import { haptics } from '../../shared/motion/haptics';
import { markFormulaTaskCompleted } from '../../shared/storage/progressStore';
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
}

export const FormulaTrainerModule: React.FC<FormulaTrainerModuleProps> = ({ onBackToHub }) => {
  const [currentTask, setCurrentTask] = useState<PhysicsTask | null>(null);
  const [cards, setCards] = useState<FormulaCard[]>([]);
  const [cardCounter, setCardCounter] = useState(0);

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
  const [hoveredCandidate, setHoveredCandidate] = useState<{ cardId: number; symbol: string } | null>(
    null
  );

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

        const elem = document.elementFromPoint(me.clientX, me.clientY);
        document.querySelectorAll('.drop-zone.active-hover').forEach(z => z.classList.remove('active-hover'));
        if (elem) {
          const dropZone = elem.closest('.drop-zone');
          if (dropZone && parseInt((dropZone as HTMLElement).dataset.cardId || '-1') === cardId) {
            dropZone.classList.add('active-hover');
          }
        }
      }
    };

    const onPointerUp = (ue: PointerEvent) => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      if (isDragging) {
        let targetDropZone = document.querySelector('.drop-zone.active-hover');
        if (!targetDropZone) {
          const elem = document.elementFromPoint(ue.clientX, ue.clientY);
          if (elem) targetDropZone = elem.closest('.drop-zone');
        }

        document.querySelectorAll('.drop-zone.active-hover').forEach(z => z.classList.remove('active-hover'));
        setDragState({ type: null });

        if (targetDropZone && parseInt((targetDropZone as HTMLElement).dataset.cardId || '-1') === cardId) {
          haptics.impact('medium');
          const toSide = (targetDropZone as HTMLElement).dataset.side as 'left' | 'right';
          const toPos = (targetDropZone as HTMLElement).dataset.position as 'num' | 'den';
          const toIdx = parseInt((targetDropZone as HTMLElement).dataset.index || '0');

          setCards(prev =>
            recomputeCards(
              prev.map(c =>
                c.id === cardId ? moveTokenInCard(c, side, position, index, toSide, toPos, toIdx) : c
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
    if (cards.length === 0) {
      showToast('Сначала добавьте формулу из законов физики');
      setIsSheetOpen(true);
      return;
    }

    const computedList = cards.filter(c => c.computed && c.computed.value !== null);
    if (computedList.length === 0) {
      showToast('Выразите искомую величину и подставьте числовые значения в формулу');
      return;
    }

    haptics.selection();
    setSelectionMode(true);
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
      setShowCelebration(true);
      markFormulaTaskCompleted(currentTask.id);
    } else {
      haptics.notification('error');
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
  const hasComputedResults = cards.some(c => c.computed && c.computed.value !== null);

  // Inform host messenger BackButton
  useEffect(() => {
    if (!currentTask) {
      setNavigationConfig({ canGoBack: true, onBack: onBackToHub });
    } else {
      setNavigationConfig({ canGoBack: true, onBack: () => setCurrentTask(null) });
    }
  }, [currentTask, onBackToHub, setNavigationConfig]);

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
                Тренажёр формул
              </span>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            <TaskScreen onSelectTask={handleSelectTask} />
          </div>
        </div>
      ) : (
        <div className="app-screen-solver" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {/* Solver In-App Header */}
          <div className="inapp-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
              <button
                type="button"
                className="unified-header-btn"
                onClick={() => setCurrentTask(null)}
                aria-label="Назад к списку задач"
                title="Назад к списку задач"
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
              className={hasComputedResults ? 'ready-pulse' : ''}
              onClick={handleCheckClick}
            >
              Проверить
            </Button>
          </div>

          <CollapsibleProblemPanel task={currentTask} onPointerDownGiven={handlePointerDownGiven} />

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

          <div className="formula-tape" style={{ flex: 1, overflowY: 'auto' }}>
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
              <span className="dock-hint">(нажмите или свайпните вверх)</span>
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
};
