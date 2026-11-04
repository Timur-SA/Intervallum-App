import React, { useEffect, useRef, useState } from 'react';
import './styles/mini-games.css';
import { Flame, Sparkles, Swords } from 'lucide-react';
import { AnyTask, SectionId, TopicId } from './domain/types';
import { getSection, getTopic } from './domain/sections';
import { BOSS_TIME_SECONDS, BOSS_WIN_SCORE } from './domain/progression';
import { TASK_BANK } from './data';
import { selectBossTasks } from './api/select';
import {
  defeatBoss,
  loadUserProgress,
  unlockSection,
} from '../../shared/storage/progressStore';
import { useNavigation } from '../../shell/HeaderContext';
import { SectionsMapScreen } from './screens/SectionsMapScreen';
import { SectionMapScreen } from './screens/SectionMapScreen';
import { SessionRunner, SessionSummary } from './renderers/SessionRunner';
import { ResultScreen } from './components/ResultScreen';

interface MapModuleProps {
  onOpenFormulaTrainer: () => void;
  onOpenForceLab: () => void;
}

type SessionKind = 'level' | 'boss';

interface SessionConfig {
  kind: SessionKind;
  title: string;
  tasks: AnyTask[];
  timerSeconds?: number;
  sectionId: SectionId;
  topicId?: TopicId;
}

type Screen =
  | { name: 'sections'; choosing: boolean }
  | { name: 'section'; sectionId: SectionId }
  | { name: 'session'; config: SessionConfig }
  | { name: 'result'; config: SessionConfig; summary: SessionSummary; bossLost?: boolean }
  | { name: 'boss-victory'; sectionId: SectionId };

export const MapModule: React.FC<MapModuleProps> = ({
  onOpenFormulaTrainer,
  onOpenForceLab,
}) => {
  const [route, setRoute] = useState<Screen>({ name: 'sections', choosing: false });
  const [history, setHistory] = useState<Screen[]>([]);
  const [progress, setProgress] = useState(() => loadUserProgress());

  const { setNavigationConfig } = useNavigation();

  const back = () => {
    setProgress(loadUserProgress());
    if (!history.length) return;
    const previous = history[history.length - 1];
    setHistory(items => items.slice(0, -1));
    setRoute(previous);
  };

  const backRef = useRef(back);
  backRef.current = back;

  useEffect(() => {
    setNavigationConfig({ canGoBack: history.length > 0, onBack: () => backRef.current() });
  }, [history.length, setNavigationConfig]);

  const navigate = (next: Screen) => {
    setHistory(items => [...items, route]);
    setRoute(next);
  };

  const replace = (next: Screen) => setRoute(next);

  const startLevel = (sectionId: SectionId, topicId: TopicId) => {
    const tasks = TASK_BANK.filter(task => task.topic === topicId);
    if (!tasks.length) return;

    navigate({
      name: 'session',
      config: {
        kind: 'level',
        title: getTopic(topicId)?.title ?? 'Уровень',
        tasks,
        sectionId,
        topicId,
      },
    });
  };

  const startBoss = (sectionId: SectionId) => {
    const section = getSection(sectionId);
    if (!section) return;

    navigate({
      name: 'session',
      config: {
        kind: 'boss',
        title: `Дуэль: ${section.boss}`,
        tasks: selectBossTasks(sectionId, progress.practice),
        timerSeconds: BOSS_TIME_SECONDS,
        sectionId,
      },
    });
  };

  const handleComplete = (summary: SessionSummary) => {
    if (route.name !== 'session') return;
    const { config } = route;

    if (config.kind === 'boss') {
      const section = getSection(config.sectionId);
      const win = !summary.timeout && summary.solved >= BOSS_WIN_SCORE;

      if (win && section) {
        defeatBoss({ sectionId: section.id, itemId: section.itemId });
        setProgress(loadUserProgress());
        replace({ name: 'boss-victory', sectionId: section.id });
        return;
      }

      setProgress(loadUserProgress());
      replace({ name: 'result', config, summary, bossLost: true });
      return;
    }

    setProgress(loadUserProgress());
    replace({ name: 'result', config, summary });
  };

  const handleChooseSection = (sectionId: SectionId) => {
    unlockSection(sectionId);
    setProgress(loadUserProgress());
    setHistory([]);
    replace({ name: 'section', sectionId });
  };

  const handleReset = () => {
    localStorage.removeItem('intervallum:progress:v2');
    setProgress(loadUserProgress());
    setHistory([]);
    replace({ name: 'sections', choosing: false });
  };

  if (route.name === 'session') {
    return (
      <div className="mini-games">
        <SessionRunner
          tasks={route.config.tasks}
          timerSeconds={route.config.timerSeconds}
          onComplete={handleComplete}
        />
      </div>
    );
  }

  if (route.name === 'result') {
    const { config, summary, bossLost } = route;
    const section = getSection(config.sectionId);

    return (
      <div className="mini-games">
        <ResultScreen
          subtitle={config.kind === 'boss' ? `${section?.boss ?? ''} · ${section?.title ?? ''}` : config.title}
          color={config.kind === 'boss' ? '#f59e0b' : section?.color ?? '#0ea5e9'}
          icon={config.kind === 'boss' ? <Swords size={30} /> : <Flame size={30} />}
          title={bossLost ? 'Босс не побеждён' : config.kind === 'boss' ? 'Дуэль завершена' : 'Уровень завершён'}
          summary={summary}
          onRetry={() => replace({ name: 'session', config })}
          onBack={back}
          backLabel={config.kind === 'boss' ? 'К карте' : 'К уровню'}
        />
      </div>
    );
  }

  if (route.name === 'boss-victory') {
    const section = getSection(route.sectionId);

    return (
      <div className="mini-games">
        <div className="mg-screen">
          <div className="mg-scroll">
            <div className="mg-victory">
              <div className="mg-victory__flame">
                <Flame size={40} />
              </div>
              <h2 className="mg-result__title">Босс повержен</h2>
              <p className="mg-result__subtitle">{section?.boss}</p>
              <span className="mg-item">
                <Sparkles size={16} />
                Получен предмет: {section?.item}
              </span>

              <p className="mg-result__hint">
                Теперь выберите, какой раздел открыть следующим
              </p>

              <button
                type="button"
                className="mg-btn-primary"
                onClick={() => replace({ name: 'sections', choosing: true })}
              >
                Выбрать раздел
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isSandbox =
    typeof window !== 'undefined' && !(window as any).WebApp?.platform;

  if (route.name === 'section') {
    return (
      <div className="mini-games">
        <SectionMapScreen
          sectionId={route.sectionId}
          progress={progress.practice}
          onStartLevel={topicId => startLevel(route.sectionId, topicId)}
          onStartBoss={() => startBoss(route.sectionId)}
        />
        <div className="mg-map__footer">
          <button type="button" className="mg-map__force" onClick={onOpenForceLab}>
            Расстановка сил
          </button>
          <button type="button" className="mg-map__force" onClick={onOpenFormulaTrainer}>
            Тренажёр формул
          </button>
          {isSandbox && (
            <button type="button" className="mg-reset" onClick={handleReset}>
              Сбросить прогресс (тест)
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mini-games">
      <SectionsMapScreen
        progress={progress.practice}
        choosing={route.choosing}
        onOpenSection={sectionId => navigate({ name: 'section', sectionId })}
        onChooseSection={handleChooseSection}
      />
    </div>
  );
};
