import React, { useMemo, useState } from 'react';
import { Button, StatusBadge } from '@maxhub/max-ui';
import { miniGamesApi } from '../api';
import { GradeResponse } from '../api/contracts';
import { MATCHING_TASKS } from '../data/matching';
import { GameSummary } from '../domain/types';
import { getSectionByTopic, getTopic } from '../domain/sections';
import { shuffleBySeed } from '../engine/shuffle';
import { haptics } from '../../../shared/motion/haptics';
import { recordPracticeResult } from '../../../shared/storage/progressStore';
import { GameShell } from '../components/GameShell';
import { FeedbackPanel } from '../components/FeedbackPanel';

interface GameProps {
  onFinish: (summary: GameSummary) => void;
}

const sumXp = (xp: Record<string, number | undefined>): number =>
  Object.values(xp).reduce((sum: number, value) => sum + (value ?? 0), 0);

export const MatchingGame: React.FC<GameProps> = ({ onFinish }) => {
  const total = MATCHING_TASKS.length;

  const [index, setIndex] = useState(0);
  const [leftSelected, setLeftSelected] = useState<string | null>(null);
  const [links, setLinks] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const [errors, setErrors] = useState(0);
  const [grade, setGrade] = useState<GradeResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [correctSum, setCorrectSum] = useState(0);
  const [xp, setXp] = useState(0);

  const task = MATCHING_TASKS[index];
  const topic = getTopic(task.topic);
  const section = getSectionByTopic(task.topic);
  const isLast = index + 1 >= total;

  const rightItems = useMemo(() => shuffleBySeed(task.pairs, task.id), [task]);
  const allLinked = Object.keys(links).length === task.pairs.length;

  const resetCheck = () => {
    setChecked(false);
    setWrongIds([]);
  };

  const handleLeft = (id: string) => {
    if (solved) return;
    resetCheck();
    haptics.selection();

    if (links[id]) {
      const next = { ...links };
      delete next[id];
      setLinks(next);
    }

    setLeftSelected(previous => (previous === id ? null : id));
  };

  const handleRight = (rightId: string) => {
    if (solved || !leftSelected) return;
    resetCheck();
    haptics.selection();

    const next: Record<string, string> = {};
    for (const [leftId, linkedRightId] of Object.entries(links)) {
      if (leftId !== leftSelected && linkedRightId !== rightId) {
        next[leftId] = linkedRightId;
      }
    }
    next[leftSelected] = rightId;

    setLinks(next);
    setLeftSelected(null);
  };

  const handleCheck = async () => {
    if (!allLinked || busy) return;

    const wrong = task.pairs.filter(pair => links[pair.id] !== pair.id).map(pair => pair.id);

    setChecked(true);
    setWrongIds(wrong);

    // Оценка фиксируется по первой попытке — повторные исправления её не повышают.
    if (!grade) {
      setBusy(true);
      const result = await miniGamesApi.grade({
        taskId: task.id,
        answer: { type: 'matching', links },
      });
      setBusy(false);
      setGrade(result);
      setCorrectSum(previous => previous + result.score);
      setXp(previous => previous + sumXp(result.xpByTopic));

      recordPracticeResult({
        taskType: 'matching',
        topicId: task.topic,
        xp: sumXp(result.xpByTopic),
        score: result.score,
      });
    }

    if (!wrong.length) {
      setSolved(true);
      haptics.notification('success');
      return;
    }

    setErrors(previous => previous + wrong.length);
    haptics.notification('error');
  };

  const handleContinue = () => {
    if (!solved) return;

    const nextCorrect = correctSum;

    if (isLast) {
      onFinish({
        type: 'matching',
        tasks: total,
        score: nextCorrect / total,
        correct: nextCorrect,
        xp,
        bestStreak: 0,
      });
      return;
    }

    haptics.selection();
    setIndex(index + 1);
    setLeftSelected(null);
    setLinks({});
    setChecked(false);
    setWrongIds([]);
    setErrors(0);
    setSolved(false);
    setGrade(null);
  };

  const rightOwner = (rightId: string) =>
    Object.entries(links).find(([, linkedRight]) => linkedRight === rightId)?.[0];

  return (
    <GameShell
      title="Соответствие"
      step={index}
      total={total}
      footer={
        <>
          {checked && solved && (
            <FeedbackPanel
              status="correct"
              title="Все пары верны!"
              explanation={
                grade && grade.score < 1
                  ? `${task.explanation} Первая попытка была неверной, поэтому засчитано ${Math.round(grade.score * 100)}%.`
                  : task.explanation
              }
              xp={grade ? sumXp(grade.xpByTopic) : 0}
            />
          )}

          {checked && !solved && (
            <FeedbackPanel
              status="wrong"
              title={`Ошибок: ${wrongIds.length}`}
              explanation="Пары, выделенные красным, составлены неверно. Измените их и проверьте снова."
            />
          )}

          <Button
            variant="primary"
            size="large"
            stretched
            loading={busy}
            disabled={!solved && !allLinked}
            onClick={solved ? handleContinue : handleCheck}
            style={{ marginTop: checked ? 12 : 0 }}
          >
            {solved
              ? isLast
                ? 'Завершить'
                : 'Продолжить'
              : checked
                ? 'Проверить ещё раз'
                : 'Проверить'}
          </Button>
        </>
      }
    >
      <div className="mg-question__meta">
        <StatusBadge status="neutral" text={section ? section.title : 'Физика'} />
        <span className="mg-question__meta-text">
          {topic ? topic.title : ''} · {index + 1} из {total}
        </span>
      </div>

      <p className="mg-question__prompt">{task.prompt}</p>
      <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-muted)' }}>
        Нажмите на элемент слева, затем на подходящий элемент справа
        {errors > 0 ? ` · ошибок за раунд: ${errors}` : ''}
      </p>

      <div className="mg-match">
        <div className="mg-match__col">
          <div className="mg-match__col-title">Слева</div>
          {task.pairs.map(pair => {
            const linkedRightId = links[pair.id];
            const linkedRightText = linkedRightId
              ? task.pairs.find(item => item.id === linkedRightId)?.right
              : undefined;

            const className = [
              'mg-tile',
              linkedRightId ? 'mg-tile--linked' : '',
              leftSelected === pair.id ? 'mg-tile--selected' : '',
              wrongIds.includes(pair.id) ? 'mg-tile--wrong' : '',
              solved && links[pair.id] === pair.id ? 'mg-tile--correct' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <Button
                key={pair.id}
                variant={leftSelected === pair.id ? 'primary' : 'secondary'}
                size="small"
                stretched
                className={className}
                innerClassNames={{ content: 'mg-tile__content' }}
                onClick={() => handleLeft(pair.id)}
              >
                <span className="mg-tile__stack">
                  <span>{pair.left}</span>
                  {linkedRightText && <span className="mg-tile__link">→ {linkedRightText}</span>}
                </span>
              </Button>
            );
          })}
        </div>

        <div className="mg-match__col">
          <div className="mg-match__col-title">Справа</div>
          {rightItems.map(pair => {
            const owner = rightOwner(pair.id);
            const className = [
              'mg-tile',
              owner ? 'mg-tile--taken' : '',
              owner && wrongIds.includes(owner) ? 'mg-tile--wrong' : '',
              solved && owner ? 'mg-tile--correct' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <Button
                key={pair.id}
                variant="secondary"
                size="small"
                stretched
                className={className}
                innerClassNames={{ content: 'mg-tile__content' }}
                onClick={() => handleRight(pair.id)}
              >
                {pair.right}
              </Button>
            );
          })}
        </div>
      </div>
    </GameShell>
  );
};
