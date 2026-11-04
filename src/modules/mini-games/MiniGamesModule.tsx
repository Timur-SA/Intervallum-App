import React, { useEffect, useRef, useState } from 'react';
import './styles/mini-games.css';
import { CircleCheck, Layers, Link2, ListChecks, Swords, Target, Timer, Trophy } from 'lucide-react';
import { AnyTask, PlayableTaskType, SectionId, TopicId } from './domain/types';
import { SECTIONS, getSection, getTopic } from './domain/sections';
import {
  BOSS_TIME_SECONDS,
  BOSS_WIN_SCORE,
  isSectionUnlocked,
  TRAINING_TASKS,
} from './domain/progression';
import { getMiniGameMeta } from './data';
import { selectBossTasks, selectTrain } from './api/select';
import {
  defeatBoss,
  loadUserProgress,
  unlockSection,
} from '../../shared/storage/progressStore';
import { useNavigation } from '../../shell/HeaderContext';
import { PreparationScreen } from './screens/PreparationScreen';
import { MiniGamesScreen } from './screens/MiniGamesScreen';
import { CourseScreen } from './screens/CourseScreen';
import { SectionScreen } from './screens/SectionScreen';
import { TopicScreen } from './screens/TopicScreen';
import { TrainingScreen } from './screens/TrainingScreen';
import { BossesScreen } from './screens/BossesScreen';
import { BossVictoryScreen } from './screens/BossVictoryScreen';
import { SessionRunner, SessionSummary } from './renderers/SessionRunner';
import { ResultScreen } from './components/ResultScreen';

interface MiniGamesModuleProps {
  onBackToHub: () => void;
  onOpenFormulaTrainer: () => void;
  onOpenForceLab: () => void;
}

type SessionKind = 'mini-game' | 'topic' | 'training' | 'boss';

interface SessionConfig {
  kind: SessionKind;
  title: string;
  tasks: AnyTask[];
  timerSeconds?: number;
  sectionId?: SectionId;
  topicId?: TopicId;
}

type Screen =
  | { name: 'preparation' }
  | { name: 'mini-games' }
  | { name: 'course' }
  | { name: 'section'; sectionId: SectionId }
  | { name: 'topic'; sectionId: SectionId; topicId: TopicId }
  | { name: 'training' }
  | { name: 'bosses' }
  | { name: 'session'; config: SessionConfig }
  | { name: 'result'; config: SessionConfig; summary: SessionSummary; bossLost?: boolean }
  | { name: 'boss-victory'; sectionId: SectionId };

const GAME_ICONS: Record<PlayableTaskType, React.ReactNode> = {
  single: <CircleCheck size={30} />,
  multi: <ListChecks size={30} />,
  matching: <Link2 size={30} />,
  cards: <Layers size={30} />,
};

