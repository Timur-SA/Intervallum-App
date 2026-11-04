import React from 'react';
import { Button } from '@maxhub/max-ui';
import { CircleCheck, Layers, Link2, ListChecks, RotateCcw, Sparkles } from 'lucide-react';
import { GameSummary, PlayableTaskType } from '../domain/types';
import { getMiniGameMeta } from '../data';

interface ResultScreenProps {
  summary: GameSummary;
  onRetry: () => void;
  onBackToList: () => void;
}

const ICONS: Record<PlayableTaskType, React.ReactNode> = {
  single: <CircleCheck size={30} />,
  multi: <ListChecks size={30} />,
  matching: <Link2 size={30} />,
  cards: <Layers size={30} />,
};

export const ResultScreen: React.FC<ResultScreenProps> = ({
  summary,
  onRetry,
  onBackToList,
}) => {
  const meta = getMiniGameMeta(summary.type);
  const accuracy = Math.round(summary.score * 100);
  const isCards = summary.type === 'cards';

  return (
    <div className="mg-result">
      <div className="mg-result__badge" style={{ backgroundColor: meta.color }}>
        {ICONS[summary.type]}
      </div>

      <h2 className="mg-result__title">Раунд завершён</h2>
      <p className="mg-result__subtitle">{meta.title}</p>

      {summary.xp > 0 && (
        <div className="mg-result__xp">
          <Sparkles size={18} />
          <span>+{summary.xp} XP</span>
        </div>
      )}

      <div className="mg-result__stats">
        {isCards ? (
          <>
            <div className="mg-result__stat">
              <span className="mg-result__stat-value">{summary.tasks}</span>
              <span className="mg-result__stat-label">Карточек</span>
            </div>
            <div className="mg-result__stat">
              <span className="mg-result__stat-value">{summary.repeats ?? 0}</span>
              <span className="mg-result__stat-label">Повторов</span>
            </div>
          </>
        ) : (
          <>
            <div className="mg-result__stat">
              <span className="mg-result__stat-value">
                {Math.round(summary.correct * 10) / 10} / {summary.tasks}
              </span>
              <span className="mg-result__stat-label">Засчитано</span>
            </div>
            <div className="mg-result__stat">
              <span className="mg-result__stat-value">{accuracy}%</span>
              <span className="mg-result__stat-label">Точность</span>
            </div>
          </>
        )}

        {summary.bestStreak > 0 && (
          <div className="mg-result__stat">
            <span className="mg-result__stat-value">{summary.bestStreak}</span>
            <span className="mg-result__stat-label">Серия</span>
          </div>
        )}
      </div>

      <div className="mg-result__actions">
        <Button variant="primary" size="large" stretched onClick={onBackToList}>
          К списку мини-игр
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
