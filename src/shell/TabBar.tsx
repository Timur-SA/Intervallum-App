import React from 'react';
import { Gamepad2, House, LockKeyhole, Map, UserRound } from 'lucide-react';
import './TabBar.css';

export type AppTab = 'home' | 'map' | 'catalog' | 'profile';

interface TabBarProps {
  activeTab: AppTab;
  platform: 'ios' | 'android';
  onChange: (tab: AppTab) => void;
}

const TABS: Array<{
  id: AppTab;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  locked?: boolean;
}> = [
  { id: 'home', label: 'Главная', icon: House },
  { id: 'map', label: 'Карта', icon: Map },
  { id: 'catalog', label: 'Мини-игры', icon: Gamepad2, locked: true },
  { id: 'profile', label: 'Профиль', icon: UserRound },
];

export const TabBar: React.FC<TabBarProps> = ({ activeTab, platform, onChange }) => (
  <nav className={`app-tabbar app-tabbar--${platform}`} aria-label="Основная навигация">
    <div className="app-tabbar__rail">
      {TABS.map(({ id, label, icon: Icon, locked }) => {
        const active = activeTab === id;

        return (
          <button
            key={id}
            type="button"
            className={`app-tabbar__item ${active ? 'is-active' : ''} ${
              locked ? 'is-locked' : ''
            }`}
            aria-current={active ? 'page' : undefined}
            onClick={() => onChange(id)}
          >
            <span className="app-tabbar__icon-wrap">
              <Icon size={21} strokeWidth={active ? 2.6 : 2.1} />
              {locked && (
                <span className="app-tabbar__lock" aria-label="Заблокировано">
                  <LockKeyhole size={9} strokeWidth={3} />
                </span>
              )}
            </span>
            <span className="app-tabbar__label">{label}</span>
          </button>
        );
      })}
    </div>
  </nav>
);
