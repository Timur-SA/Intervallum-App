import React, { useState } from 'react';
import { Button, BottomSheet } from '@maxhub/max-ui';
import { BookOpen, CircleCheck, Layers, Link2, ListChecks, Play, Sparkles } from 'lucide-react';
import { PracticeProgress } from '../../../shared/storage/progressStore';
import { getSection, getTopic } from '../domain/sections';
import { SectionId, TopicId } from '../domain/types';
import { isTopicComplete, topicMaxXp } from '../domain/progression';
import { TASK_BANK } from '../data';
import { CARDS } from '../data/cards';
import { haptics } from '../../../shared/motion/haptics';

interface LevelScreenProps {
  sectionId: SectionId;
  topicId: TopicId;
  progress: PracticeProgress;
  onStart: () => void;
}

const TYPE_ICONS = {
  single: <CircleCheck size={14} />,
  multi: <ListChecks size={14} />,
  matching: <Link2 size={14} />,
  cards: <Layers size={14} />,
} as const;

const TYPE_LABELS = {
  single: 'Выбор ответа',
  multi: 'Множественный выбор',
  matching: 'Соответствие',
  cards: 'Карточка',
} as const;

export const LevelScreen: React.FC<LevelScreenProps> = ({
  sectionId,
  topicId,
  progress,
  onStart,
}) => {
  const [theoryOpen, setTheoryOpen] = useState(false);

  const section = getSection(sectionId);
  const topic = getTopic(topicId);
  const xp = progress.xpByTopic[topicId] ?? 0;
  const max = topicMaxXp(topicId);
  const complete = isTopicComplete(progress, topicId);

  const tasks = TASK_BANK.filter(task => task.topic === topicId);
  const theory = CARDS.filter(card => card.topic === topicId);

  return (
    <div className="mg-screen">
      <div className="mg-scroll">
        <header className="mg-screen__head">
          <div>
            <h1 className="mg-screen__title">{topic ? topic.title : 'Уровень'}</h1>
            <p className="mg-screen__subtitle">{section ? section.title : 'Физика'}</p>
          </div>
          <span className="mg-xp">
            <Sparkles size={13} />
            <span className="mg-xp__value">{xp} XP</span>
          </span>
        </header>

        <div className="mg-topic-progress mg-topic-progress--wide">
          <span className="mg-topic-progress__bar">
            <span
              className="mg-topic-progress__fill"
              style={{
                width: `${Math.min(100, max ? (xp / max) * 100 : 0)}%`,
                backgroundColor: complete ? 'var(--success)' : 'var(--accent)',
              }}
            />
          </span>
          <span className="mg-topic-progress__value">{Math.round((max ? xp / max : 0) * 100)}%</span>
        </div>

        <Button
          variant="secondary"
          size="medium"
          stretched
          iconBefore={<BookOpen size={16} />}
          onClick={() => {
            haptics.selection();
            setTheoryOpen(true);
          }}
        >
          Теория · {theory.length}
        </Button>

        <div className="mg-list">
          {tasks.map(task => (
            <div key={task.id} className="mg-task-row">
              <span className="mg-task-row__icon">{TYPE_ICONS[task.type as keyof typeof TYPE_ICONS]}</span>
              <span className="mg-task-row__label">
                {TYPE_LABELS[task.type as keyof typeof TYPE_LABELS] ?? 'Задание'}
              </span>
              <span className="mg-task-row__xp">+{10 * task.difficulty} XP</span>
            </div>
          ))}
        </div>

        {complete && (
          <p className="mg-note">Уровень пройден на 100%. Можно повторить, чтобы закрепить.</p>
        )}

        <Button
          variant="primary"
          size="large"
          stretched
          iconBefore={<Play size={16} />}
          disabled={!tasks.length}
          onClick={() => {
            haptics.impact('medium');
            onStart();
          }}
        >
          {complete ? 'Пройти заново' : 'Начать уровень'}
        </Button>
      </div>

      <BottomSheet open={theoryOpen} title="Теория" onClose={() => setTheoryOpen(false)}>
        <div className="mg-theory">
          {theory.length === 0 && <p className="mg-theory__empty">Теория появится позже.</p>}
          {theory.map(card => (
            <div key={card.id} className="mg-theory__card">
              <div className="mg-theory__question">{card.question}</div>
              <div className="mg-theory__answer">{card.answer}</div>
              {card.details && <p className="mg-theory__details">{card.details}</p>}
              {card.formula && <div className="mg-theory__formula">{card.formula}</div>}
            </div>
          ))}
        </div>
      </BottomSheet>
    </div>
  );
};
