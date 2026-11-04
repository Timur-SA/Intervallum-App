import React from 'react';
import { Button } from '@maxhub/max-ui';
import { BookOpen, Play } from 'lucide-react';
import { PracticeProgress } from '../../../shared/storage/progressStore';
import { getSection, getTopic } from '../domain/sections';
import { SectionId, TopicId } from '../domain/types';
import { TOPIC_XP_THRESHOLD } from '../domain/progression';
import { CARDS } from '../data/cards';
import { TASK_BANK } from '../data';
import { haptics } from '../../../shared/motion/haptics';

interface TopicScreenProps {
  sectionId: SectionId;
  topicId: TopicId;
  progress: PracticeProgress;
  onStartPractice: () => void;
}

export const TopicScreen: React.FC<TopicScreenProps> = ({
  sectionId,
  topicId,
  progress,
  onStartPractice,
}) => {
  const section = getSection(sectionId);
  const topic = getTopic(topicId);
  const xp = progress.xpByTopic[topicId] ?? 0;

  const theory = CARDS.filter(card => card.topic === topicId);
  const practiceTasks = TASK_BANK.filter(
    task => task.topic === topicId && task.type !== 'cards',
  );

  return (
    <div className="mg-screen">
      <div className="mg-scroll">
        <header className="mg-screen__head">
          <div>
            <h1 className="mg-screen__title">{topic ? topic.title : 'Тема'}</h1>
            <p className="mg-screen__subtitle">{section ? section.title : 'Физика'}</p>
          </div>
        </header>

        <div className="mg-topic-progress mg-topic-progress--wide">
          <span className="mg-topic-progress__bar">
            <span
              className="mg-topic-progress__fill"
              style={{
                width: `${Math.min(100, (xp / TOPIC_XP_THRESHOLD) * 100)}%`,
                backgroundColor: section?.color ?? 'var(--accent)',
              }}
            />
          </span>
          <span className="mg-topic-progress__value">
            {Math.min(xp, TOPIC_XP_THRESHOLD)} / {TOPIC_XP_THRESHOLD}
          </span>
        </div>
        <p className="mg-topic-progress__caption">
          Прогресс темы открывает следующую тему раздела
        </p>

        <div className="mg-theory">
          <div className="mg-theory__head">
            <BookOpen size={16} color="var(--accent)" />
            <span>Теория</span>
          </div>

          {theory.length === 0 && (
            <p className="mg-theory__empty">Теория по этой теме появится позже.</p>
          )}

          {theory.map(card => (
            <div key={card.id} className="mg-theory__card">
              <div className="mg-theory__question">{card.question}</div>
              <div className="mg-theory__answer">{card.answer}</div>
              {card.details && <p className="mg-theory__details">{card.details}</p>}
              {card.formula && <div className="mg-theory__formula">{card.formula}</div>}
            </div>
          ))}
        </div>

        <Button
          variant="primary"
          size="large"
          stretched
          iconBefore={<Play size={16} />}
          disabled={practiceTasks.length === 0}
          onClick={() => {
            haptics.impact('medium');
            onStartPractice();
          }}
        >
          {practiceTasks.length > 0
            ? `Тренировать тему · ${practiceTasks.length}`
            : 'Заданий пока нет'}
        </Button>
      </div>
    </div>
  );
};
