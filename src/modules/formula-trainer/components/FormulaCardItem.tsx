import React from 'react';
import { FormulaCard } from '../types/physics';
import { VariableToken } from './VariableToken';

interface FormulaCardItemProps {
  card: FormulaCard;
  isRearranging: boolean;
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
  const renderSide = (side: 'left' | 'right') => {
    const sideData = card.structure[side];
    const hasDen = sideData.den.length > 0;

    if (!hasDen) {
      // Строчный вид (произведение множителей)
      return (
        <div className={`equation-side equation-side-${side}`} data-card-id={card.id} data-side={side}>
          <div className="equation-row inline-row">
            {/* Дроп-зона в начало строки */}
            <div
              className="drop-zone"
              data-card-id={card.id}
              data-side={side}
              data-position="num"
              data-index={0}
              title="В начало"
            />

            {sideData.num.length === 0 ? (
              <span className="empty-side-indicator">1</span>
            ) : (
              sideData.num.map((sym, idx) => (
                <React.Fragment key={`${sym}-${idx}`}>
                  {idx > 0 && (
                    <>
                      <div
                        className="drop-zone"
                        data-card-id={card.id}
                        data-side={side}
                        data-position="num"
                        data-index={idx}
                        title="Между"
                      />
                      <span className="math-operator">·</span>
                    </>
                  )}
                  <VariableToken
                    cardId={card.id}
                    symbol={sym}
                    side={side}
                    position="num"
                    index={idx}
                    valData={card.values[sym]}
                    isDraggingSource={false}
                    isDropCandidate={
                      activeCandidateCardId === card.id && activeCandidateTokenSym === sym
                    }
                    onPointerDownToken={onPointerDownToken}
                    onClearValue={onClearValue}
                    onClickToken={onClickToken}
                  />
                </React.Fragment>
              ))
            )}

            {/* Дроп-зона в конец строки */}
            {sideData.num.length > 0 && (
              <div
                className="drop-zone"
                data-card-id={card.id}
                data-side={side}
                data-position="num"
                data-index={sideData.num.length}
                title="В конец"
              />
            )}
          </div>

          {/* Дроп-зона "Создать знаменатель (под черту)" */}
          <div
            className="drop-zone zone-new-fraction"
            data-card-id={card.id}
            data-side={side}
            data-position="den"
            data-index={0}
            title="— Под черту (создать дробь)"
          />
        </div>
      );
    }

    // Дробный вид
    return (
      <div className={`equation-side equation-side-${side}`} data-card-id={card.id} data-side={side}>
        <div className="equation-fraction">
          {/* Числитель */}
          <div className="equation-row num-row">
            <div
              className="drop-zone"
              data-card-id={card.id}
              data-side={side}
              data-position="num"
              data-index={0}
              title="В начало"
            />
            {sideData.num.length === 0 ? (
              <span className="math-const">1</span>
            ) : (
              sideData.num.map((sym, idx) => (
                <React.Fragment key={`${sym}-${idx}`}>
                  {idx > 0 && (
                    <>
                      <div
                        className="drop-zone"
                        data-card-id={card.id}
                        data-side={side}
                        data-position="num"
                        data-index={idx}
                        title="Между"
                      />
                      <span className="math-operator">·</span>
                    </>
                  )}
                  <VariableToken
                    cardId={card.id}
                    symbol={sym}
                    side={side}
                    position="num"
                    index={idx}
                    valData={card.values[sym]}
                    isDraggingSource={false}
                    isDropCandidate={
                      activeCandidateCardId === card.id && activeCandidateTokenSym === sym
                    }
                    onPointerDownToken={onPointerDownToken}
                    onClearValue={onClearValue}
                    onClickToken={onClickToken}
                  />
                </React.Fragment>
              ))
            )}
            {sideData.num.length > 0 && (
              <div
                className="drop-zone"
                data-card-id={card.id}
                data-side={side}
                data-position="num"
                data-index={sideData.num.length}
                title="В конец"
              />
            )}
          </div>

          {/* Дробная черта */}
          <div className="fraction-bar" />

          {/* Знаменатель */}
          <div className="equation-row den-row">
            <div
              className="drop-zone"
              data-card-id={card.id}
              data-side={side}
              data-position="den"
              data-index={0}
              title="В начало"
            />
            {sideData.den.map((sym, idx) => (
              <React.Fragment key={`${sym}-${idx}`}>
                {idx > 0 && (
                  <>
                    <div
                      className="drop-zone"
                      data-card-id={card.id}
                      data-side={side}
                      data-position="den"
                      data-index={idx}
                      title="Между"
                    />
                    <span className="math-operator">·</span>
                  </>
                )}
                <VariableToken
                  cardId={card.id}
                  symbol={sym}
                  side={side}
                  position="den"
                  index={idx}
                  valData={card.values[sym]}
                  isDraggingSource={false}
                  isDropCandidate={
                    activeCandidateCardId === card.id && activeCandidateTokenSym === sym
                  }
                  onPointerDownToken={onPointerDownToken}
                  onClearValue={onClearValue}
                  onClickToken={onClickToken}
                />
              </React.Fragment>
            ))}
            <div
              className="drop-zone"
              data-card-id={card.id}
              data-side={side}
              data-position="den"
              data-index={sideData.den.length}
              title="В конец"
            />
          </div>
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
        <div
          className={`card-out-cell out-success ${selectionMode ? 'selectable' : ''}`}
          onClick={() => {
            if (selectionMode) onSelectAnswerCard(card);
          }}
        >
          <div className="out-badge">
            <span className="out-tag">[Out]:</span>
            <span className="out-equation">
              <b>{card.computed.symbol}</b> = <mark>{formatted}</mark> {card.computed.unit}
            </span>
            <span
              className="out-drag-handle"
              title="Перетяните это значение в другую формулу"
              onPointerDown={(e) => onPointerDownOut(e, card)}
            >
              ⠿
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