export const MiniGamesModule: React.FC<MiniGamesModuleProps> = ({
  onBackToHub,
  onOpenFormulaTrainer,
  onOpenForceLab,
}) => {
  const [route, setRoute] = useState<Screen>({ name: 'preparation' });
  const [history, setHistory] = useState<Screen[]>([]);
  const [progress, setProgress] = useState(() => loadUserProgress());

  const { setNavigationConfig } = useNavigation();

  const back = () => {
    setProgress(loadUserProgress());
    if (!history.length) {
      onBackToHub();
      return;
    }
    const previous = history[history.length - 1];
    setHistory(previousHistory => previousHistory.slice(0, -1));
    setRoute(previous);
  };

  const backRef = useRef(back);
  backRef.current = back;

  useEffect(() => {
    setNavigationConfig({ canGoBack: true, onBack: () => backRef.current() });
  }, [setNavigationConfig]);

  const navigate = (next: Screen) => {
    setHistory(previous => [...previous, route]);
    setRoute(next);
  };

  const startSession = (config: SessionConfig) => {
    if (route.name === 'session' || route.name === 'result' || route.name === 'boss-victory') {
      setRoute({ name: 'session', config });
      return;
    }
    setHistory(previous => [...previous, route]);
    setRoute({ name: 'session', config });
  };

  const startMiniGame = (type: PlayableTaskType) => {
    const tasks = selectTrain(
      { count: 10, type, seed: String(Date.now()) },
      progress.practice,
    );
    startSession({
      kind: 'mini-game',
      title: getMiniGameMeta(type).title,
      tasks,
    });
  };

  const startTopicSession = (sectionId: SectionId, topicId: TopicId) => {
    const tasks = selectTrain(
      {
        count: 5,
        topicId,
        excludeTypes: ['cards'],
        seed: String(Date.now()),
      },
      progress.practice,
    );

    if (!tasks.length) return;

    startSession({
      kind: 'topic',
      title: getTopic(topicId)?.title ?? 'Тема',
      tasks,
      sectionId,
      topicId,
    });
  };

  const startTraining = (sectionId?: SectionId) => {
    const allowedSections = SECTIONS.filter(section =>
      isSectionUnlocked(progress.practice, section.id),
    ).map(section => section.id);

    const tasks = selectTrain(
      {
        count: TRAINING_TASKS,
        sectionId,
        sectionIds: sectionId ? undefined : allowedSections,
        seed: String(Date.now()),
      },
      progress.practice,
    );

    if (!tasks.length) return;

    startSession({
      kind: 'training',
      title: 'Тренировка',
      tasks,
      sectionId,
    });
  };

  const startBoss = (sectionId: SectionId) => {
    const section = getSection(sectionId);
    if (!section) return;

    const tasks = selectBossTasks(sectionId, progress.practice);

    startSession({
      kind: 'boss',
      title: `Дуэль: ${section.boss}`,
      tasks,
      timerSeconds: BOSS_TIME_SECONDS,
      sectionId,
    });
  };

  const handleSessionComplete = (summary: SessionSummary) => {
    if (route.name !== 'session') return;
    const { config } = route;

    if (config.kind === 'boss' && config.sectionId) {
      const section = getSection(config.sectionId);
      const win = !summary.timeout && summary.solved >= BOSS_WIN_SCORE;

      if (win && section) {
        defeatBoss({ sectionId: section.id, itemId: section.itemId });
        setProgress(loadUserProgress());
        setRoute({ name: 'boss-victory', sectionId: section.id });
        return;
      }

      setProgress(loadUserProgress());
      setRoute({ name: 'result', config, summary, bossLost: true });
      return;
    }

    setProgress(loadUserProgress());
    setRoute({ name: 'result', config, summary });
  };

  const handleChooseSection = (sectionId: SectionId) => {
    unlockSection(sectionId);
    setProgress(loadUserProgress());
    setRoute({ name: 'section', sectionId });
  };

  if (route.name === 'session') {
    return (
      <div className="mini-games">
        <SessionRunner
          tasks={route.config.tasks}
          timerSeconds={route.config.timerSeconds}
          onComplete={handleSessionComplete}
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
          onRetry={() => startSession(config)}
          onBack={back}
          backLabel={config.kind === 'boss' ? 'К боссам' : 'Продолжить'}
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
          onFinish={back}
        />
      </div>
    );
  }

  if (route.name === 'section') {
    return (
      <div className="mini-games">
        <SectionScreen
          sectionId={route.sectionId}
          progress={progress.practice}
          onOpenTopic={topicId => navigate({ name: 'topic', sectionId: route.sectionId, topicId })}
          onStartBoss={() => startBoss(route.sectionId)}
        />
      </div>
    );
  }

  if (route.name === 'topic') {
    return (
      <div className="mini-games">
        <TopicScreen
          sectionId={route.sectionId}
          topicId={route.topicId}
          progress={progress.practice}
          onStartPractice={() => startTopicSession(route.sectionId, route.topicId)}
        />
      </div>
    );
  }

  if (route.name === 'course') {
    return (
      <div className="mini-games">
        <CourseScreen
          progress={progress.practice}
          onOpenSection={sectionId => navigate({ name: 'section', sectionId })}
        />
      </div>
    );
  }

  if (route.name === 'training') {
    return (
      <div className="mini-games">
        <TrainingScreen progress={progress.practice} onStart={startTraining} />
      </div>
    );
  }

  if (route.name === 'bosses') {
    return (
      <div className="mini-games">
        <BossesScreen progress={progress.practice} onStartBoss={startBoss} />
      </div>
    );
  }

  if (route.name === 'mini-games') {
    return (
      <div className="mini-games">
        <MiniGamesScreen
          progress={progress.practice}
          onSelect={startMiniGame}
          onOpenInteractive={onOpenFormulaTrainer}
          onOpenForces={onOpenForceLab}
        />
      </div>
    );
  }

  return (
    <div className="mini-games">
      <PreparationScreen
        progress={progress.practice}
        onOpenMiniGames={() => navigate({ name: 'mini-games' })}
        onOpenCourse={() => navigate({ name: 'course' })}
        onOpenTraining={() => navigate({ name: 'training' })}
        onOpenBosses={() => navigate({ name: 'bosses' })}
      />
    </div>
  );
};

const resultMeta = (
  config: SessionConfig,
  bossLost?: boolean,
): { title: string; subtitle: string; color: string; icon: React.ReactNode } => {
  if (config.kind === 'boss') {
    const section = config.sectionId ? getSection(config.sectionId) : undefined;
    return {
      title: bossLost ? 'Босс не побеждён' : 'Дуэль завершена',
      subtitle: section ? `${section.boss} · ${section.title}` : 'Дуэль',
      color: section?.color ?? '#f59e0b',
      icon: <Swords size={30} />,
    };
  }

  if (config.kind === 'training') {
    return {
      title: 'Тренировка завершена',
      subtitle: 'Смешанные задания',
      color: '#8b5cf6',
      icon: <Timer size={30} />,
    };
  }

  if (config.kind === 'topic') {
    return {
      title: 'Тема пройдена',
      subtitle: config.title,
      color: '#0ea5e9',
      icon: <Target size={30} />,
    };
  }

  const game = getMiniGameMeta(config.tasks[0]?.type as PlayableTaskType);
  return {
    title: 'Раунд завершён',
    subtitle: game.title,
    color: game.color,
    icon: GAME_ICONS[game.type] ?? <Trophy size={30} />,
  };
};
