import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BottomSheet, Button } from '@maxhub/max-ui';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Check,
  Flame,
  LockKeyhole,
  Play,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { PracticeProgress, totalXp } from '../../../shared/storage/progressStore';
import { SECTIONS, getSection, getTopic } from '../domain/sections';
import { Section, SectionId, TopicId } from '../domain/types';
import {
  bossXpRequired,
  isBossReady,
  isSectionDefeated,
  isSectionUnlocked,
  isTopicComplete,
  isTopicUnlocked,
  sectionXp,
  topicMaxXp,
} from '../domain/progression';
import { TASK_BANK } from '../data';
import { TOPIC_ICONS } from '../config/topicIcons';
import { ANSWER_KIND_LABELS, CARDS } from '../data/cards';
import { haptics } from '../../../shared/motion/haptics';

interface JourneyMapScreenProps {
  progress: PracticeProgress;
  onStartLevel: (sectionId: SectionId, topicId: TopicId) => void;
  onStartBoss: (sectionId: SectionId) => void;
  onChooseSection: (sectionId: SectionId) => void;
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

export const JourneyMapScreen: React.FC<JourneyMapScreenProps> = ({
  progress,
  onStartLevel,
  onStartBoss,
  onChooseSection,
}) => {
  const [collapsedOverrides, setCollapsedOverrides] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<{ sectionId: SectionId; topicId: TopicId } | null>(null);
  const [theoryOpen, setTheoryOpen] = useState(false);
  const [theoryIndex, setTheoryIndex] = useState(0);
  const [theoryDirection, setTheoryDirection] = useState<'next' | 'prev'>('next');
  const touchStartX = useRef<number | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const [road, setRoad] = useState('');

  // Порядок разделов — порядок, в котором игрок их открывал.
  const visibleSections = ['mechanics', ...progress.unlockedSections.filter(id => id !== 'mechanics')]
    .map(id => getSection(id as SectionId))
    .filter((section): section is Section => Boolean(section))
    .filter(section => isSectionUnlocked(progress, section.id));
  const lastSection = visibleSections[visibleSections.length - 1];
  const lastDefeated = lastSection ? isSectionDefeated(progress, lastSection.id) : false;
  const lockedSections = SECTIONS.filter(section => !isSectionUnlocked(progress, section.id));

  useLayoutEffect(() => {
    const container = mapRef.current;
    if (!container) return;

    const base = container.getBoundingClientRect();
    const nodes = [...container.querySelectorAll<HTMLElement>('.mg-node')];
    const points = nodes.map(node => {
      const rect = node.getBoundingClientRect();
      return { x: rect.left + rect.width / 2 - base.left, y: rect.top + rect.height / 2 - base.top };
    });

    setRoad(points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' '));
  }, [progress, collapsedOverrides]);

