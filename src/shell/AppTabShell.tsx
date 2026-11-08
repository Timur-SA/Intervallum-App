import React, { useCallback, useEffect, useState } from 'react';
import { useNavigation } from './HeaderContext';
import { TabBar, AppTab } from './TabBar';
import { HomeScreen } from '../screens/HomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { CatalogScreen } from '../screens/CatalogScreen';
import { MapModule } from '../modules/mini-games/MapModule';
import { TopicId } from '../modules/mini-games/domain/types';
import {
  acknowledgeStreakBreak,
  acknowledgeStreakCelebration,
  prepareStreakOnLaunch,
} from '../shared/storage/progressStore';
import { StreakNotice, StreakOverlay } from './StreakOverlay';
import { haptics } from '../shared/motion/haptics';
import './AppTabShell.css';

interface AppTabShellProps {
  platform: 'ios' | 'android';
}

export const AppTabShell: React.FC<AppTabShellProps> = ({ platform }) => {
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [mapFocusTopic, setMapFocusTopic] = useState<TopicId | null>(null);
  const [streakNotice, setStreakNotice] = useState<StreakNotice | null>(null);
  const { navigationConfig } = useNavigation();

  const refreshStreakNotice = useCallback((allowUpdate: boolean) => {
    const data = prepareStreakOnLaunch();

    if (data.activity.pendingBreakDate) {
      setStreakNotice({
        type: 'break',
        lostDays: data.activity.pendingBreakLostDays,
      });
      return;
    }

    if (allowUpdate && data.activity.pendingCelebrationDate) {
      setStreakNotice({
        type: 'update',
        days: data.activity.currentStreak,
      });
    }
  }, []);

  useEffect(() => {
    refreshStreakNotice(activeTab === 'home');
  }, [activeTab, refreshStreakNotice]);

  useEffect(() => {
    const handleProgress = () => {
      if (activeTab === 'home') refreshStreakNotice(true);
    };

    window.addEventListener('intervallum:progress-changed', handleProgress);
    return () => window.removeEventListener('intervallum:progress-changed', handleProgress);
  }, [activeTab, refreshStreakNotice]);

  const handleTabChange = (tab: AppTab) => {
    haptics.selection();
    if (tab === 'map') setMapFocusTopic(null);
    setActiveTab(tab);
  };

  const openMap = (topicId: TopicId | null) => {
    setMapFocusTopic(topicId);
    setActiveTab('map');
  };

  const tabbarHidden =
    activeTab === 'map' && navigationConfig.canGoBack;

  const handleStreakContinue = () => {
    if (!streakNotice) return;

    if (streakNotice.type === 'break') {
      acknowledgeStreakBreak();
    } else {
      acknowledgeStreakCelebration();
    }

    setStreakNotice(null);
    setActiveTab('home');
    haptics.notification('success');
  };

  return (
    <div className="app-tab-shell">
      <div className="app-tab-shell__content">
        {activeTab === 'home' && (
          <HomeScreen
            onOpenMap={openMap}
            onOpenProfile={() => handleTabChange('profile')}
          />
        )}

        {activeTab === 'map' && <MapModule focusTopicId={mapFocusTopic} />}

        {activeTab === 'catalog' && (
          <CatalogScreen onGoHome={() => handleTabChange('home')} />
        )}

        {activeTab === 'profile' && <ProfileScreen />}
      </div>

      {!tabbarHidden && (
        <TabBar activeTab={activeTab} platform={platform} onChange={handleTabChange} />
      )}

      {streakNotice && (
        <StreakOverlay notice={streakNotice} onContinue={handleStreakContinue} />
      )}
    </div>
  );
};
