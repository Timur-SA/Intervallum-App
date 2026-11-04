import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BottomSheet, Button } from '@maxhub/max-ui';
import { BookOpen, Flame, Lock, Play, Sparkles, Trophy } from 'lucide-react';
import { PracticeProgress, totalXp } from '../../../shared/storage/progressStore';
import { getSection, getTopic } from '../domain/sections';
import { SectionId, TopicId } from '../domain/types';
import {
  bossXpRequired,
  isBossReady,
  isSectionDefeated,
  isTopicComplete,
  isTopicUnlocked,
  sectionXp,
  topicMaxXp,
} from '../domain/progression';
import { TASK_BANK } from '../data';
import { ANSWER_KIND_LABELS, CARDS } from '../data/cards';
import { haptics } from '../../../shared/motion/haptics';

interface SectionMapScreenProps {
  sectionId: SectionId;
  progress: PracticeProgress;
  onStartLevel: (topicId: TopicId) => void;
  onStartBoss: () => void;
}

const Ring: React.FC<{ value: number; max: number; size: number; color: string; done?: boolean }> = ({
  value,
  max,
  size,
  color,
  done,
}) => {
  const radius = size / 2 - 4;
  const circumference = 2 * Math.PI * radius;
  const ratio = max ? Math.min(1, value / max) : 0;

  return (
    <svg className="mg-node__ring" viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={radius} className="mg-node__track" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        className="mg-node__fill"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - ratio)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ stroke: done ? 'var(--success)' : color }}
      />
    </svg>
  );
};

