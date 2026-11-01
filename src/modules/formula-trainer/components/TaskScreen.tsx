import React from 'react';
import { Typography, Button } from '@maxhub/max-ui';
import { PhysicsTask } from '../types/physics';
import { PHYSICS_TASKS } from '../data/tasksDb';
import { MathText } from './MathView';

interface TaskScreenProps {
  onSelectTask: (task: PhysicsTask) => void;
}

export const TaskScreen: React.FC<TaskScreenProps> = ({ onSelectTask }) => {
  const diffLabels: Record<number, { text: string; color: string }> = {
    1: { text: 'Легко', color: 'var(--success, #34c759)' },
    2: { text: 'Средне', color: 'var(--warning, #ff9f0a)' },
    3: { text: 'Сложно', color: 'var(--danger, #ff453a)' }
  };

  return (
    <div className="task-screen-container">
      <div className="task-screen-hero">
        <Typography.Text variant="header" className="hero-title" style={{ display: 'block', marginBottom: 6 }}>
          Тренажёр вывода формул
        </Typography.Text>
        <Typography.Text variant="body" color="secondary" className="hero-desc" style={{ display: 'block' }}>
          Выбирайте задачу, выводите физические законы перетягиванием букв и получайте ответ!
        </Typography.Text>
      </div>

      <div className="task-list-container">
        {PHYSICS_TASKS.map((task) => {
          const diff = diffLabels[task.difficulty] || diffLabels[1];
          return (
            <div
              key={task.id}
              className="task-card-panel"
              onClick={() => onSelectTask(task)}
            >
              <div className="task-card-top-row">
                <span
                  className="task-diff-pill"
                  style={{ color: diff.color, borderColor: diff.color }}
                >
                  {diff.text}
                </span>
                <span className="task-category-label">
                  {task.category}
                </span>
              </div>

              <div className="task-card-title">
                {task.title}
              </div>

              <div className="task-card-desc">
                <MathText text={task.description} />
              </div>

              <div className="task-card-footer">
                <span className="task-find-chip">
                  Найти:&nbsp;<b>{task.find.symbol}</b>&nbsp;({task.find.unit})
                </span>
                <Button variant="ghost" size="xsmall">
                  Начать →
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
