import React from 'react';
import { Button } from '@maxhub/max-ui';
import { Star, RotateCcw } from 'lucide-react';
import { GameResult } from '../types';
import { getGameMeta } from '../config';

interface ResultScreenProps {
  result: GameResult;
  onRetry: () => void;
  onBackToList: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  result,
  onRetry,
  onBackToList,
}) => {
  const meta = getGameMeta(result.gameId);
  const accuracy = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;

  return (
    <div className="ql-result">
      <div className="ql-result__badge" style={{ backgroundColor: meta.color }}>
        {meta.icon}
      </div>

      <h2 className="ql-result__title">Раунд завершён</h2>
      <p className="ql-result__subtitle">{meta.title}</p>

      <div className="ql-result__stars" aria-label={`Звёзд: ${result.stars} из 3`}>
        {[0, 1, 2].map(index => (
          <Star
            key={index}
            size={30}
            fill={index < result.stars ? '#f59e0b' : 'transparent'}
            color={index < result.stars ? '#f59e0b' : 'var(--text-muted)'}
          />
        ))}
      </div>

      <div className="ql-result__stats">
        <div className="ql-result__stat">
          <span className="ql-result__stat-value">
            {Math.round(result.correct)} / {result.total}
          </span>
          <span className="ql-result__stat-label">Верно</span>
        </div>

        <div className="ql-result__stat">
          <span className="ql-result__stat-value">{accuracy}%</span>
          <span className="ql-result__stat-label">Точность</span>
        </div>

        {result.bestStreak > 0 && (
          <div className="ql-result__stat">
            <span className="ql-result__stat-value">{result.bestStreak}</span>
            <span className="ql-result__stat-label">Серия</span>
          </div>
        )}
      </div>

      <div className="ql-result__actions">
        <Button
          variant="primary"
          size="large"
          stretched
          onClick={onBackToList}
        >
          К списку игр
        </Button>

        <Button
          variant="secondary"
          size="large"
          stretched
          iconBefore={<RotateCcw size={16} />}
          onClick={onRetry}
        >
          Ещё раз
        </Button>
      </div>
    </div>
  );
};
