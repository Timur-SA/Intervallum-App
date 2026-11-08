import React, { useEffect, useRef, useState } from 'react';
import './styles/mini-games.css';
import { Flame, Swords } from 'lucide-react';
import { AnyTask, SectionId, TopicId } from './domain/types';
import { getSection, getTopic } from './domain/sections';
import { BOSS_TIME_SECONDS, BOSS_WIN_SCORE } from './domain/progression';
import { TASK_BANK } from './data';
import { shuffleBySeed } from './engine/shuffle';
import { selectBossTasks } from './api/select';
import {
  defeatBoss,
  loadUserProgress,
  unlockSection,
} from '../../shared/storage/progressStore';
import { useNavigation } from '../../shell/HeaderContext';
import { JourneyMapScreen } from './screens/JourneyMapScreen';
import { TheoryScreen } from './screens/TheoryScreen';
import { SessionRunner, SessionSummary } from './renderers/SessionRunner';
import { ResultScreen } from './components/ResultScreen';

type SessionKind = 'level' | 'boss';

interface SessionConfig {
  kind: SessionKind;
  title: string;
  tasks: AnyTask[];
  timerSeconds?: number;
  seed?: string;
  sectionId: SectionId;
  topicId?: TopicId;
}

type Screen =
  | { name: 'journey' }
  | { name: 'theory'; sectionId: SectionId; topicId: TopicId }
  | { name: 'session'; config: SessionConfig }
  | { name: 'result'; config: SessionConfig; summary: SessionSummary; bossLost?: boolean };

interface MapModuleProps {
  /** Куда прокрутить карту после перехода с главного экрана. */
  focusTopicId?: TopicId | null;
}

export const MapModule: React.FC<MapModuleProps> = ({ focusTopicId = null }) => {
  const [route, setRoute] = useState<Screen>({ name: 'journey' });
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

  const startLevel = (sectionId: SectionId, topicId: TopicId) => {
    const seed = `${Date.now()}-${topicId}`;
    const tasks = shuffleBySeed(
      TASK_BANK.filter(task => task.topic === topicId),
      seed,
    );
    if (!tasks.length) return;

    navigate({
      name: 'session',
      config: {
        kind: 'level',
        title: getTopic(topicId)?.title ?? 'Уровень',
        tasks,
        seed,
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
        // Победа завершает вложенный маршрут: карта должна остаться
        // корневой вкладкой, иначе тапбар скрыт и overlay серии не срабатывает.
        setHistory([]);
        setRoute({ name: 'journey' });
        return;
      }

      setProgress(loadUserProgress());
      setRoute({ name: 'result', config, summary, bossLost: true });
      return;
    }

    setProgress(loadUserProgress());
    setHistory([{ name: 'journey' }]);
    setRoute({ name: 'result', config, summary });
  };

  const handleChooseSection = (sectionId: SectionId) => {
    unlockSection(sectionId);
    setProgress(loadUserProgress());
    setHistory([]);
    setRoute({ name: 'journey' });
  };

  if (route.name === 'theory') {
    return (
      <div className="mini-games">
        <TheoryScreen
          topicId={route.topicId}
          onStartPractice={() => startLevel(route.sectionId, route.topicId)}
        />
      </div>
    );
  }

  if (route.name === 'session') {
    return (
      <div className="mini-games">
        <SessionRunner
          tasks={route.config.tasks}
          timerSeconds={route.config.timerSeconds}
          seed={route.config.seed}
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
          celebrate={config.kind === 'level' && !summary.timeout}
          subtitle={
            config.kind === 'boss'
              ? `${section?.boss ?? ''} · ${section?.title ?? ''}`
              : config.title
          }
          color={
            config.kind === 'boss'
              ? 'var(--boss-color)'
              : section
                ? `var(--section-${section.id})`
                : 'var(--section-mechanics)'
          }
          icon={config.kind === 'boss' ? <Swords size={30} /> : <Flame size={30} />}
          title={
            bossLost
              ? 'Босс не побеждён'
              : config.kind === 'boss'
                ? 'Дуэль завершена'
                : 'Уровень завершён'
          }
          summary={summary}
          onRetry={() => setRoute({ name: 'session', config })}
          onBack={back}
          backLabel="Перейти к карте"
        />
      </div>
    );
  }

  return (
    <div className="mini-games">
      <JourneyMapScreen
        progress={progress.practice}
        focusTopicId={focusTopicId}
        onStartLevel={(sectionId, topicId) => navigate({ name: 'theory', sectionId, topicId })}
        onStartBoss={startBoss}
        onChooseSection={handleChooseSection}
      />
    </div>
  );
};
