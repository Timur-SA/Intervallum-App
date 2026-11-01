import React from 'react';
import { Typography, Button } from '@maxhub/max-ui';
import { ForceTask } from '../types';
import { FORCE_TASKS } from '../data/tasks';
import { haptics } from '../../../shared/motion/haptics';

interface ForceTaskScreenProps {
  onSelectTask: (task: ForceTask) => void;
  completedTaskIds: string[];
}

const TASK_META: Record<string, { difficulty: 1 | 2 | 3; category: string }> = {
  incline: { difficulty: 2, category: 'Механика' },
  table: { difficulty: 1, category: 'Механика' },
  hanging: { difficulty: 1, category: 'Механика' },
  magnetic: { difficulty: 2, category: 'Магнетизм' },
  sail: { difficulty: 3, category: 'Оптика' },
  lever: { difficulty: 2, category: 'Механика' },
};

const DIFF_LABELS: Record<number, { text: string; color: string }> = {
  1: { text: 'Легко', color: 'var(--success, #10b981)' },
  2: { text: 'Средне', color: 'var(--warning, #f59e0b)' },
  3: { text: 'Сложно', color: 'var(--danger, #ef4444)' },
};

export const ForceTaskScreen: React.FC<ForceTaskScreenProps> = ({
  onSelectTask,
  completedTaskIds,
}) => {
  return (
    <div className="task-screen-container">
      {/* Hero Banner matching Formula Trainer */}
      <div className="task-screen-hero">
        <Typography.Text
          variant="header"
          className="hero-title"
          style={{ display: 'block', marginBottom: 6 }}
        >
          Векторный тренажёр сил
        </Typography.Text>
        <Typography.Text
          variant="body"
          color="secondary"
          className="hero-desc"
          style={{ display: 'block' }}
        >
          Выбирай физическую ситуацию, анализируй взаимодействия тел и строй векторы сил на чертеже!
        </Typography.Text>
      </div>

      {/* Task List Container */}
      <div className="task-list-container">
        {FORCE_TASKS.map(task => {
          const meta = TASK_META[task.id] || { difficulty: 1, category: 'Механика' };
          const diff = DIFF_LABELS[meta.difficulty];
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
              {/* Top row: Difficulty pill + Category */}
              <div className="task-card-top-row">
                <span
                  className="task-diff-pill"
                  style={{ color: diff.color, borderColor: diff.color }}
                >
                  {diff.text} • {meta.difficulty === 1 ? '★ 1' : meta.difficulty === 2 ? '★ 2' : '★ 3'}
                </span>
                <span className="task-category-label">{meta.category}</span>
              </div>

              {/* Task Title */}
              <div className="task-card-title">{task.title}</div>

              {/* Task Condition */}
              <div className="task-card-desc" style={{ color: 'var(--text-secondary)' }}>
                {task.condition}
              </div>

              {/* Footer */}
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
                  {isDone ? '✓ Решено' : `${task.refs.length} силы к расстановке`}
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
