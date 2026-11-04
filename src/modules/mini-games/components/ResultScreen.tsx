import React, { ReactNode } from 'react';
import { Button } from '@maxhub/max-ui';
import { RotateCcw } from 'lucide-react';
import { SessionSummary } from '../renderers/SessionRunner';

interface ResultScreenProps {
  subtitle: string;
  color: string;
  icon: ReactNode;
  summary: SessionSummary;
  onRetry: () => void;
  onBack: () => void;
  backLabel?: string;
  title?: string;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  subtitle,
  color,
  icon,
  summary,
  onRetry,
  onBack,
  backLabel = 'Продолжить',
  title = 'Раунд завершён',
}) => {
  const accuracy = Math.round(summary.score * 100);

  return (
    <div className="mg-result">
      <div className="mg-result__badge" style={{ backgroundColor: color }}>
        {icon}
      </div>

      <h2 className="mg-result__title">{title}</h2>
      <p className="mg-result__subtitle">{subtitle}</p>

      <div className="mg-result__badges">
      </div>

      <div className="mg-result__stats">
        <div className="mg-result__stat">
          <span className="mg-result__stat-value">
            {summary.solved} / {summary.tasks}
          </span>
          <span className="mg-result__stat-label">Решено</span>
        </div>

        <div className="mg-result__stat">
          <span className="mg-result__stat-value">{accuracy}%</span>
          <span className="mg-result__stat-label">Точность</span>
        </div>

        {summary.bestStreak > 0 && (
          <div className="mg-result__stat">
            <span className="mg-result__stat-value">{summary.bestStreak}</span>
            <span className="mg-result__stat-label">Серия</span>
          </div>
        )}
      </div>

      <div className="mg-result__actions">
        <Button variant="primary" size="large" stretched onClick={onBack}>
          {backLabel}
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
