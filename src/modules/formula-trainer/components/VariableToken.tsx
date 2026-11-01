import React, { useRef } from 'react';
import { VariableValueState } from '../types/physics';

interface VariableTokenProps {
  cardId: number;
  symbol: string;
  side: 'left' | 'right';
  position: 'num' | 'den';
  index: number;
  valData?: VariableValueState;
  isDraggingSource: boolean;
  isDropCandidate: boolean;
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
}

export const VariableToken: React.FC<VariableTokenProps> = ({
  cardId,
  symbol,
  side,
  position,
  index,
  valData,
  isDraggingSource,
  isDropCandidate,
  onPointerDownToken,
  onClearValue,
  onClickToken
}) => {
  const tokenRef = useRef<HTMLDivElement>(null);
  const isSubstituted = valData && valData.value !== null && valData.value !== undefined;

  const formattedVal = isSubstituted
    ? Number.isInteger(valData.value)
      ? valData.value
      : parseFloat(valData.value!.toFixed(2))
    : null;

  return (
    <div
      ref={tokenRef}
      className={`var-token ${isSubstituted ? 'substituted' : ''} ${
        isDraggingSource ? 'is-dragging-source' : ''
      } ${isDropCandidate ? 'drop-candidate' : ''}`}
      data-card-id={cardId}
      data-symbol={symbol}
      data-side={side}
      data-pos={position}
      data-idx={index}
      onPointerDown={(e) => {
        onPointerDownToken(e, cardId, symbol, side, position, index);
      }}
      onClick={(e) => {
        if ((e.target as HTMLElement).classList.contains('token-clear-btn')) return;
        if (tokenRef.current) {
          onClickToken(cardId, symbol, tokenRef.current);
        }
      }}
    >
      <span className="token-symbol">{symbol}</span>
      {isSubstituted && (
        <>
          <span className="token-val-badge">{formattedVal}</span>
          <button
            type="button"
            className="token-clear-btn"
            title="Очистить значение"
            onClick={(e) => {
              e.stopPropagation();
              onClearValue(cardId, symbol);
            }}
          >
            ✕
          </button>
        </>
      )}
    </div>
  );
};
