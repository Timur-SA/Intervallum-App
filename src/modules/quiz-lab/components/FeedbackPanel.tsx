import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { AnswerStatus } from '../types';

interface FeedbackPanelProps {
  status: AnswerStatus;
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
    <div className={`ql-feedback ql-feedback--${status}`} role="status" aria-live="polite">
      <div className="ql-feedback__title">
        <Icon size={17} />
        <span>{title}</span>
      </div>

      <p className="ql-feedback__text">{explanation}</p>

      {correctAnswer && (
        <p className="ql-feedback__answer">
          <strong>Верный ответ:</strong> {correctAnswer}
        </p>
      )}
    </div>
  );
};
