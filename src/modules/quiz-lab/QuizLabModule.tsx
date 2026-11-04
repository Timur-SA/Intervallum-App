import React, { useEffect, useMemo, useState } from 'react';
import { CellSimple, Typography } from '@maxhub/max-ui';
import { ChevronRight, Sparkles, Star } from 'lucide-react';
import './styles/quiz-lab.css';
import { GameId, GameResult } from './types';
import { QUIZ_GAMES } from './config';
import { haptics } from '../../shared/motion/haptics';
import { loadUserProgress, markQuizGameCompleted } from '../../shared/storage/progressStore';
import { useNavigation } from '../../shell/HeaderContext';
import { SINGLE_CHOICE_QUESTIONS } from './data/singleChoice';
import { MULTI_CHOICE_QUESTIONS } from './data/multiChoice';
import { MATCHING_QUESTIONS } from './data/matching';
import { THEORY_CARDS } from './data/theoryCards';
import { SingleChoiceGame } from './components/SingleChoiceGame';
import { MultiChoiceGame } from './components/MultiChoiceGame';
import { MatchingGame } from './components/MatchingGame';
import { FlashcardsGame } from './components/FlashcardsGame';
import { ResultScreen } from './components/ResultScreen';

interface QuizLabModuleProps {
  onBackToHub: () => void;
  initialGame?: GameId | null;
}

const COUNTS: Record<GameId, string> = {
  single: `${SINGLE_CHOICE_QUESTIONS.length} вопросов`,
  multi: `${MULTI_CHOICE_QUESTIONS.length} вопроса`,
  matching: `${MATCHING_QUESTIONS.length} задания`,
  cards: `${THEORY_CARDS.length} карточек`,
};

const GAME_COMPONENTS: Record<GameId, React.FC<{
  onExit: () => void;
  onFinish: (result: GameResult) => void;
}>> = {
  single: SingleChoiceGame,
  multi: MultiChoiceGame,
  matching: MatchingGame,
  cards: FlashcardsGame,
};

export const QuizLabModule: React.FC<QuizLabModuleProps> = ({
  onBackToHub,
  initialGame = null,
}) => {
  const [activeGame, setActiveGame] = useState<GameId | null>(initialGame);
  const [result, setResult] = useState<GameResult | null>(null);
  const [sessionKey, setSessionKey] = useState(0);
  const [progress, setProgress] = useState(() => loadUserProgress());

  const { setNavigationConfig } = useNavigation();

  useEffect(() => {
    if (activeGame) {
      setNavigationConfig({
        canGoBack: true,
        onBack: () => {
          setActiveGame(null);
          setResult(null);
        },
      });
      return;
    }

    setNavigationConfig({ canGoBack: true, onBack: onBackToHub });
  }, [activeGame, onBackToHub, setNavigationConfig]);

  const totalStars = useMemo(
    () => Object.values(progress.quizLab.bestStars).reduce((sum, value) => sum + value, 0),
    [progress],
  );

  const startGame = (id: GameId) => {
    haptics.impact('medium');
    setResult(null);
    setActiveGame(id);
    setSessionKey(previous => previous + 1);
  };

  const handleFinish = (gameResult: GameResult) => {
    const updated = markQuizGameCompleted(gameResult.gameId, gameResult.stars);
    setProgress(updated);
    setResult(gameResult);
    haptics.notification('success');
  };

  const handleRetry = () => {
    setResult(null);
    setSessionKey(previous => previous + 1);
  };

  const handleBackToList = () => {
    setResult(null);
    setActiveGame(null);
  };

  if (activeGame && result) {
    return (
      <div className="quiz-lab">
        <ResultScreen
          result={result}
          onRetry={handleRetry}
          onBackToList={handleBackToList}
        />
      </div>
    );
  }

  if (activeGame) {
    const GameComponent = GAME_COMPONENTS[activeGame];

    return (
      <div className="quiz-lab">
        <GameComponent
          key={`${activeGame}-${sessionKey}`}
          onExit={handleBackToList}
          onFinish={handleFinish}
        />
      </div>
    );
  }

  return (
    <div className="quiz-lab">
      <div className="ql-scroll">
        <div className="ql-landing__header">
          <div>
            <h1 className="ql-landing__title">Практикум ОГЭ</h1>
            <p className="ql-landing__subtitle">
              Четыре мини-игры: выбор ответа, соответствие и карточки для повторения теории
            </p>
          </div>

          <span className="ql-landing__score">
            <Star size={14} fill="#f59e0b" />
            {totalStars}
          </span>
        </div>

        <div className="ql-landing__games">
          {QUIZ_GAMES.map(game => {
            const stars = progress.quizLab.bestStars[game.id] ?? 0;

            return (
              <CellSimple
                key={game.id}
                as="button"
                className="ql-game-row"
                height="normal"
                onClick={() => startGame(game.id)}
                overline={game.subtitle}
                title={game.title}
                subtitle={`${COUNTS[game.id]} · ${game.badge}`}
                before={
                  <span
                    className="ql-game-row__icon"
                    style={{ backgroundColor: game.color }}
                    aria-hidden
                  >
                    {game.icon}
                  </span>
                }
                after={
                  stars > 0 ? (
                    <span className="ql-game-row__stars">
                      <Star size={13} fill="#f59e0b" />
                      {stars}
                    </span>
                  ) : (
                    <ChevronRight size={18} color="var(--text-muted)" />
                  )
                }
              />
            );
          })}
        </div>

        <div className="ql-landing__hint">
          <Sparkles size={17} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }} />
          <Typography.Text style={{ fontSize: 12.5, lineHeight: 1.45 }}>
            Раунд занимает 2–3 минуты. Ошибки не штрафуют — сразу показываем разбор и формулу,
            поэтому лучше пройти все четыре игры подряд.
          </Typography.Text>
        </div>
      </div>
    </div>
  );
};
