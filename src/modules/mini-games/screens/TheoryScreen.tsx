import { useEffect, useRef } from 'react';
import { Button } from '@maxhub/max-ui';
import { ArrowRight, BookOpen } from 'lucide-react';
import { MathText, MathView } from '../../../shared/components/MathView';
import { haptics } from '../../../shared/motion/haptics';
import { TheoryIllustration } from '../components/TheoryIllustration';
import { THEORY_LESSONS } from '../data/theory';
import { getTopic } from '../domain/sections';
import type { TopicId } from '../domain/types';

interface TheoryScreenProps {
  topicId: TopicId;
  alreadyRead: boolean;
  onFinish: () => void;
}

export function TheoryScreen({ topicId, alreadyRead, onFinish }: TheoryScreenProps) {
  const lesson = THEORY_LESSONS[topicId];
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
  }, [topicId]);

  return (
    <main className="mg-lesson">
      <article className="mg-lesson__article" aria-labelledby="mg-lesson-title">
        <header>
          <p className="mg-lesson__label"><BookOpen size={15} aria-hidden="true" /> Теория</p>
          <h1 id="mg-lesson-title" ref={titleRef} tabIndex={-1}>
            {getTopic(topicId)?.title ?? 'Теория'}
          </h1>
        </header>

        <p className="mg-lesson__text">{lesson.intro}</p>

        <figure className="mg-lesson__figure">
          <TheoryIllustration topicId={topicId} />
          <figcaption>{lesson.caption}</figcaption>
        </figure>

        <div className="mg-lesson__formula">
          <MathView latex={lesson.formula} />
        </div>

        <p className="mg-lesson__text"><MathText text={lesson.takeaway} /></p>
      </article>

      <div className="mg-lesson__actions">
        <Button
          variant="primary"
          size="large"
          stretched
          iconAfter={<ArrowRight size={18} aria-hidden="true" />}
          onClick={() => {
            haptics.impact('light');
            onFinish();
          }}
        >
          {alreadyRead ? 'К карте' : 'Добавить тему в тренировку'}
        </Button>
      </div>
    </main>
  );
}
