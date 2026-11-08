import React, { CSSProperties, ReactNode } from 'react';
import { Button } from '@maxhub/max-ui';
import { RotateCcw } from 'lucide-react';
import { SECTION_ICONS } from '../config/sectionIcons';
import { getSectionByTopic, getTopic } from '../domain/sections';
import { SessionSummary } from '../renderers/SessionRunner';

interface ResultScreenProps {
  subtitle: string;
  color: string;
  icon: ReactNode;
  summary: SessionSummary;
  progressHint?: string;
  onRetry?: () => void;
  retryLabel?: string;
  retryPending?: boolean;
  onBack: () => void;
  backLabel?: string;
  title?: string;
  celebrate?: boolean;
}

const CONFETTI = [
  { x: -104, y: -22, turn: -145, tone: 'accent' },
  { x: -90, y: -58, turn: 95, tone: 'warning' },
  { x: -64, y: -37, turn: -75, tone: 'success' },
  { x: -42, y: -69, turn: 150, tone: 'accent' },
  { x: 49, y: -65, turn: -120, tone: 'success' },
  { x: 68, y: -43, turn: 85, tone: 'accent' },
  { x: 91, y: -57, turn: -105, tone: 'warning' },
  { x: 108, y: -19, turn: 135, tone: 'success' },
] as const;

export const ResultScreen: React.FC<ResultScreenProps> = ({
  subtitle,
  color,
  icon,
  summary,
  progressHint,
  onRetry,
  retryLabel = 'Ещё раз',
  retryPending = false,
  onBack,
  backLabel = 'Продолжить',
  title = 'Раунд завершён',
  celebrate = false,
}) => {
  const accuracy = Math.round(summary.score * 100);

  return (
    <div className="mg-result">
      <div className="mg-result__emblem">
        {celebrate && (
          <div className="mg-result__confetti" aria-hidden="true">
            {CONFETTI.map(({ x, y, turn, tone }) => (
              <span
                key={x}
                className="mg-result__confetti-piece"
                style={{
                  '--confetti-x': `${x}px`,
                  '--confetti-y': `${y}px`,
                  '--confetti-turn': `${turn}deg`,
                  backgroundColor: tone === 'accent' ? color : `var(--${tone})`,
                } as CSSProperties}
              />
            ))}
          </div>
        )}
        <div className="mg-result__badge" style={{ backgroundColor: color }}>
          {icon}
        </div>
      </div>

      <h2 className="mg-result__title">{title}</h2>
      <p className="mg-result__subtitle">{subtitle}</p>

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

      {summary.topicChanges.length > 0 && (
        <ul className="mg-training-results" aria-label="Прогресс по темам">
          {summary.topicChanges.map(({ topicId, before, after, max }) => {
            const topic = getTopic(topicId);
            const section = getSectionByTopic(topicId);
            const Icon = section ? SECTION_ICONS[section.id] : undefined;
            const delta = after - before;
            return (
              <li key={topicId}>
                <div className="mg-training-results__topic">
                  {Icon && <Icon size={16} aria-hidden="true" />}
                  <span>{topic?.title}</span>
                  <strong data-change={Math.sign(delta)}>
                    {delta > 0 ? '+' : ''}{delta} XP
                  </strong>
                </div>
                <progress value={after} max={max} aria-label={topic?.title} />
                <span className="mg-training-results__scale">{after} / {max} XP</span>
              </li>
            );
          })}
        </ul>
      )}

      {progressHint && <p className="mg-result__hint">{progressHint}</p>}

      <div className="mg-result__actions">
        <Button variant="primary" size="large" stretched onClick={onBack}>
          {backLabel}
        </Button>

        {onRetry && (
          <Button
            variant="secondary"
            size="large"
            stretched
            disabled={retryPending}
            iconBefore={<RotateCcw size={16} />}
            onClick={onRetry}
          >
            {retryPending ? 'Подбираем задачи…' : retryLabel}
          </Button>
        )}
      </div>
    </div>
  );
};
