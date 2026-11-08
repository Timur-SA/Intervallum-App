import React from 'react';
import { DailyActivityState } from '../storage/progressStore';
import {
  getDateKey,
  getDaysInMonth,
  getMonthLabel,
  getNow,
  toDateKey,
} from '../dev/timeTravel';
import { plural } from '../../modules/mini-games/engine/plural';
import './ActivityHeatmap.css';

interface ActivityHeatmapProps {
  activity: DailyActivityState;
}

const intensityFor = (count: number): number => {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 4) return 2;
  if (count <= 9) return 3;
  return 4;
};

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ activity }) => {
  const now = getNow();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = getDaysInMonth(now);
  const todayKey = getDateKey(now);
  const todayCount = activity.counts[todayKey] ?? 0;

  const cells = Array.from({ length: 33 }, (_, index) => {
    if (index >= daysInMonth) return null;

    const day = index + 1;
    const date = new Date(year, month, day, 12, 0, 0, 0);
    const dateKey = toDateKey(date);
    const count = activity.counts[dateKey] ?? 0;

    return {
      day,
      dateKey,
      count,
      level: intensityFor(count),
      isToday: dateKey === todayKey,
    };
  });

  return (
    <section className="activity-heatmap" aria-label="Ежедневная активность">
      <div className="activity-heatmap__head">
        <div>
          <span className="activity-heatmap__eyebrow">Активность</span>
          <h2 className="activity-heatmap__month">{getMonthLabel(now)}</h2>
        </div>
        <span className="activity-heatmap__today-count">
          Сегодня: <strong>{todayCount}</strong>
        </span>
      </div>

      <div className="activity-heatmap__grid" role="grid" aria-label={getMonthLabel(now)}>
        {cells.map((cell, index) =>
          cell ? (
            <span
              key={cell.dateKey}
              className={`activity-heatmap__cell level-${cell.level} ${
                cell.isToday ? 'is-today' : ''
              }`}
              role="gridcell"
              title={`${cell.day}: ${cell.count} ${plural(cell.count, [
                'задание',
                'задания',
                'заданий',
              ])}`}
              aria-label={`${cell.day} число, ${cell.count} ${plural(cell.count, [
                'задание',
                'задания',
                'заданий',
              ])}`}
            />
          ) : (
            <span key={`empty-${index}`} className="activity-heatmap__cell is-empty" aria-hidden />
          ),
        )}
      </div>

      <p className="activity-heatmap__caption">
        Сегодня выполнено: <strong>{todayCount}</strong>{' '}
        {plural(todayCount, ['задание', 'задания', 'заданий'])}
      </p>
    </section>
  );
};
