import React, { useEffect } from 'react';
import { Compass, GraduationCap, Sparkles, Variable } from 'lucide-react';
import { ModeCard } from './ModeCard';
import { UserProgressData } from '../shared/storage/progressStore';
import { FORCE_TASKS } from '../modules/force-lab/data/tasks';
import { PHYSICS_TASKS } from '../modules/formula-trainer/data/tasksDb';
import { MINI_GAMES } from '../modules/mini-games/data';
import { useNavigation } from './HeaderContext';

interface MainHubProps {
  progress: UserProgressData;
  onSelectMode: (mode: 'force-lab' | 'formula-trainer' | 'mini-games') => void;
}

export const MainHub: React.FC<MainHubProps> = ({ progress, onSelectMode }) => {
  const { setNavigationConfig } = useNavigation();

  const forceTotal = FORCE_TASKS.length;
  const forceDone = progress.forceLab.completedTaskIds.length;
  const forceStars = progress.forceLab.stars;

  const formulaTotal = PHYSICS_TASKS.length;
  const formulaDone = progress.formulaTrainer.completedTaskIds.length;
  const formulaStars = progress.formulaTrainer.stars;

  const totalStars = forceStars + formulaStars;

  // On the root hub screen, the host messenger BackButton is hidden
  useEffect(() => {
    setNavigationConfig({ canGoBack: false });
  }, [setNavigationConfig]);

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
      {/* Mini App Brand & Stars Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 20 }}>⚡</span>
            <span
              style={{
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: -0.5,
                color: 'var(--text-primary)',
              }}
            >
              Intervallum
            </span>
          </div>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
            Интерактивный физический практикум
          </p>
        </div>

        {totalStars > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 12px',
              borderRadius: 20,
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              color: '#f59e0b',
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

        <ModeCard
          id="mini-games"
          title="Подготовка"
          subtitle="Режимы MVP"
          description="Мини-игры по типам заданий ОГЭ: выбор ответа, множественный выбор, соответствие и карточки теории."
          badge="MVP"
          color="#10b981"
          icon={<GraduationCap size={22} />}
          completedCount={progress.practice.exploredTypes.length}
          totalCount={MINI_GAMES.length}
          stars={0}
          onClick={() => onSelectMode('mini-games')}
        />
      </div>

      {/* Helpful Hint banner */}
      <div
        style={{
          marginTop: 'auto',
          backgroundColor: 'var(--accent-bg)',
          border: '1px solid var(--border-accent)',
          borderRadius: 16,
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
        }}
      >
        <Sparkles size={18} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 12, lineHeight: 1.45, color: 'var(--text-primary)' }}>
          <strong>Методический совет:</strong> Качественное решение начинается с точного
          чертежа сил, а затем переходит в алгебраический вывод формул.
        </div>
      </div>
    </div>
  );
};
