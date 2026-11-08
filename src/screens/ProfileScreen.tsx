import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Avatar,
  BottomSheet,
  Button,
  CellSimple,
  Segmented,
  StatusBadge,
  Switch,
} from '@maxhub/max-ui';
import {
  ImagePlus,
  Moon,
  Plus,
  Sun,
  Trash2,
  Volume2,
  Vibrate,
} from 'lucide-react';
import {
  activeDaysCount,
  completedTasksCount,
  loadUserProgress,
  resetLearningProgress,
  updateUserProfile,
  UserProgressData,
} from '../shared/storage/progressStore';
import {
  BADGES,
  BadgeId,
  getBadge,
  isBadgeUnlocked,
} from '../shared/profile/badges';
import { BadgeMedal } from '../shared/components/BadgeMedal';
import { StreakFlame } from '../shared/components/StreakFlame';
import { ActivityHeatmap } from '../shared/components/ActivityHeatmap';
import { haptics } from '../shared/motion/haptics';
import { useAppSettings } from '../shell/SettingsContext';
import './ProfileScreen.css';

interface MaxUser {
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

const getMaxUser = (): MaxUser | null => {
  if (typeof window === 'undefined') return null;
  return (
    (window as unknown as {
      WebApp?: { initDataUnsafe?: { user?: MaxUser } };
    }).WebApp?.initDataUnsafe?.user ?? null
  );
};

const getDisplayName = (user: MaxUser | null): string => {
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim();
  return fullName || user?.username || 'Ученик';
};

const getInitials = (name: string): string => {
  const words = name.split(/\s+/).filter(Boolean);
  if (!words.length) return 'У';
  return words
    .slice(0, 2)
    .map(word => Array.from(word)[0]?.toUpperCase() ?? '')
    .join('');
};

const resizeAvatar = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      try {
        const side = Math.min(image.width, image.height);
        const sx = (image.width - side) / 2;
        const sy = (image.height - side) / 2;
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Canvas is not available'));
          return;
        }
        context.drawImage(image, sx, sy, side, side, 0, 0, 256, 256);
        resolve(canvas.toDataURL('image/jpeg', 0.86));
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not read image'));
    };

    image.src = objectUrl;
  });

const pluralTasks = (count: number): string => {
  const abs = Math.abs(count) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return 'заданий';
  if (last > 1 && last < 5) return 'задания';
  if (last === 1) return 'задание';
  return 'заданий';
};

const pluralDays = (count: number): string => {
  const abs = Math.abs(count) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return 'дней';
  if (last > 1 && last < 5) return 'дня';
  if (last === 1) return 'день';
  return 'дней';
};

