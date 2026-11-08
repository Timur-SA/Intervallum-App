import React, { useEffect, useRef, useState } from 'react';
import './styles/mini-games.css';
import { Flame, Swords } from 'lucide-react';
import { AnyTask, SectionId, TopicId } from './domain/types';
import { SECTIONS, getSection, getTopic } from './domain/sections';
import { BOSS_TIME_SECONDS, BOSS_WIN_SCORE, isBossReady, isTopicUnlocked, topicUnlockXp, topicXp } from './domain/progression';
import { availableTrainingTopics, selectPersonalTraining, trainingTopics } from './api/personalTraining';
import { isTheoryRead, nextTrainingReview } from './domain/training';
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

const firstSection = SECTIONS[0];
const [firstTopicId, nextTopicId] = firstSection.topics;

type SessionConfig =
  | { kind: 'training'; tasks: AnyTask[]; seed: string }
  | { kind: 'boss'; title: string; tasks: AnyTask[]; timerSeconds: number; sectionId: SectionId };

type Screen =
  | { name: 'journey' }
  | { name: 'theory'; topicId: TopicId }
  | { name: 'session'; config: SessionConfig }
  | { name: 'result'; config: SessionConfig; summary: SessionSummary; bossLost?: boolean; progressHint?: string };

interface MapModuleProps {
  /** Куда прокрутить карту после перехода с главного экрана. */
  focusTopicId?: TopicId | null;
}

export const MapModule: React.FC<MapModuleProps> = ({ focusTopicId = null }) => {
  const [route, setRoute] = useState<Screen>({ name: 'journey' });
  const [history, setHistory] = useState<Screen[]>([]);
  const [progress, setProgress] = useState(() => loadUserProgress());

  const [now, setNow] = useState(Date.now);
  const [selecting, setSelecting] = useState(false);
  const trainingRequest = useRef(0);
  const { setNavigationConfig } = useNavigation();
  const { practice, onboarding } = progress;
  const showOnboarding = (onboarding === 'started' && !isTheoryRead(practice, firstTopicId)) || (
    !onboarding &&
    !practice.readTopicIds?.length &&
    totalXp(practice) === 0 &&
    Object.keys(practice.taskStats).length === 0 &&
    practice.exploredTypes.length === 0 &&
    practice.unlockedSections.length === 0 &&
    practice.defeatedBosses.length === 0
  );

  const eligible = availableTrainingTopics(practice, now);
  const nextReview = nextTrainingReview(practice, trainingTopics(practice), now);
  const hasUnreadTopic = SECTIONS.some(section => section.topics.some(topic =>
    isTopicUnlocked(practice, section.id, topic) && !isTheoryRead(practice, topic),
  ));
  const trainingHint = eligible.length
    ? 'Задачи из изученных тем и повторение в нужный момент.'
    : nextReview && !hasUnreadTopic
      ? `Ближайшее повторение — ${new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }).format(nextReview)}.`
      : 'Прочитай теорию открытой темы, чтобы добавить её задачи.';

  useEffect(() => {
    const update = () => setNow(Date.now());
    const timer = window.setInterval(update, 30_000);
    window.addEventListener('focus', update);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', update);
    };
  }, []);

  const cancelTrainingSelection = () => {
    trainingRequest.current += 1;
    setSelecting(false);
  };

  const back = () => {
    cancelTrainingSelection();
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
    cancelTrainingSelection();
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
    navigate({ name: 'theory', topicId });
  };

  const finishTheory = (topicId: TopicId) => {
    const latest = loadUserProgress();
    const read = latest.practice.readTopicIds ??= [];
    if (!read.includes(topicId)) {
      read.push(topicId);
      saveUserProgress(latest);
    }
    back();
  };

  const startTraining = async () => {
    if (selecting) return;
    const request = ++trainingRequest.current;
    const startedAt = Date.now();
    setSelecting(true);
    try {
      const latest = loadUserProgress();
      const tasks = await selectPersonalTraining(latest.practice, startedAt);
      if (request !== trainingRequest.current) return;
      setProgress(latest);
      setNow(startedAt);
      if (tasks.length) {
        setHistory([{ name: 'journey' }]);
        setRoute({ name: 'session', config: { kind: 'training', tasks, seed: String(startedAt) } });
      }
    } finally {
      if (request === trainingRequest.current) setSelecting(false);
    }
  };

  const startBoss = (sectionId: SectionId) => {
    const section = getSection(sectionId);
    if (!section || !isBossReady(loadUserProgress().practice, sectionId)) return;

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

    const latest = loadUserProgress();
    let progressHint: string | undefined;
    if (
      !summary.timeout &&
      summary.topicChanges.some(change => change.topicId === firstTopicId) &&
      (latest.onboarding ?? onboarding) === 'started'
    ) {
      const nextTopic = getTopic(nextTopicId);
      if (nextTopic) {
        const remainingXp = topicUnlockXp(firstTopicId) - topicXp(latest.practice, firstTopicId);
        progressHint = isTopicUnlocked(latest.practice, firstSection.id, nextTopicId)
          ? `Открылась тема «${nextTopic.title}». Прочитай её теорию, чтобы добавить задачи.`
          : `До темы «${nextTopic.title}» осталось ${remainingXp} XP.`;
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
          alreadyRead={isTheoryRead(practice, route.topicId)}
          onFinish={() => finishTheory(route.topicId)}
        />
      </div>
    );
  }

  if (route.name === 'session') {
    return (
      <div className="mini-games">
        <SessionRunner
          tasks={route.config.tasks}
          timerSeconds={route.config.kind === 'boss' ? route.config.timerSeconds : undefined}
          seed={route.config.kind === 'training' ? route.config.seed : undefined}
          personalTraining={route.config.kind === 'training'}
          onComplete={handleComplete}
        />
      </div>
    );
  }

  if (route.name === 'result') {
    const { config, summary, bossLost, progressHint } = route;
    const section = config.kind === 'boss' ? getSection(config.sectionId) : undefined;

    return (
      <div className="mini-games">
        <ResultScreen
          celebrate={config.kind === 'training' && summary.xp > 0}
          subtitle={
            config.kind === 'boss'
              ? `${section?.boss ?? ''} · ${section?.title ?? ''}`
              : 'Изменение знаний по темам'
          }
          color={
            config.kind === 'boss'
              ? 'var(--boss-color)'
              : 'var(--section-mechanics)'
          }
          icon={config.kind === 'boss' ? <Swords size={30} /> : <Flame size={30} />}
          title={
            bossLost
              ? 'Босс не побеждён'
              : config.kind === 'boss'
                ? 'Дуэль завершена'
                : 'Тренировка завершена'
          }
          summary={summary}
          progressHint={progressHint}
          onRetry={config.kind === 'boss'
            ? () => setRoute({ name: 'session', config })
            : eligible.length ? startTraining : undefined}
          retryLabel={config.kind === 'training' ? 'Ещё тренировка' : undefined}
          retryPending={selecting}
          onBack={back}
          backLabel="Перейти к карте"
        />
      </div>
    );
  }

  return (
    <div className="mini-games">
      <JourneyMapScreen
        progress={practice}
        focusTopicId={focusTopicId}
        now={now}
        trainingHint={trainingHint}
        trainingPending={selecting}
        onStartTraining={eligible.length ? startTraining : undefined}
        onStartLevel={openTheory}
        onSkipOnboarding={showOnboarding ? () => setOnboarding('skipped') : undefined}
        onStartBoss={startBoss}
        onChooseSection={handleChooseSection}
      />
    </div>
  );
};
