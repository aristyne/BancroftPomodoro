import { useCallback, useEffect, useRef, useState } from "react";
import { scriptures } from "@/lib/scriptures";

export type TimerPhase = "work" | "shortBreak" | "longBreak";

export type TimerSettings = {
  work: number;
  shortBreak: number;
  longBreak: number;
  audioAlert: boolean;
};

type PersistedState = {
  settings?: Partial<TimerSettings>;
  phase?: TimerPhase;
  secondsLeft?: number;
  completedWork?: number;
  dailyCount?: number;
  countDate?: string;
  verseIndex?: number;
};

type LoadedState = {
  settings: TimerSettings;
  phase: TimerPhase;
  secondsLeft: number;
  completedWork: number;
  dailyCount: number;
  countDate: string;
  verseIndex: number;
};

const STORAGE_KEY = "still-and-steady-pomodoro-v1";
const defaults: TimerSettings = {
  work: 25,
  shortBreak: 5,
  longBreak: 15,
  audioAlert: true,
};

function localDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function safeMinutes(value: unknown, fallback: number) {
  const minutes = Number(value);
  return Number.isFinite(minutes) ? Math.min(180, Math.max(1, Math.round(minutes))) : fallback;
}

function loadSavedState(): LoadedState {
  const today = localDateKey();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as PersistedState;
      const settings: TimerSettings = {
        work: safeMinutes(saved.settings?.work, defaults.work),
        shortBreak: safeMinutes(saved.settings?.shortBreak, defaults.shortBreak),
        longBreak: safeMinutes(saved.settings?.longBreak, defaults.longBreak),
        audioAlert: typeof saved.settings?.audioAlert === "boolean" ? saved.settings.audioAlert : defaults.audioAlert,
      };
      const phase = ["work", "shortBreak", "longBreak"].includes(saved.phase ?? "") ? (saved.phase as TimerPhase) : "work";
      const phaseSeconds = settings[phase] * 60;
      const secondsLeft = Number.isFinite(saved.secondsLeft) ? Math.min(phaseSeconds, Math.max(0, Math.floor(saved.secondsLeft!))) : phaseSeconds;
      const sameDay = saved.countDate === today;
      return {
        settings,
        phase,
        secondsLeft,
        completedWork: Number.isFinite(saved.completedWork) ? Math.max(0, Math.floor(saved.completedWork!)) : 0,
        dailyCount: sameDay && Number.isFinite(saved.dailyCount) ? Math.max(0, Math.floor(saved.dailyCount!)) : 0,
        countDate: today,
        verseIndex: Number.isFinite(saved.verseIndex) ? ((Math.floor(saved.verseIndex!) % scriptures.length) + scriptures.length) % scriptures.length : 0,
      };
    }
  } catch {
    // Local storage can be unavailable in private browsing or restricted contexts.
  }
  return {
    settings: defaults,
    phase: "work",
    secondsLeft: defaults.work * 60,
    completedWork: 0,
    dailyCount: 0,
    countDate: today,
    verseIndex: 0,
  };
}

function playGentleChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const now = context.currentTime;
    [659.25, 783.99].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = now + index * 0.18;
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.075, start + 0.035);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.62);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.65);
    });
    window.setTimeout(() => void context.close(), 1000);
  } catch {
    // Audio is optional; timer completion should still work if playback is blocked.
  }
}

const durationFor = (phase: TimerPhase, settings: TimerSettings) => settings[phase] * 60;

