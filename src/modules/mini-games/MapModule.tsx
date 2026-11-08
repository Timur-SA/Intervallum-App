import React, { useEffect, useRef, useState } from 'react';
import './styles/mini-games.css';
import { Flame, Swords } from 'lucide-react';
import { AnyTask, SectionId, TopicId } from './domain/types';
import { SECTIONS, getSection, getTopic } from './domain/sections';
import { BOSS_TIME_SECONDS, BOSS_WIN_SCORE, topicUnlockXp } from './domain/progression';
import { TASK_BANK } from './data';
import { shuffleBySeed } from './engine/shuffle';
import { selectBossTasks } from './api/select';
import {
  defeatBoss,
  loadUserProgress,
  saveUserProgress,
  totalXp,
  unlockSection,
} from '../../shared/storage/progressStore';
import { useNavigation } from '../../shell/HeaderContext';
import { JourneyMapScreen } from './screens/JourneyMapScreen';
import { TheoryScreen } from './screens/TheoryScreen';
import { SessionRunner, SessionSummary } from './renderers/SessionRunner';
import { ResultScreen } from './components/ResultScreen';

type SessionKind = 'level' | 'boss';

const firstSection = SECTIONS[0];
const [firstTopicId, nextTopicId] = firstSection.topics;

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
  | { name: 'result'; config: SessionConfig; summary: SessionSummary; bossLost?: boolean; progressHint?: string };

export const MapModule: React.FC = () => {
  const [route, setRoute] = useState<Screen>({ name: 'journey' });
  const [history, setHistory] = useState<Screen[]>([]);
  const [progress, setProgress] = useState(() => loadUserProgress());

  const { setNavigationConfig } = useNavigation();
  const { practice, onboarding } = progress;
  const showOnboarding = onboarding === 'started' || (
    !onboarding &&
    totalXp(practice) === 0 &&
    Object.keys(practice.taskStats).length === 0 &&
    practice.exploredTypes.length === 0 &&
    practice.unlockedSections.length === 0 &&
    practice.defeatedBosses.length === 0
  );

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

  const setOnboarding = (status: 'started' | 'skipped') => {
    const latest = loadUserProgress();
    if (status === 'skipped' || !latest.onboarding) {
      latest.onboarding = status;
      saveUserProgress(latest);
    }
    setProgress(latest);
  };

  const openTheory = (sectionId: SectionId, topicId: TopicId) => {
    if (showOnboarding && !onboarding && sectionId === firstSection.id && topicId === firstTopicId) {
      setOnboarding('started');
    }
    navigate({ name: 'theory', sectionId, topicId });
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
        setRoute({ name: 'journey' });
        return;
      }

      setProgress(loadUserProgress());
      setRoute({ name: 'result', config, summary, bossLost: true });
      return;
    }

    const latest = loadUserProgress();
    let progressHint: string | undefined;
    if (
      !summary.timeout &&
      config.sectionId === firstSection.id &&
      config.topicId === firstTopicId &&
      (latest.onboarding ?? onboarding) === 'started'
    ) {
      const nextTopic = getTopic(nextTopicId);
      if (nextTopic) {
        const remainingXp = topicUnlockXp(firstTopicId) - (latest.practice.xpByTopic[firstTopicId] ?? 0);
        progressHint = remainingXp > 0
          ? `До темы «${nextTopic.title}» осталось ${remainingXp} XP.`
          : `Открылась следующая тема «${nextTopic.title}».`;
      }
      latest.onboarding = 'completed';
      saveUserProgress(latest);
    }

    setProgress(latest);
    setHistory([{ name: 'journey' }]);
    setRoute({ name: 'result', config, summary, progressHint });
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
    const { config, summary, bossLost, progressHint } = route;
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
          progressHint={progressHint}
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
        onStartLevel={openTheory}
        onSkipOnboarding={showOnboarding ? () => setOnboarding('skipped') : undefined}
        onStartBoss={startBoss}
        onChooseSection={handleChooseSection}
      />
    </div>
  );
};