  useEffect(() => {
    const container = mapRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => {
      const base = container.getBoundingClientRect();
      const nodes = [...container.querySelectorAll<HTMLElement>('.mg-node')];
      const points = nodes.map(node => {
        const rect = node.getBoundingClientRect();
        return { x: rect.left + rect.width / 2 - base.left, y: rect.top + rect.height / 2 - base.top };
      });
      setRoad(points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' '));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const selectedTasks = selected
    ? TASK_BANK.filter(task => task.topic === selected.topicId && task.type !== 'cards')
    : [];
  const selectedTheory = selected ? CARDS.filter(card => card.topic === selected.topicId) : [];
  const selectedTopicMeta = selected ? getTopic(selected.topicId) : null;
  const selectedSection = selected ? getSection(selected.sectionId) : null;

  const shiftTheory = (direction: 'next' | 'prev') => {
    setTheoryDirection(direction);
    setTheoryIndex(previous =>
      direction === 'next'
        ? Math.min(selectedTheory.length - 1, previous + 1)
        : Math.max(0, previous - 1),
    );
  };

  return (
    <div className="mg-screen">
      <header className="mg-screen__head mg-screen__head--fixed">
        <h1 className="mg-screen__title">Подготовка · ОГЭ</h1>
        <span className="mg-xp">
          <Sparkles size={13} />
          <span className="mg-xp__value">{totalXp(progress)} XP</span>
        </span>
      </header>

      <div className="mg-scroll">
        <div className="mg-journey" ref={mapRef}>
          <svg className="mg-path__road" aria-hidden>
            <path d={road} />
          </svg>

          {visibleSections.map((section, sectionIndex) => {
            const defeated = isSectionDefeated(progress, section.id);
            const laterUnlocked = visibleSections.some(
              (_item, index) => index > sectionIndex,
            );
            const manual = collapsedOverrides[section.id];
            const collapsed = defeated ? (manual !== undefined ? manual : laterUnlocked) : false;
            const isExpanded = !collapsed;
            const xp = sectionXp(progress, section.id);
            const required = bossXpRequired(section.id);
            const bossReady = isBossReady(progress, section.id);
            const currentIndex = section.topics.findIndex(
              topicId => !isTopicComplete(progress, topicId) && isTopicUnlocked(progress, section.id, topicId),
            );

            return (
              <div key={section.id} className="mg-journey__section">
                <button
                  type="button"
                  className="mg-journey__section-head"
                  onClick={() => {
                    if (!defeated) return;
                    haptics.selection();
                    setCollapsedOverrides(previous => ({
                      ...previous,
                      [section.id]: !(previous[section.id] ?? laterUnlocked),
                    }));
                  }}
                >
                  <span className="mg-journey__section-icon" style={{ backgroundColor: section.color }}>
                    {defeated ? <Trophy size={16} /> : <Sparkles size={16} />}
                  </span>
                  <span className="mg-journey__section-title">{section.title}</span>
                  <span className="mg-journey__section-meta">
                    {defeated ? 'Пройден' : `${xp} / ${required} XP`}
                  </span>
                  {defeated &&
                    (isExpanded ? (
                      <ChevronUp size={16} color="var(--text-muted)" />
                    ) : (
                      <ChevronDown size={16} color="var(--text-muted)" />
                    ))}
                </button>

                {isExpanded && (
                  <div className="mg-path">
                    {section.topics.map((topicId, index) => {
                      const topic = getTopic(topicId);
                      const levelXp = progress.xpByTopic[topicId] ?? 0;
                      const max = topicMaxXp(topicId);
                      const unlocked = isTopicUnlocked(progress, section.id, topicId);
                      const complete = isTopicComplete(progress, topicId);
                      const current = sectionIndex === visibleSections.length - 1 && index === currentIndex;
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
                                setSelected({ sectionId: section.id, topicId });
                                setTheoryOpen(false);
                                setTheoryIndex(0);
                              }}
                              aria-label={topic?.title ?? ''}
                            >
                              <Ring value={levelXp} max={max} size={64} color={section.color} done={complete} />
                              <span className="mg-node__inner">
                                {!unlocked ? (
                                  <LockKeyhole size={23} strokeWidth={2.2} />
                                ) : (
                                  (() => {
                                    const Icon = TOPIC_ICONS[topicId];
                                    return Icon ? <Icon size={18} /> : index + 1;
                                  })()
                                )}
                                {complete && (
                                  <span className="mg-node__check" aria-hidden>
                                    <Check size={9} />
                                  </span>
                                )}
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
                            onStartBoss(section.id);
                          }}
                          aria-label={`Босс ${section.boss}`}
                        >
                          <Ring value={xp} max={required} size={96} color="#f59e0b" done={defeated} />
                          <span className="mg-node__inner mg-node__inner--boss">
                            <Flame size={30} />
                          </span>
                        </button>
                        <span className="mg-path__caption mg-path__caption--center">
                          {defeated ? `Босс повержен · ${section.item}` : `Босс: ${section.boss}`}
                        </span>
                        {!defeated && !bossReady && (
                          <span className="mg-path__hint">
                            Ещё {Math.max(0, required - xp)} XP — и босс откроется
                          </span>
                        )}
                      </div>
                    </div>

                    {!defeated && (
                      <div className="mg-journey__cutoff">
                        {bossReady
                          ? 'Одолейте босса, чтобы выбрать следующий раздел'
                          : 'Наберите опыт на всех уровнях, чтобы открыть босса'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {lastDefeated && lockedSections.length > 0 && (
            <div className="mg-journey__choose">
              <p className="mg-journey__choose-title">Выберите следующий раздел</p>
              <div className="mg-journey__choose-row">
                {lockedSections.map(section => (
                  <button
                    key={section.id}
                    type="button"
                    className="mg-choice-card"
                    onClick={() => {
                      haptics.impact('medium');
                      onChooseSection(section.id);
                    }}
                  >
                    <span
                      className="mg-choice-card__icon"
                      style={{ backgroundColor: section.color }}
                      aria-hidden
                    >
                      <Sparkles size={18} />
                    </span>
                    <span className="mg-choice-card__title">{section.title}</span>
                    <span className="mg-choice-card__meta">{section.topics.length} тем</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {lastDefeated && lockedSections.length === 0 && (
            <div className="mg-journey__cutoff">Все разделы пройдены</div>
          )}
        </div>

      </div>

      <BottomSheet
        open={Boolean(selected)}
        title={selectedTopicMeta?.title ?? 'Уровень'}
        onClose={() => {
          setSelected(null);
          setTheoryOpen(false);
        }}
      >
        <div className="mg-level-sheet">
          <p className="mg-level-sheet__meta">{selectedSection?.title}</p>
          <div className="mg-level-sheet__stats">
            <div className="mg-level-sheet__stat">
              <span className="mg-level-sheet__value">{selectedTasks.length}</span>
              <span className="mg-level-sheet__label">заданий</span>
            </div>
            <div className="mg-level-sheet__stat">
              <span className="mg-level-sheet__value">
                {selected ? (progress.xpByTopic[selected.topicId] ?? 0) : 0} /{' '}
                {selected ? topicMaxXp(selected.topicId) : 0}
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
              setTheoryDirection('next');
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
                      shiftTheory(end < start ? 'next' : 'prev');
                    }}
                  >
                    {(() => {
                      const card = selectedTheory[Math.min(theoryIndex, selectedTheory.length - 1)];
                      if (!card) return null;
                      return (
                        <div
                          key={`${card.id}-${theoryDirection}`}
                          className={`mg-theory__card mg-theory__card--${theoryDirection}`}
                        >
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
                        onClick={() => shiftTheory('prev')}
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
                        onClick={() => shiftTheory('next')}
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
              if (selected) {
                const current = selected;
                setSelected(null);
                setTheoryOpen(false);
                onStartLevel(current.sectionId, current.topicId);
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
