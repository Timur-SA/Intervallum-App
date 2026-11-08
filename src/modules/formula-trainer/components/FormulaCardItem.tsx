import React from 'react';
import { FormulaCard } from '../types/physics';
import { VariableToken } from './VariableToken';

export interface FormulaDropTarget {
  cardId: number;
  side: 'left' | 'right';
  position: 'num' | 'den';
  index: number;
}

export interface FormulaDragSource {
  cardId: number;
  side: 'left' | 'right';
  position: 'num' | 'den';
  index: number;
  symbol: string;
}

interface FormulaCardItemProps {
  card: FormulaCard;
  isRearranging: boolean;
  dropTarget: FormulaDropTarget | null;
  dragSource: FormulaDragSource | null;
  activeCandidateTokenSym: string | null;
  activeCandidateCardId: number | null;
  selectionMode: boolean;
  onSwapSides: (cardId: number) => void;
  onResetCard: (cardId: number) => void;
  onRemoveCard: (cardId: number) => void;
  onPointerDownToken: (
    e: React.PointerEvent,
    cardId: number,
    symbol: string,
    side: 'left' | 'right',
    position: 'num' | 'den',
    index: number
  ) => void;
  onClearValue: (cardId: number, symbol: string) => void;
  onClickToken: (cardId: number, symbol: string, anchorEl: HTMLElement) => void;
  onPointerDownOut: (e: React.PointerEvent, card: FormulaCard) => void;
  onSelectAnswerCard: (card: FormulaCard) => void;
}

