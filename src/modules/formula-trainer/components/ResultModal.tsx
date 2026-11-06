import React from 'react';
import { PhysicsTask, ComputedResult } from '../types/physics';
import { MathText } from '../../../shared/components/MathView';
import { Button } from '@maxhub/max-ui';

interface ResultModalProps {
  isOpen: boolean;
  isSuccess: boolean;
  result: ComputedResult | null;
  task: PhysicsTask;
  onClose: () => void;
  onNextTask: () => void;
  onToList: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  isOpen,
  isSuccess,
  result,
  task,
  onClose,
  onNextTask,
  onToList
}) => {
  if (!isOpen || !result) return null;

  const isSymbolMatch = result.symbol === task.find.symbol;

  return (
    <>
      <div className="modal-backdrop visible" onClick={onClose} />
      <div className="max-modal-sheet visible">
        <div className={isSuccess ? 'result-icon-success' : 'result-icon-fail'}>
          {isSuccess ? '🎉' : '❌'}
        </div>

        <h3 className="result-title">
          {isSuccess ? 'Задача решена верно!' : 'Неправильный ответ'}
        </h3>

        <div className={`result-answer-box ${!isSuccess ? 'fail-box' : ''}`}>
          <span className="answer-label">{isSuccess ? 'Итоговый ответ:' : 'Вы сдаете:'}</span>
          <span className="answer-val">
            {result.symbol} = <b>{result.value}</b> {result.unit}
          </span>
        </div>

        {isSuccess ? (
          <div className="result-explanation">
            <div className="exp-title">Пояснение:</div>
            <div className="exp-text">
              <MathText text={task.explanation} />
            </div>
          </div>
        ) : (
          <p className="fail-hint">
            {!isSymbolMatch
              ? `Искомой величиной задачи является ${task.find.symbol}, а вы выразили ${result.symbol}.`
              : 'Значение не совпало с верным физическим ответом. Проверьте правильность выбранного закона и преобразования букв.'}
          </p>
        )}

        <div className="result-actions">
          {isSuccess ? (
            <>
              <Button variant="primary" stretched onClick={onNextTask}>
                Следующая задача
              </Button>
              <Button variant="secondary" stretched onClick={onToList}>
                К списку задач
              </Button>
            </>
          ) : (
            <Button variant="primary" stretched onClick={onClose}>
              Попробовать снова
            </Button>
          )}
        </div>
      </div>
    </>
  );
};
