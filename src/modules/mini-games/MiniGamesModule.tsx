import React, { useEffect, useState } from 'react';
import './styles/mini-games.css';
import { GameSummary, PlayableTaskType } from './domain/types';
import { loadUserProgress } from '../../shared/storage/progressStore';
import { useNavigation } from '../../shell/HeaderContext';
import { PreparationScreen } from './screens/PreparationScreen';
import { MiniGamesScreen } from './screens/MiniGamesScreen';
import { SingleChoiceGame } from './renderers/SingleChoiceGame';
import { MultiChoiceGame } from './renderers/MultiChoiceGame';
import { MatchingGame } from './renderers/MatchingGame';
import { FlashcardsGame } from './renderers/FlashcardsGame';
import { ResultScreen } from './components/ResultScreen';

interface MiniGamesModuleProps {
  onBackToHub: () => void;
  onOpenFormulaTrainer: () => void;
  onOpenForceLab: () => void;
  initialType?: PlayableTaskType | null;
}

const GAME_RENDERERS: Record<PlayableTaskType, React.FC<{
  onFinish: (summary: GameSummary) => void;
}>> = {
  single: SingleChoiceGame,
  multi: MultiChoiceGame,
  matching: MatchingGame,
  cards: FlashcardsGame,
};

export const MiniGamesModule: React.FC<MiniGamesModuleProps> = ({
  onBackToHub,
  onOpenFormulaTrainer,
  onOpenForceLab,
  initialType = null,
}) => {
  const [activeType, setActiveType] = useState<PlayableTaskType | null>(initialType);
  const [showList, setShowList] = useState(false);
  const [summary, setSummary] = useState<GameSummary | null>(null);
  const [sessionKey, setSessionKey] = useState(0);
  const [progress, setProgress] = useState(() => loadUserProgress());

  const { setNavigationConfig } = useNavigation();

  useEffect(() => {
    if (activeType) {
      setNavigationConfig({
        canGoBack: true,
        onBack: () => {
          setSummary(null);
          setActiveType(null);
        },
      });
      return;
    }

    if (showList) {
      setNavigationConfig({ canGoBack: true, onBack: () => setShowList(false) });
      return;
    }

    setNavigationConfig({ canGoBack: true, onBack: onBackToHub });
  }, [activeType, showList, onBackToHub, setNavigationConfig]);

  const startGame = (type: PlayableTaskType) => {
    setSummary(null);
    setActiveType(type);
    setSessionKey(previous => previous + 1);
  };

  const handleFinish = (gameSummary: GameSummary) => {
    setSummary(gameSummary);
    setProgress(loadUserProgress());
  };

  const handleRetry = () => {
    setSummary(null);
    setSessionKey(previous => previous + 1);
  };

  const handleBackToList = () => {
    setSummary(null);
    setActiveType(null);
    setProgress(loadUserProgress());
  };

  if (activeType && summary) {
    return (
      <div className="mini-games">
        <ResultScreen
          summary={summary}
          onRetry={handleRetry}
          onBackToList={handleBackToList}
        />
      </div>
    );
  }

  if (activeType) {
    const GameRenderer = GAME_RENDERERS[activeType];

    return (
      <div className="mini-games">
        <GameRenderer
          key={`${activeType}-${sessionKey}`}
          onFinish={handleFinish}
        />
      </div>
    );
  }

  if (showList) {
    return (
      <div className="mini-games">
        <MiniGamesScreen
          progress={progress.practice}
          onSelect={startGame}
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
        onOpenMiniGames={() => setShowList(true)}
      />
    </div>
  );
};