export const ProfileScreen: React.FC = () => {
  const [data, setData] = useState<UserProgressData>(() => loadUserProgress());
  const [badgeSheetOpen, setBadgeSheetOpen] = useState(false);
  const [deleteSheetOpen, setDeleteSheetOpen] = useState(false);
  const [draftBadgeId, setDraftBadgeId] = useState<BadgeId | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme, settings, setSoundEnabled, setVibrationEnabled } =
    useAppSettings();

  const maxUser = useMemo(getMaxUser, []);
  const displayName = getDisplayName(maxUser);
  const initials = getInitials(displayName);
  const avatarSrc = data.profile.avatarDataUrl ?? maxUser?.photo_url ?? null;
  const selectedBadge = getBadge(data.profile.badgeId);
  const draftBadge = getBadge(draftBadgeId);

  useEffect(() => {
    const refresh = () => setData(loadUserProgress());
    window.addEventListener('intervallum:progress-changed', refresh);
    return () => window.removeEventListener('intervallum:progress-changed', refresh);
  }, []);

  const activeDays = activeDaysCount(data.activity);
  const completedTasks = completedTasksCount(data.practice);
  const bestStreak = data.activity.bestStreak;

  const openBadgePicker = () => {
    const fallback: BadgeId | null =
      (data.profile.badgeId as BadgeId | null) ??
      BADGES.find(badge => isBadgeUnlocked(badge.id, data.practice))?.id ??
      BADGES[0]?.id ??
      null;
    setDraftBadgeId(fallback);
    setBadgeSheetOpen(true);
    haptics.selection();
  };

  const confirmBadge = () => {
    if (!draftBadge || !isBadgeUnlocked(draftBadge.id, data.practice)) return;
    updateUserProfile({ badgeId: draftBadge.id });
    setData(loadUserProgress());
    setBadgeSheetOpen(false);
    haptics.notification('success');
  };

  const handleAvatarFile = async (file: File | undefined) => {
    if (!file) return;

    try {
      const avatarDataUrl = await resizeAvatar(file);
      updateUserProfile({ avatarDataUrl });
      setData(loadUserProgress());
      haptics.notification('success');
    } catch {
      haptics.notification('error');
    }
  };

  const resetAvatar = () => {
    updateUserProfile({ avatarDataUrl: null });
    setData(loadUserProgress());
    haptics.selection();
  };

  const confirmDeleteProgress = () => {
    resetLearningProgress();
    setData(loadUserProgress());
    setDeleteSheetOpen(false);
    haptics.notification('error');
  };

  const badgeButton = selectedBadge ? (
    <BadgeMedal badge={selectedBadge} size={34} />
  ) : (
    <span className="profile-avatar__badge-empty" aria-hidden>
      <Plus size={15} strokeWidth={2.8} />
    </span>
  );

  return (
    <div className="profile-screen">
      <div className="profile-scroll">
        <header className="profile-head">
          <div>
            <span className="profile-head__eyebrow">Intervallum</span>
            <h1 className="profile-head__title">Профиль</h1>
          </div>
          <StatusBadge status="neutral" text="ОГЭ · 9 класс" />
        </header>

        <section className="profile-identity">
          <div className="profile-avatar-wrap">
            <div
              className="profile-avatar-button"
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              aria-label="Изменить аватар"
            >
              <Avatar.Container
                size={112}
                rightBottomCorner={
                  <button
                    type="button"
                    className="profile-avatar__badge"
                    onClick={event => {
                      event.stopPropagation();
                      openBadgePicker();
                    }}
                    aria-label="Выбрать бейдж"
                  >
                    {badgeButton}
                  </button>
                }
              >
                {avatarSrc ? (
                  <Avatar.Image
                    src={avatarSrc}
                    alt={displayName}
                    fallback={
                      <Avatar.Text gradient="blue">{initials}</Avatar.Text>
                    }
                  />
                ) : (
                  <Avatar.Text gradient="blue">{initials}</Avatar.Text>
                )}
              </Avatar.Container>
              <span className="profile-avatar__edit">
                <ImagePlus size={14} />
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="profile-avatar__file"
              onChange={event => {
                void handleAvatarFile(event.target.files?.[0]);
                event.target.value = '';
              }}
            />
          </div>

          <div className="profile-name-block">
            <h2 className="profile-name">{displayName}</h2>
            {data.profile.avatarDataUrl && (
              <button type="button" className="profile-link-btn" onClick={resetAvatar}>
                Вернуть аватар MAX
              </button>
            )}
          </div>
        </section>

        <section className="profile-stats" aria-label="Основная статистика">
          <div className="profile-stat">
            <strong>{activeDays}</strong>
            <span>{pluralDays(activeDays)}</span>
          </div>
          <div className="profile-stat profile-stat--streak">
            <StreakFlame days={bestStreak} size={30} />
            <strong>{bestStreak}</strong>
            <span>лучшая серия</span>
          </div>
          <div className="profile-stat">
            <strong>{completedTasks}</strong>
            <span>{pluralTasks(completedTasks)}</span>
          </div>
        </section>

        <ActivityHeatmap activity={data.activity} />

        <section className="profile-settings-list" aria-label="Настройки">
          <div className="profile-setting-block profile-setting-row">
            <div className="profile-setting-label">
              {theme === 'dark' ? <Moon size={17} /> : <Sun size={17} />}
              <div>
                <strong>Тема</strong>
                <span>Оформление приложения</span>
              </div>
            </div>
            <Segmented
              items={[
                { id: 'light', title: 'Светлая' },
                { id: 'dark', title: 'Тёмная' },
              ]}
              activeItem={theme}
              onClick={id => setTheme(id === 'light' ? 'light' : 'dark')}
            />
          </div>

          <CellSimple
            className="profile-setting-cell"
            title="Звук"
            subtitle="Звуковые эффекты"
            before={<Volume2 size={17} />}
            innerClassNames={{ before: 'profile-setting-icon' }}
            after={
              <Switch
                checked={settings.sound}
                onChange={event => setSoundEnabled(event.target.checked)}
                aria-label="Звук"
              />
            }
          />

          <CellSimple
            className="profile-setting-cell"
            title="Вибрация"
            subtitle="Тактильная обратная связь"
            before={<Vibrate size={17} />}
            innerClassNames={{ before: 'profile-setting-icon' }}
            after={
              <Switch
                checked={settings.haptics}
                onChange={event => setVibrationEnabled(event.target.checked)}
                aria-label="Вибрация"
              />
            }
          />

          <Button
            variant="destructive"
            size="large"
            stretched
            iconBefore={<Trash2 size={17} />}
            className="profile-delete-btn"
            onClick={() => {
              setDeleteSheetOpen(true);
              haptics.impact('medium');
            }}
          >
            Удалить прогресс
          </Button>
        </section>
      </div>

      <BottomSheet
        open={badgeSheetOpen}
        title="Бейджи"
        onClose={() => setBadgeSheetOpen(false)}
      >
        <div className="profile-badge-sheet">
          {draftBadge ? (
            <div className="profile-badge-preview">
              <BadgeMedal
                badge={draftBadge}
                size={88}
                locked={!isBadgeUnlocked(draftBadge.id, data.practice)}
              />
              <div>
                <h3>{draftBadge.title}</h3>
                <p>{draftBadge.description}</p>
                {!isBadgeUnlocked(draftBadge.id, data.practice) && (
                  <span className="profile-badge-locked">Ещё не получен</span>
                )}
              </div>
            </div>
          ) : null}

          <div className="profile-badge-list">
            {BADGES.map(badge => {
              const unlocked = isBadgeUnlocked(badge.id, data.practice);
              const selected = draftBadgeId === badge.id;

              return (
                <button
                  key={badge.id}
                  type="button"
                  className={`profile-badge-option ${selected ? 'is-selected' : ''} ${
                    !unlocked ? 'is-locked' : ''
                  }`}
                  onClick={() => setDraftBadgeId(badge.id)}
                >
                  <BadgeMedal badge={badge} size={56} locked={!unlocked} />
                  <span className="profile-badge-option__text">
                    <strong>{badge.title}</strong>
                    <span>{unlocked ? 'Получен' : 'Закрыт'}</span>
                  </span>
                  {selected && <span className="profile-badge-option__check">✓</span>}
                </button>
              );
            })}
          </div>

          <div className="profile-sheet-actions">
            <Button
              variant="secondary"
              size="large"
              stretched
              onClick={() => setBadgeSheetOpen(false)}
            >
              Отменить
            </Button>
            <Button
              variant="primary"
              size="large"
              stretched
              disabled={!draftBadge || !isBadgeUnlocked(draftBadge.id, data.practice)}
              onClick={confirmBadge}
            >
              Подтвердить
            </Button>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet
        open={deleteSheetOpen}
        title="Удалить прогресс?"
        onClose={() => setDeleteSheetOpen(false)}
      >
        <div className="profile-delete-sheet">
          <p>
            Прогресс уровней, Daily Streak и ежедневная активность будут удалены.
            Настройки и аватар останутся.
          </p>
          <div className="profile-sheet-actions">
            <Button
              variant="secondary"
              size="large"
              stretched
              onClick={() => setDeleteSheetOpen(false)}
            >
              Отмена
            </Button>
            <Button variant="destructive" size="large" stretched onClick={confirmDeleteProgress}>
              Удалить
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};
