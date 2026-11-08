import React from 'react';
import { Button } from '@maxhub/max-ui';
import { Gamepad2, LockKeyhole, Sparkles } from 'lucide-react';
import './CatalogScreen.css';

interface CatalogScreenProps {
  onGoHome: () => void;
}

export const CatalogScreen: React.FC<CatalogScreenProps> = ({ onGoHome }) => (
  <div className="catalog-screen">
    <div className="catalog-screen__glow" aria-hidden />
    <div className="catalog-screen__content">
      <span className="catalog-screen__icon">
        <Gamepad2 size={34} />
        <span className="catalog-screen__lock">
          <LockKeyhole size={15} strokeWidth={2.6} />
        </span>
      </span>
      <span className="catalog-screen__eyebrow">
        <Sparkles size={13} />
        Скоро
      </span>
      <h1>Каталог мини-игр</h1>
      <p>
        Здесь появятся дополнительные игры, которые не влияют на основной прогресс.
        Они будут засчитываться только в ежедневную активность и Daily Streak.
      </p>
      <Button variant="primary" size="large" stretched onClick={onGoHome}>
        Вернуться на главную
      </Button>
    </div>
  </div>
);