export function usePomodoro() {
  const [initial] = useState(loadSavedState);
  const [settings, setSettings] = useState<TimerSettings>(initial.settings);
  const [phase, setPhase] = useState<TimerPhase>(initial.phase);
  const [secondsLeft, setSecondsLeft] = useState(initial.secondsLeft);
  const [completedWork, setCompletedWork] = useState(initial.completedWork);
  const [dailyCount, setDailyCount] = useState(initial.dailyCount);
  const [verseIndex, setVerseIndex] = useState(initial.verseIndex);
  const [running, setRunning] = useState(false);
  const [notice, setNotice] = useState("Ready when you are.");
  const deadlineRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const dayRef = useRef(initial.countDate);
  const currentRef = useRef({ phase, settings, completedWork });

  useEffect(() => {
    currentRef.current = { phase, settings, completedWork };
  }, [phase, settings, completedWork]);

  const changePhase = useCallback((nextPhase: TimerPhase, message: string) => {
    const nextSettings = currentRef.current.settings;
    setPhase(nextPhase);
    setSecondsLeft(durationFor(nextPhase, nextSettings));
    setVerseIndex((index) => (index + 1) % scriptures.length);
    setNotice(message);
  }, []);

  const finishPhase = useCallback(() => {
    const current = currentRef.current;
    setRunning(false);
    deadlineRef.current = null;
    if (current.settings.audioAlert) playGentleChime();

    if (current.phase === "work") {
      const nextCompleted = current.completedWork + 1;
      setCompletedWork(nextCompleted);
      setDailyCount((count) => count + 1);
      if (nextCompleted % 4 === 0) {
        changePhase("longBreak", "Four focus sessions complete. Rest and renew.");
      } else {
        changePhase("shortBreak", "Focus session complete. Take a gentle pause.");
      }
    } else {
      changePhase("work", "Break complete. Ready for another focused session?");
    }
  }, [changePhase]);

  useEffect(() => {
    if (!running) return;
    deadlineRef.current ??= Date.now() + secondsLeft * 1000;
    intervalRef.current = window.setInterval(() => {
      if (deadlineRef.current === null) return;
      const remaining = Math.ceil((deadlineRef.current - Date.now()) / 1000);
      if (remaining <= 0) {
        if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
        intervalRef.current = null;
        setSecondsLeft(0);
        finishPhase();
      } else {
        setSecondsLeft(remaining);
      }
    }, 200);
    return () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [running, secondsLeft, finishPhase]);

  useEffect(() => {
    const checkNewDay = () => {
      const today = localDateKey();
      if (today !== dayRef.current) {
        dayRef.current = today;
        setDailyCount(0);
      }
    };
    const id = window.setInterval(checkNewDay, 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        settings,
        phase,
        secondsLeft,
        completedWork,
        dailyCount,
        countDate: localDateKey(),
        verseIndex,
      } satisfies PersistedState));
    } catch {
      // The app remains usable when the browser disallows local storage.
    }
  }, [settings, phase, secondsLeft, completedWork, dailyCount, verseIndex]);

  const start = useCallback(() => {
    if (running) return;
    deadlineRef.current = Date.now() + secondsLeft * 1000;
    setNotice("Your focus time is underway.");
    setRunning(true);
  }, [running, secondsLeft]);

  const pause = useCallback(() => {
    if (!running) return;
    const remaining = deadlineRef.current === null ? secondsLeft : Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
    deadlineRef.current = null;
    setSecondsLeft(remaining);
    setRunning(false);
    setNotice("Timer paused. Take your time.");
  }, [running, secondsLeft]);

  const reset = useCallback(() => {
    deadlineRef.current = null;
    setRunning(false);
    setSecondsLeft(durationFor(phase, settings));
    setNotice("Timer reset. Begin whenever you’re ready.");
  }, [phase, settings]);

  const skip = useCallback(() => {
    deadlineRef.current = null;
    setRunning(false);
    if (phase === "work") {
      changePhase("shortBreak", "Moving to a short break. Your focus count stays as it is.");
    } else {
      changePhase("work", "Break skipped. Returning to focus time.");
    }
  }, [phase, changePhase]);

  const saveSettings = useCallback((nextSettings: TimerSettings) => {
    const normalized: TimerSettings = {
      work: safeMinutes(nextSettings.work, defaults.work),
      shortBreak: safeMinutes(nextSettings.shortBreak, defaults.shortBreak),
      longBreak: safeMinutes(nextSettings.longBreak, defaults.longBreak),
      audioAlert: nextSettings.audioAlert,
    };
    setSettings(normalized);
    if (!running) setSecondsLeft(durationFor(phase, normalized));
    setNotice("Your timer preferences have been saved.");
  }, [running, phase]);

  const nextVerse = useCallback(() => {
    setVerseIndex((index) => (index + 1) % scriptures.length);
  }, []);

  const totalSeconds = durationFor(phase, settings);
  const progress = Math.min(1, Math.max(0, (totalSeconds - secondsLeft) / totalSeconds));

  return {
    settings,
    phase,
    secondsLeft,
    completedWork,
    dailyCount,
    verse: scriptures[verseIndex],
    running,
    notice,
    totalSeconds,
    progress,
    start,
    pause,
    reset,
    skip,
    saveSettings,
    nextVerse,
  };
}
