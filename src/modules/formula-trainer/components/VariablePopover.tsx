import React, { useState } from 'react';
import { PhysicsTask, FormulaCard } from '../types/physics';
import { Button } from '@maxhub/max-ui';

interface VariablePopoverProps {
  cardId: number;
  symbol: string;
  anchorRect: DOMRect;
  task: PhysicsTask;
  allCards: FormulaCard[];
  onSelectGiven: (cardId: number, symbol: string, value: number) => void;
  onSelectLink: (cardId: number, symbol: string, fromCardId: number, fromSymbol: string, value: number) => void;
  onManualInput: (cardId: number, symbol: string, value: number) => void;
  onClear: (cardId: number, symbol: string) => void;
  onClose: () => void;
}

export const VariablePopover: React.FC<VariablePopoverProps> = ({
  cardId,
  symbol,
  anchorRect,
  task,
  allCards,
  onSelectGiven,
  onSelectLink,
  onManualInput,
  onClear,
  onClose
}) => {
  const [manualVal, setManualVal] = useState('');

  const currentCard = allCards.find((c) => c.id === cardId);
  const varInfo = currentCard?.values[symbol];

  const top = Math.min(anchorRect.bottom + 8, window.innerHeight - 280);
  const left = Math.max(16, Math.min(anchorRect.left - 40, window.innerWidth - 290));

  const otherCards = allCards.filter(
    (c) => c.id !== cardId && c.computed && c.computed.value !== null
  );

  const handleApplyManual = () => {
    const parsed = parseFloat(manualVal);
    if (!isNaN(parsed)) {
      onManualInput(cardId, symbol, parsed);
      onClose();
    }
  };

  return (
    <>
      <div className="popover-backdrop" onClick={onClose} />
      <div className="max-popover" style={{ top: `${top}px`, left: `${left}px` }}>
        <div className="popover-header">
          <span className="popover-title">
            {varInfo?.name || symbol} (<b>{symbol}</b>)
          </span>
          <button type="button" className="popover-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="popover-body">
          <div className="popover-section-label">Значения из условия:</div>
          <div className="popover-chips">
            {task.givens.map((g) => (
              <button
                key={g.symbol}
                type="button"
                className="popover-chip"
                onClick={() => {
                  onSelectGiven(cardId, symbol, g.value);
                  onClose();
                }}
              >
                <b>{g.symbol}</b> = {g.value} {g.unit}
              </button>
            ))}
          </div>

          {otherCards.length > 0 && (
            <>
              <div className="popover-section-label">Связать с результатом формулы:</div>
              <div className="popover-chips">
                {otherCards.map((c) => {
                  const comp = c.computed!;
                  const valFormatted = Number.isInteger(comp.value)
                    ? comp.value
                    : parseFloat(comp.value.toFixed(2));
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className="popover-chip chip-link"
                      onClick={() => {
                        onSelectLink(cardId, symbol, c.id, comp.symbol, comp.value);
                        onClose();
                      }}
                    >
                      🔗 [{c.id}] {comp.symbol} = {valFormatted} {comp.unit}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div className="popover-section-label">Или ввести число:</div>
          <div className="popover-manual-input">
            <input
              type="number"
              step="any"
              placeholder="Число..."
              value={manualVal}
              onChange={(e) => setManualVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleApplyManual();
              }}
            />
            <Button size="small" variant="primary" onClick={handleApplyManual}>
              OK
            </Button>
          </div>

          {varInfo && varInfo.value !== null && (
            <div className="popover-footer">
              <button
                type="button"
                className="btn-text-danger"
                onClick={() => {
                  onClear(cardId, symbol);
                  onClose();
                }}
              >
                Сбросить значение
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