export const SectionMapScreen: React.FC<SectionMapScreenProps> = ({
  sectionId,
  progress,
  onStartLevel,
  onStartBoss,
}) => {
  const section = getSection(sectionId);
  const [selectedTopic, setSelectedTopic] = useState<TopicId | null>(null);
  const [theoryOpen, setTheoryOpen] = useState(false);
  const [theoryIndex, setTheoryIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const pathRef = useRef<HTMLDivElement>(null);
  const [road, setRoad] = useState('');

  useLayoutEffect(() => {
    const container = pathRef.current;
    if (!container) return;

    const base = container.getBoundingClientRect();
    const nodes = [...container.querySelectorAll<HTMLElement>('.mg-node')];
    const points = nodes.map(node => {
      const rect = node.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2 - base.left,
        y: rect.top + rect.height / 2 - base.top,
      };
    });

    setRoad(points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' '));
  }, [progress, sectionId]);

  useEffect(() => {
    const onResize = () => setRoad(current => current);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (!section) return null;

  const xp = sectionXp(progress, sectionId);
  const bossRequired = bossXpRequired(sectionId);
  const bossReady = isBossReady(progress, sectionId);
  const defeated = isSectionDefeated(progress, sectionId);
  const currentIndex = section.topics.findIndex(
    topicId => !isTopicComplete(progress, topicId) && isTopicUnlocked(progress, sectionId, topicId),
  );

  const selectedTopicMeta = selectedTopic ? getTopic(selectedTopic) : null;
  const selectedTasks = selectedTopic
    ? TASK_BANK.filter(task => task.topic === selectedTopic)
    : [];
  const selectedTheory = selectedTopic
    ? CARDS.filter(card => card.topic === selectedTopic)
    : [];

  return (
    <div className="mg-screen">
      <div className="mg-scroll">
        <header className="mg-screen__head mg-screen__head--sticky">
          <h1 className="mg-screen__title">{section.title}</h1>
          <span className="mg-xp">
            <Sparkles size={13} />
            <span className="mg-xp__value">{totalXp(progress)} XP</span>
          </span>
        </header>

        <div className="mg-path" ref={pathRef}>
          <svg className="mg-path__road" aria-hidden>
            <path d={road} />
          </svg>
          {section.topics.map((topicId, index) => {
            const topic = getTopic(topicId);
            const levelXp = progress.xpByTopic[topicId] ?? 0;
            const max = topicMaxXp(topicId);
            const unlocked = isTopicUnlocked(progress, sectionId, topicId);
            const complete = isTopicComplete(progress, topicId);
            const current = index === currentIndex;
            const offset = Math.round(Math.sin((index + 1) * 1.7) * 42);

            return (
              <div key={topicId} className="mg-path__row mg-path__row--chaos">
                <div
                  className="mg-path__node-wrap"
                  style={{ transform: `translateX(${offset}px)` }}
                >
                  {current && !complete && <span className="mg-path__start">Начать</span>}

                  <button
                    type="button"
                    className={[
                      'mg-node',
                      complete ? 'mg-node--done' : '',
                      current ? 'mg-node--current' : '',
                      !unlocked ? 'mg-node--locked' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    disabled={!unlocked}
                    onClick={() => {
                      haptics.selection();
                      setSelectedTopic(topicId);
                    }}
                    aria-label={topic?.title ?? ''}
                  >
                    <Ring value={levelXp} max={max} size={64} color={section.color} done={complete} />
                    <span className="mg-node__inner">
                      {complete ? <Trophy size={18} /> : unlocked ? index + 1 : <Lock size={16} />}
                    </span>
                  </button>

                  <span className="mg-path__caption mg-path__caption--center">
                    {topic?.title}
                  </span>
                </div>
              </div>
            );
          })}

          <div className="mg-path__row mg-path__row--center">
            <div className="mg-path__node-wrap">
              <button
                type="button"
                className={[
                  'mg-node',
                  'mg-node--boss',
                  bossReady ? 'mg-node--boss-ready' : '',
                  defeated ? 'mg-node--boss-done' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                disabled={!bossReady || defeated}
                onClick={() => {
                  haptics.impact('heavy');
                  onStartBoss();
                }}
                aria-label={`Босс ${section.boss}`}
              >
                <Ring
                  value={xp}
                  max={bossRequired}
                  size={96}
                  color="#f59e0b"
                  done={defeated}
                />
                <span className="mg-node__inner mg-node__inner--boss">
                  <Flame size={30} />
                </span>
              </button>
              <span className="mg-path__caption mg-path__caption--center">
                {defeated ? `Босс повержен · ${section.item}` : `Босс: ${section.boss}`}
              </span>
              {!bossReady && (
                <span className="mg-path__hint">
                  {bossRequired - xp > 0
                    ? `Ещё ${bossRequired - xp} XP — и босс откроется`
                    : 'Пройдите босса, чтобы выбрать новый раздел'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <BottomSheet
        open={Boolean(selectedTopic)}
        title={selectedTopicMeta?.title ?? 'Уровень'}
        onClose={() => {
          setSelectedTopic(null);
          setTheoryOpen(false);
        }}
      >
        <div className="mg-level-sheet">
          <p className="mg-level-sheet__meta">{section.title}</p>
          <div className="mg-level-sheet__stats">
            <div className="mg-level-sheet__stat">
              <span className="mg-level-sheet__value">{selectedTasks.length}</span>
              <span className="mg-level-sheet__label">заданий</span>
            </div>
            <div className="mg-level-sheet__stat">
              <span className="mg-level-sheet__value">
                {selectedTopic ? (progress.xpByTopic[selectedTopic] ?? 0) : 0} /{' '}
                {selectedTopic ? topicMaxXp(selectedTopic) : 0}
              </span>
              <span className="mg-level-sheet__label">XP</span>
            </div>
          </div>

          <Button
            variant="secondary"
            size="medium"
            stretched
            iconBefore={<BookOpen size={16} />}
            onClick={() => {
              setTheoryOpen(previous => !previous);
              setTheoryIndex(0);
            }}
          >
            Теория · {selectedTheory.length}
          </Button>

          {theoryOpen && (
            <div className="mg-theory-carousel">
              {selectedTheory.length === 0 && (
                <p className="mg-theory__empty">Теория по этой теме появится позже.</p>
              )}

              {selectedTheory.length > 0 && (
                <>
                  <div
                    className="mg-theory"
                    onTouchStart={event => {
                      touchStartX.current = event.touches[0]?.clientX ?? null;
                    }}
                    onTouchEnd={event => {
                      const start = touchStartX.current;
                      const end = event.changedTouches[0]?.clientX ?? null;
                      touchStartX.current = null;
                      if (start === null || end === null) return;
                      if (Math.abs(end - start) < 40) return;
                      setTheoryIndex(previous =>
                        end < start
                          ? Math.min(selectedTheory.length - 1, previous + 1)
                          : Math.max(0, previous - 1),
                      );
                    }}
                  >
                    {(() => {
                      const card = selectedTheory[Math.min(theoryIndex, selectedTheory.length - 1)];
                      if (!card) return null;
                      return (
                        <div className="mg-theory__card">
                          <div className="mg-theory__question">
                            {card.question}
                            {card.answerKind && ` (${ANSWER_KIND_LABELS[card.answerKind]})`}
                          </div>
                          <div className="mg-theory__answer">{card.answer}</div>
                          {card.details && <p className="mg-theory__details">{card.details}</p>}
                          {card.formula && <div className="mg-theory__formula">{card.formula}</div>}
                        </div>
                      );
                    })()}
                  </div>

                  {selectedTheory.length > 1 && (
                    <div className="mg-theory-nav">
                      <button
                        type="button"
                        className="mg-theory-nav__btn"
                        disabled={theoryIndex === 0}
                        onClick={() => setTheoryIndex(previous => Math.max(0, previous - 1))}
                      >
                        ←
                      </button>
                      <span className="mg-theory-nav__count">
                        {theoryIndex + 1} / {selectedTheory.length}
                      </span>
                      <button
                        type="button"
                        className="mg-theory-nav__btn"
                        disabled={theoryIndex >= selectedTheory.length - 1}
                        onClick={() =>
                          setTheoryIndex(previous =>
                            Math.min(selectedTheory.length - 1, previous + 1),
                          )
                        }
                      >
                        →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <Button
            variant="primary"
            size="large"
            stretched
            iconBefore={<Play size={16} />}
            onClick={() => {
              if (selectedTopic) {
                const topicId = selectedTopic;
                setSelectedTopic(null);
                setTheoryOpen(false);
                onStartLevel(topicId);
              }
            }}
          >
            Начать
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
};
