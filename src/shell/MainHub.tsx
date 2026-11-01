import React from 'react';
import { ArrowUpRight, Compass, Sparkles, Variable } from 'lucide-react';
import { ModeCard } from './ModeCard';
import { UserProgressData } from '../shared/storage/progressStore';
import { FORCE_TASKS } from '../modules/force-lab/data/tasks';
import { PHYSICS_TASKS } from '../modules/formula-trainer/data/tasksDb';

interface MainHubProps {
  progress: UserProgressData;
  onSelectMode: (mode: 'force-lab' | 'formula-trainer') => void;
}

export const MainHub: React.FC<MainHubProps> = ({ progress, onSelectMode }) => {
  const forceTotal = FORCE_TASKS.length;
  const forceDone = progress.forceLab.completedTaskIds.length;
  const forceStars = progress.forceLab.stars;

  const formulaTotal = PHYSICS_TASKS.length;
  const formulaDone = progress.formulaTrainer.completedTaskIds.length;
  const formulaStars = progress.formulaTrainer.stars;

  const totalStars = forceStars + formulaStars;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
        padding: '16px 18px 24px',
        gap: 16,
      }}
    >
      {/* Brand Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 20 }}>⚡</span>
            <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>Intervallum</span>
          </div>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--app-subtext)' }}>
            Интерактивный физический практикум
          </p>
        </div>

        {totalStars > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 12px',
              borderRadius: 20,
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              color: '#d97706',
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            <span>★</span>
            <span>{totalStars}</span>
          </div>
        )}
      </div>

      {/* Mode Selection Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 4 }}>
        <ModeCard
          id="force-lab"
          title="Расстановка сил"
          subtitle="Векторный тренажёр"
          description="Построй физическую картину взаимодействий: выбери силу, укажи точку крепления и проведи вектор нужной длины."
          badge="Холст"
          color="#0284c7"
          icon={<Compass size={22} />}
          completedCount={forceDone}
          totalCount={forceTotal}
          stars={forceStars}
          onClick={() => onSelectMode('force-lab')}
        />

        <ModeCard
          id="formula-trainer"
          title="Тренажёр формул"
          subtitle="Алгебраический вывод"
          description="Переставляй буквы в уравнении, выражай неизвестную величину, подставляй значения из условия и рассчитывай ответ."
          badge="Алгебра"
          color="#8b5cf6"
          icon={<Variable size={22} />}
          completedCount={formulaDone}
          totalCount={formulaTotal}
          stars={formulaStars}
          onClick={() => onSelectMode('formula-trainer')}
        />
      </div>

      {/* Helpful Hint banner */}
      <div
        style={{
          marginTop: 'auto',
          backgroundColor: 'var(--fl-wash)',
          border: '1px solid var(--fl-line)',
          borderRadius: 16,
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
        }}
      >
        <Sparkles size={18} style={{ color: 'var(--fl-accent)', flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 12, lineHeight: 1.45, color: 'var(--fl-ink)' }}>
          <strong>Методический совет:</strong> Решение задачи всегда начинается с качественного
          чертежа сил, а затем переходит в вывод расчетных формул.
        </div>
      </div>
    </div>
  );
};