export const FormulaCardItem: React.FC<FormulaCardItemProps> = ({
  card,
  isRearranging,
  dropTarget,
  dragSource,
  activeCandidateTokenSym,
  activeCandidateCardId,
  selectionMode,
  onSwapSides,
  onResetCard,
  onRemoveCard,
  onPointerDownToken,
  onClearValue,
  onClickToken,
  onPointerDownOut,
  onSelectAnswerCard
}) => {
  const isTargetForThisCard = dropTarget !== null && dropTarget.cardId === card.id;

  const renderTokenRow = (
    tokens: string[],
    side: 'left' | 'right',
    position: 'num' | 'den',
    hasDen: boolean,
    isTargetRow: boolean,
    targetIndex: number
  ) => {
    const rowClass = `equation-row ${position === 'num' ? (hasDen ? 'num-row' : 'inline-row') : 'den-row'}`;

    if (tokens.length === 0) {
      if (isTargetRow) {
        return (
          <div className={rowClass}>
            <div className="formula-insertion-cursor" />
          </div>
        );
      }
      return (
        <div className={rowClass}>
          <span className={position === 'den' ? 'empty-side-indicator' : 'math-const'}>1</span>
        </div>
      );
    }

    return (
      <div className={rowClass}>
        {tokens.map((sym, idx) => {
          const isSource = Boolean(
            dragSource &&
            dragSource.cardId === card.id &&
            dragSource.side === side &&
            dragSource.position === position &&
            dragSource.index === idx
          );

          return (
            <React.Fragment key={`${sym}-${idx}`}>
              {/* Insert cursor before this token if targeted at start */}
              {idx === 0 && isTargetRow && targetIndex === 0 && (
                <>
                  <div className="formula-insertion-cursor" />
                  <span className="math-operator">·</span>
                </>
              )}

              {/* Insert cursor between previous and current token */}
              {idx > 0 && isTargetRow && targetIndex === idx && (
                <>
                  <span className="math-operator">·</span>
                  <div className="formula-insertion-cursor" />
                  <span className="math-operator">·</span>
                </>
              )}

              {/* Normal multiplication dot */}
              {idx > 0 && !(isTargetRow && targetIndex === idx) && (
                <span className="math-operator">·</span>
              )}

              <VariableToken
                cardId={card.id}
                symbol={sym}
                side={side}
                position={position}
                index={idx}
                valData={card.values[sym]}
                isDraggingSource={isSource}
                isDropCandidate={
                  activeCandidateCardId === card.id && activeCandidateTokenSym === sym
                }
                onPointerDownToken={onPointerDownToken}
                onClearValue={onClearValue}
                onClickToken={onClickToken}
              />
            </React.Fragment>
          );
        })}

        {/* Insert cursor at the end of the row */}
        {isTargetRow && targetIndex >= tokens.length && (
          <>
            <span className="math-operator">·</span>
            <div className="formula-insertion-cursor" />
          </>
        )}
      </div>
    );
  };

  const renderSide = (side: 'left' | 'right') => {
    const sideData = card.structure[side];
    const hasDen = sideData.den.length > 0;
    const isTargetSide = isTargetForThisCard && dropTarget.side === side;
    const isPreviewFraction = !hasDen && isTargetSide && dropTarget.position === 'den';

    if (isPreviewFraction) {
      return (
        <div
          className={`equation-side equation-side-${side} side-preview-fraction`}
          data-card-id={card.id}
          data-side={side}
        >
          <div className="equation-fraction">
            {renderTokenRow(sideData.num, side, 'num', true, false, -1)}
            <div className="fraction-bar fraction-bar--preview" />
            <div className="equation-row den-row den-row--preview">
              <div className="formula-insertion-cursor" />
            </div>
          </div>
        </div>
      );
    }

    if (!hasDen) {
      return (
        <div
          className={`equation-side equation-side-${side}`}
          data-card-id={card.id}
          data-side={side}
        >
          {renderTokenRow(
            sideData.num,
            side,
            'num',
            false,
            isTargetSide && dropTarget.position === 'num',
            dropTarget?.index ?? -1
          )}
        </div>
      );
    }

    return (
      <div
        className={`equation-side equation-side-${side}`}
        data-card-id={card.id}
        data-side={side}
      >
        <div className="equation-fraction">
          {renderTokenRow(
            sideData.num,
            side,
            'num',
            true,
            isTargetSide && dropTarget.position === 'num',
            dropTarget?.index ?? -1
          )}
          <div className="fraction-bar" />
          {renderTokenRow(
            sideData.den,
            side,
            'den',
            true,
            isTargetSide && dropTarget.position === 'den',
            dropTarget?.index ?? -1
          )}
        </div>
      </div>
    );
  };

  const renderOutCell = () => {
    if (card.computed) {
      const formatted = Number.isInteger(card.computed.value)
        ? card.computed.value
        : parseFloat(card.computed.value.toFixed(3));

      return (
        <div className="card-out-cell out-success">
          <div className="out-badge">
            <span className="out-tag">Результат:</span>
            <span
              className="given-chip out-pill"
              title="Перетащите результат в слот ответа"
              onPointerDown={(e) => onPointerDownOut(e, card)}
            >
              <b>{card.computed.symbol}</b> = {formatted} {card.computed.unit}
            </span>
          </div>
        </div>
      );
    }

    // Проверяем, почему нет расчета
    const left = card.structure.left;
    const right = card.structure.right;

    const isLeftIsolated = left.num.length === 1 && left.den.length === 0;
    const isRightIsolated = right.num.length === 1 && right.den.length === 0;

    if (isLeftIsolated) {
      const rightSyms = [...right.num, ...right.den];
      const missing = rightSyms.filter((s) => card.values[s] && card.values[s].value === null);
      return (
        <div className="card-out-cell out-waiting">
          <span className="out-status-wait">
            Ожидает значений для: <b>{missing.join(', ')}</b>
          </span>
        </div>
      );
    }

    if (isRightIsolated) {
      const leftSyms = [...left.num, ...left.den];
      const missing = leftSyms.filter((s) => card.values[s] && card.values[s].value === null);
      return (
        <div className="card-out-cell out-waiting">
          <span className="out-status-wait">
            Ожидает значений для: <b>{missing.join(', ')}</b>
          </span>
        </div>
      );
    }

    return (
      <div className="card-out-cell out-prompt">
        <span className="out-status-prompt">
          📐 Выразите одну переменную (перетащите остальные буквы через «=»)
        </span>
      </div>
    );
  };

  return (
    <div
      className={`formula-card ${isRearranging ? 'card-rearranging' : ''}`}
      data-card-id={card.id}
    >
      <div className="formula-card-header">
        <div className="card-title-group">
          <span className="card-index">[{card.id}]</span>
          <span className="card-law-name">{card.law.name}</span>
        </div>
        <div className="card-actions">
          <button
            type="button"
            className="btn-card-swap"
            title="Поменять части местами (развернуть уравнение)"
            onClick={() => onSwapSides(card.id)}
          >
            ⇄
          </button>
          <button
            type="button"
            className="btn-card-reset"
            title="Сбросить к исходному виду"
            onClick={() => onResetCard(card.id)}
          >
            ↺
          </button>
          <button
            type="button"
            className="btn-card-remove"
            title="Удалить формулу"
            onClick={() => onRemoveCard(card.id)}
          >
            ✕
          </button>
        </div>
      </div>

      <div className="equation-workspace">
        {renderSide('left')}

        <div className="equation-equals-group">
          <button
            type="button"
            className="btn-swap-equals"
            title="Поменять левую и правую части местами (развернуть)"
            onClick={() => onSwapSides(card.id)}
          >
            ⇄
          </button>
          <div className="equation-equals">=</div>
        </div>

        {renderSide('right')}
      </div>

      {renderOutCell()}
    </div>
  );
};
