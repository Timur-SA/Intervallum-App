import React from 'react';
import { Typography, Button } from '@maxhub/max-ui';
import { PhysicsTask } from '../types/physics';
import { PHYSICS_TASKS } from '../data/tasksDb';
import { MathText } from '../../../shared/components/MathView';
import { haptics } from '../../../shared/motion/haptics';

interface TaskScreenProps {
  onSelectTask: (task: PhysicsTask) => void;
  completedTaskIds: string[];
}

const DIFF_LABELS: Record<number, { text: string; color: string }> = {
  1: { text: 'Легко', color: 'var(--success, #10b981)' },
  2: { text: 'Средне', color: 'var(--warning, #f59e0b)' },
  3: { text: 'Сложно', color: 'var(--danger, #ef4444)' },
};

export const TaskScreen: React.FC<TaskScreenProps> = ({ onSelectTask, completedTaskIds }) => {
  return (
    <div className="task-screen-container">
      <div className="task-screen-hero">
        <Typography.Text
          variant="header"
          className="hero-title"
          style={{ display: 'block', marginBottom: 6 }}
        >
          Тренажёр вывода формул
        </Typography.Text>
        <Typography.Text
          variant="body"
          color="secondary"
          className="hero-desc"
          style={{ display: 'block' }}
        >
          Выбирайте задачу, выводите физические законы перетягиванием букв и получайте ответ!
        </Typography.Text>
      </div>

      <div className="task-list-container">
        {PHYSICS_TASKS.map(task => {
          const diff = DIFF_LABELS[task.difficulty] || DIFF_LABELS[1];
          const isDone = completedTaskIds.includes(task.id);

          return (
            <div
              key={task.id}
              className="task-card-panel"
              onClick={() => {
                haptics.impact('light');
                onSelectTask(task);
              }}
            >
              <div className="task-card-top-row">
                <span
                  className="task-diff-pill"
                  style={{ color: diff.color, borderColor: diff.color }}
                >
                  {diff.text} • {task.difficulty === 1 ? '★ 1' : task.difficulty === 2 ? '★ 2' : '★ 3'}
                </span>
                <span className="task-category-label">{task.category}</span>
              </div>

              <div className="task-card-title">{task.title}</div>

              <div className="task-card-desc">
                <MathText text={task.description} />
              </div>

              <div className="task-card-footer">
                <span
                  className="task-find-chip"
                  style={{
                    backgroundColor: isDone ? 'var(--success-bg)' : 'var(--bg-surface)',
                    color: isDone ? 'var(--success)' : 'var(--text-secondary)',
                    border: '1px solid ' + (isDone ? 'var(--success)' : 'var(--border)'),
                    padding: '3px 8px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  {isDone ? (
                    '✓ Решено'
                  ) : (
                    <>
                      Найти:&nbsp;<b>{task.find.symbol}</b>&nbsp;({task.find.unit})
                    </>
                  )}
                </span>
                <Button variant="ghost" size="xsmall">
                  {isDone ? 'Повторить →' : 'Начать →'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
