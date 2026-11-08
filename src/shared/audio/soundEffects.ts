/**
 * Lightweight Web Audio sound effects.
 *
 * Sounds are synthesized in the browser, so the app does not need bundled
 * audio files. The global switch is kept in sync with the persisted
 * «Звук» setting from SettingsProvider.
 */

export type SoundName = 'correct' | 'wrong' | 'level-complete' | 'streak-update';

let soundEnabled = true;
let audioContext: AudioContext | null = null;

export const setSoundEnabled = (enabled: boolean): void => {
  soundEnabled = enabled;
};

export const isSoundEnabled = (): boolean => soundEnabled;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (audioContext) return audioContext;

  const Constructor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!Constructor) return null;

  try {
    audioContext = new Constructor();
  } catch {
    audioContext = null;
  }

  return audioContext;
};

const playTone = (
  context: AudioContext,
  frequency: number,
  start: number,
  duration: number,
  type: OscillatorType,
  volume: number,
): void => {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
};

const playNotes = (
  context: AudioContext,
  notes: Array<{
    frequency: number;
    offset: number;
    duration: number;
    type?: OscillatorType;
    volume?: number;
  }>,
): void => {
  const now = context.currentTime + 0.01;
  notes.forEach(note => {
    playTone(
      context,
      note.frequency,
      now + note.offset,
      note.duration,
      note.type ?? 'sine',
      note.volume ?? 0.045,
    );
  });
};

export const playSound = (name: SoundName): void => {
  if (!soundEnabled) return;

  const context = getAudioContext();
  if (!context) return;

  const resume = context.state === 'suspended' ? context.resume() : Promise.resolve();
  void resume.catch(() => undefined);

  switch (name) {
    case 'correct':
      playNotes(context, [
        { frequency: 659.25, offset: 0, duration: 0.12, type: 'triangle', volume: 0.035 },
        { frequency: 880, offset: 0.07, duration: 0.16, type: 'triangle', volume: 0.04 },
        { frequency: 1108.73, offset: 0.14, duration: 0.18, type: 'sine', volume: 0.03 },
      ]);
      break;

    case 'wrong':
      playNotes(context, [
        { frequency: 246.94, offset: 0, duration: 0.16, type: 'triangle', volume: 0.045 },
        { frequency: 196, offset: 0.09, duration: 0.18, type: 'triangle', volume: 0.04 },
        { frequency: 146.83, offset: 0.19, duration: 0.22, type: 'sine', volume: 0.03 },
      ]);
      break;

    case 'level-complete':
      playNotes(context, [
        { frequency: 523.25, offset: 0, duration: 0.18, type: 'triangle', volume: 0.045 },
        { frequency: 659.25, offset: 0.1, duration: 0.18, type: 'triangle', volume: 0.045 },
        { frequency: 783.99, offset: 0.2, duration: 0.2, type: 'triangle', volume: 0.045 },
        { frequency: 1046.5, offset: 0.32, duration: 0.3, type: 'sine', volume: 0.04 },
      ]);
      break;

    case 'streak-update':
      playNotes(context, [
        { frequency: 659.25, offset: 0, duration: 0.11, type: 'sine', volume: 0.035 },
        { frequency: 783.99, offset: 0.07, duration: 0.11, type: 'sine', volume: 0.04 },
        { frequency: 987.77, offset: 0.14, duration: 0.13, type: 'triangle', volume: 0.04 },
        { frequency: 1318.51, offset: 0.23, duration: 0.22, type: 'sine', volume: 0.03 },
      ]);
      break;
  }
};
