import React from 'react';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Outcome } from '../domain/types';

interface FeedbackPanelProps {
  status: Outcome;
  title: string;
  explanation: string;
  correctAnswer?: string;
}

const ICONS = {
  correct: CheckCircle2,
  partial: AlertTriangle,
  wrong: XCircle,
} as const;

/** Цветная плашка с разбором ответа — как в Duolingo. */
export const FeedbackPanel: React.FC<FeedbackPanelProps> = ({
  status,
  title,
  explanation,
  correctAnswer,
}) => {
  const Icon = ICONS[status];

  return (
    <div className={`mg-feedback mg-feedback--${status}`} role="status" aria-live="polite">
      <div className="mg-feedback__title">
        <Icon size={17} />
        <span>{title}</span>
      </div>

      <p className="mg-feedback__text">{explanation}</p>

      {correctAnswer && (
        <p className="mg-feedback__answer">
          <strong>Верный ответ:</strong> {correctAnswer}
        </p>
      )}
    </div>
  );
};
