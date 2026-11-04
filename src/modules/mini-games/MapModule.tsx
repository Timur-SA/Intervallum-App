import React, { useEffect, useRef, useState } from 'react';
import './styles/mini-games.css';
import { CircleCheck, Layers, Link2, ListChecks, Swords, Trophy } from 'lucide-react';
import { AnyTask, PlayableTaskType, SectionId, TopicId } from './domain/types';
import { getSection, getTopic } from './domain/sections';
import {
  BOSS_TIME_SECONDS,
  BOSS_WIN_SCORE,
  bossXpRequired,
  sectionXp,
  topicMaxXp,
} from './domain/progression';
import { getMiniGameMeta, TASK_BANK } from './data';
import { selectBossTasks } from './api/select';
import {
  defeatBoss,
  loadUserProgress,
  unlockSection,
} from '../../shared/storage/progressStore';
import { useNavigation } from '../../shell/HeaderContext';
import { MapScreen } from './screens/MapScreen';
import { LevelScreen } from './screens/LevelScreen';
import { BossVictoryScreen } from './screens/BossVictoryScreen';
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
  | { name: 'map' }
  | { name: 'level'; sectionId: SectionId; topicId: TopicId }
  | { name: 'session'; config: SessionConfig }
  | { name: 'result'; config: SessionConfig; summary: SessionSummary; bossLost?: boolean }
  | { name: 'boss-victory'; sectionId: SectionId };

const RESULT_ICONS: Record<PlayableTaskType, React.ReactNode> = {
  single: <CircleCheck size={30} />,
  multi: <ListChecks size={30} />,
  matching: <Link2 size={30} />,
  cards: <Layers size={30} />,
};

export const MapModule: React.FC<MapModuleProps> = ({
  onOpenFormulaTrainer,
  onOpenForceLab,
}) => {
  const [route, setRoute] = useState<Screen>({ name: 'map' });
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

    replace({
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

    replace({
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
    replace({ name: 'map' });
  };

  const handleReset = () => {
    localStorage.removeItem('intervallum:progress:v2');
    setProgress(loadUserProgress());
    setHistory([]);
    setRoute({ name: 'map' });
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
    const meta = resultMeta(config, bossLost);

    return (
      <div className="mini-games">
        <ResultScreen
          subtitle={meta.subtitle}
          color={meta.color}
          icon={meta.icon}
          title={meta.title}
          summary={summary}
          onRetry={() => replace({ name: 'session', config })}
          onBack={back}
          backLabel={config.kind === 'boss' ? 'К карте' : 'К уровню'}
        />
      </div>
    );
  }

  if (route.name === 'boss-victory') {
    return (
      <div className="mini-games">
        <BossVictoryScreen
          sectionId={route.sectionId}
          progress={progress.practice}
          onChooseSection={handleChooseSection}
          onFinish={() => replace({ name: 'map' })}
        />
      </div>
    );
  }

  if (route.name === 'level') {
    return (
      <div className="mini-games">
        <LevelScreen
          sectionId={route.sectionId}
          topicId={route.topicId}
          progress={progress.practice}
          onStart={() => startLevel(route.sectionId, route.topicId)}
        />
      </div>
    );
  }

  const isSandbox = typeof window !== 'undefined' && !(window as any).WebApp?.platform;

  return (
    <div className="mini-games">
      <MapScreen
        progress={progress.practice}
        onOpenTopic={(sectionId, topicId) => navigate({ name: 'level', sectionId, topicId })}
        onStartBoss={startBoss}
        onOpenForces={onOpenForceLab}
        onOpenFormulas={onOpenFormulaTrainer}
        onResetProgress={handleReset}
        isSandbox={isSandbox}
      />
    </div>
  );
};

const resultMeta = (
  config: SessionConfig,
  bossLost?: boolean,
): { title: string; subtitle: string; color: string; icon: React.ReactNode } => {
  if (config.kind === 'boss') {
    const section = getSection(config.sectionId);
    return {
      title: bossLost ? 'Босс не побеждён' : 'Дуэль завершена',
      subtitle: section ? `${section.boss} · ${section.title}` : 'Дуэль',
      color: section?.color ?? '#f59e0b',
      icon: <Swords size={30} />,
    };
  }

  const topicId = config.topicId;
  const xp = topicId ? topicMaxXp(topicId) : 0;
  const section = getSection(config.sectionId);

  return {
    title: 'Уровень завершён',
    subtitle: config.title,
    color: section?.color ?? '#0ea5e9',
    icon: <Trophy size={30} />,
  };
};
