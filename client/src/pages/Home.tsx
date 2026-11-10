import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  Heart,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  SkipForward,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { usePomodoro, type TimerPhase, type TimerSettings } from "@/hooks/usePomodoro";

const phaseDetails: Record<TimerPhase, { title: string; helper: string; verb: string }> = {
  work: { title: "Work Time", helper: "A little focus, held by grace.", verb: "FOCUS SESSION" },
  shortBreak: { title: "Short Break", helper: "Rest is part of the rhythm.", verb: "A MOMENT TO BREATHE" },
  longBreak: { title: "Long Break", helper: "You’ve done good work. Rest well.", verb: "A LONGER PAUSE" },
};

const sessionLabels: { key: keyof Pick<TimerSettings, "work" | "shortBreak" | "longBreak">; label: string; detail: string }[] = [
  { key: "work", label: "Work time", detail: "Stay present with one thing at a time." },
  { key: "shortBreak", label: "Short break", detail: "A small pause between focus sessions." },
  { key: "longBreak", label: "Long break", detail: "A slower reset after four sessions." },
];

function formatTimer(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 44 44" fill="none">
        <path
          d="M10 35.5c4.4-3.3 7.1-7.1 8-11.4-2.4-1.7-3.9-4.5-3.9-7.6 0-5.3 4.2-9.5 9.5-9.5 4 0 7.4 2.5 8.9 6l-4.2.2 8.9 3.4-5.9 2.8c-.9 3.8-4 6.5-8 7 .2 4.1 2.1 7.9 5.7 11-6.6.9-13.2.4-19-1.9Z"
          fill="currentColor"
        />
        <circle cx="25.2" cy="14.3" r="1.15" fill="var(--evergreen)" />
        <path
          d="M17.8 25.6c-1.3 2.7-3.3 4.9-5.9 6.7M36 16.8l-3.3 1.6"
          stroke="var(--evergreen)"
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function GlowingCross() {
  return (
    <div className="cross-stage" aria-label="A softly glowing cross" role="img">
      <span className="cross-halo cross-halo-one" />
      <span className="cross-halo cross-halo-two" />
      <svg className="gospel-cross" viewBox="0 0 120 150" fill="none" aria-hidden="true">
        <path d="M60 19v112M29 53h62" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
        <path d="M60 20v110M30 53h60" stroke="#DCE5D8" strokeOpacity=".32" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
      <span className="cross-ground" />
    </div>
  );
}

type SettingsDrawerProps = {
  open: boolean;
  settings: TimerSettings;
  onClose: () => void;
  onSave: (settings: TimerSettings) => void;
};

function SettingsDrawer({ open, settings, onClose, onSave }: SettingsDrawerProps) {
  const [draft, setDraft] = useState<TimerSettings>(settings);

  useEffect(() => {
    if (open) setDraft(settings);
  }, [open, settings]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave(draft);
    onClose();
  };

  return (
    <div className="drawer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="settings-drawer" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <div className="drawer-top">
          <div className="drawer-icon"><Settings2 size={18} /></div>
          <button type="button" className="icon-button close-button" onClick={onClose} aria-label="Close settings"><X size={19} /></button>
        </div>
        <p className="eyebrow">YOUR FOCUS RHYTHM</p>
        <h2 id="settings-title">Timer settings</h2>
        <p className="drawer-intro">Make the rhythm your own. Changes are saved on this device.</p>

        <form onSubmit={handleSubmit}>
          <div className="settings-list">
            {sessionLabels.map((item, index) => (
              <label className="setting-row" key={item.key}>
                <span className="setting-index">0{index + 1}</span>
                <span className="setting-copy">
                  <span className="setting-name">{item.label}</span>
                  <span className="setting-detail">{item.detail}</span>
                </span>
                <span className="minutes-input">
                  <input
                    type="number"
                    min={1}
                    max={180}
                    step={1}
                    value={draft[item.key]}
                    onChange={(event) => setDraft((current) => ({ ...current, [item.key]: Number(event.target.value) }))}
                    aria-label={`${item.label} duration in minutes`}
                  />
                  <span>min</span>
                </span>
              </label>
            ))}
          </div>

          <div className="audio-row">
            <span className="audio-symbol">{draft.audioAlert ? <Volume2 size={18} /> : <VolumeX size={18} />}</span>
            <span className="setting-copy">
              <span className="setting-name">Gentle chime</span>
              <span className="setting-detail">A soft note when a session ends.</span>
            </span>
            <button
              className={`switch ${draft.audioAlert ? "is-on" : ""}`}
              type="button"
              role="switch"
              aria-checked={draft.audioAlert}
              aria-label="Audio alert"
              onClick={() => setDraft((current) => ({ ...current, audioAlert: !current.audioAlert }))}
            ><span /></button>
          </div>

          <p className="drawer-footnote"><Sparkles size={14} /> Your preferences stay on this device.</p>
          <div className="drawer-actions">
            <button className="text-action" type="button" onClick={onClose}>Cancel</button>
            <button className="save-button" type="submit">Save settings <ArrowRight size={16} /></button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function Home() {
  const timer = usePomodoro();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const current = phaseDetails[timer.phase];
  const cyclePosition = timer.completedWork % 4;
  const cycleProgress = timer.phase === "longBreak" ? 4 : cyclePosition;
  const cycleNumber = timer.phase === "longBreak" ? 4 : cyclePosition + 1;
  const radius = 113;
  const circumference = 2 * Math.PI * radius;
  const ringOffset = circumference * (1 - timer.progress);

  return (
    <div className="site-frame">
      <header className="site-header">
        <div className="brand-group">
          <BrandMark />
          <div className="brand-wording">
            <span className="brand-name">Pomodoro Timer</span>
            <span className="brand-caption">By Bancroft</span>
          </div>
        </div>
        <div className="header-note">
          <span className="header-note-icon"><CalendarDays size={15} /></span>
          <span><strong>{timer.dailyCount}</strong> focused {timer.dailyCount === 1 ? "session" : "sessions"} today</span>
          <span className="header-note-dot" />
          <span className="header-gentle">One faithful step at a time</span>
        </div>
      </header>

      <main className="main-content">
        <section className="timer-card" aria-labelledby="timer-heading">
          <div className="timer-card-head">
            <div className="phase-heading">
              <span className={`phase-indicator ${timer.running ? "is-running" : ""}`} />
              <span className="eyebrow">{current.verb}</span>
            </div>
            <div className="timer-head-tools">
              <span className="cycle-caption">CYCLE <strong>{String(cycleNumber).padStart(2, "0")}</strong><span className="cycle-divider">/</span>04</span>
              <button className="timer-settings-trigger" onClick={() => setSettingsOpen(true)} type="button" aria-label="Open timer settings" title="Timer settings">
                <Settings2 size={15} strokeWidth={2} />
              </button>
            </div>
          </div>

          <div className="timer-intro">
            <p className="eyebrow soft-eyebrow">A QUIET PLACE TO BEGIN</p>
            <h1 id="timer-heading">{current.title}<span className="title-period">.</span></h1>
            <p className="phase-subtitle">{current.helper}</p>
          </div>

          <div className="timer-display" aria-label={`${formatTimer(timer.secondsLeft)} remaining`}>
            <svg className="timer-ring" viewBox="0 0 260 260" role="progressbar" aria-label="Session progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(timer.progress * 100)}>
              <circle className="ring-track" cx="130" cy="130" r={radius} />
              <circle className="ring-value" cx="130" cy="130" r={radius} strokeDasharray={circumference} strokeDashoffset={ringOffset} />
              <circle className="ring-start-dot" cx="130" cy="17" r="3.5" />
            </svg>
            <div className="timer-center">
              <span className="timer-label">{timer.running ? "IN YOUR FLOW" : "TAKE YOUR TIME"}</span>
              <span className="timer-digits" aria-live="off">{formatTimer(timer.secondsLeft)}</span>
              <span className="timer-unit">MINUTES · SECONDS</span>
            </div>
          </div>

          <div className="controls-row">
            <button className="minor-control" onClick={timer.reset} type="button" aria-label="Reset timer">
              <RotateCcw size={17} strokeWidth={1.9} /><span>Reset</span>
            </button>
            <button className="main-control" onClick={timer.running ? timer.pause : timer.start} type="button">
              <span className="main-control-icon">{timer.running ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</span>
              <span>{timer.running ? "Pause focus" : "Begin focus"}</span>
            </button>
            <button className="minor-control" onClick={timer.skip} type="button" aria-label="Skip to next phase">
              <SkipForward size={17} strokeWidth={1.9} /><span>Skip</span>
            </button>
          </div>
          <p className="timer-status" aria-live="polite">{timer.notice}</p>

          <div className="timer-divider" />
          <div className="session-summary">
            <div className="session-summary-title">
              <span className="summary-icon"><Check size={14} strokeWidth={2.6} /></span>
              <span>Today’s steady steps</span>
            </div>
            <div className="summary-bottom">
              <div className="session-dots" aria-label={`${cycleProgress} of 4 focus sessions completed in this cycle`}>
                {[0, 1, 2, 3].map((dot) => <span className={dot < cycleProgress ? "dot-complete" : ""} key={dot}>{dot < cycleProgress ? <Check size={10} /> : null}</span>)}
              </div>
              <span className="session-count"><strong>{String(timer.dailyCount).padStart(2, "0")}</strong> sessions completed</span>
              <span className="summary-sprig" aria-hidden="true">✳</span>
            </div>
          </div>
        </section>

        <aside className="scripture-panel" aria-labelledby="scripture-heading">
          <div className="scripture-topline">
            <span className="eyebrow">A MOMENT WITH THE WORD</span>
            <span className="scripture-mark"><BookOpen size={15} /></span>
          </div>
          <GlowingCross />
          <div className="scripture-intro">
            <p className="eyebrow soft-eyebrow">A WORD FOR THIS MOMENT</p>
            <h2 id="scripture-heading">Be still.<br /><em>Be encouraged.</em></h2>
          </div>

          <article className="verse-card" aria-live="polite">
            <div className="verse-card-top">
              <span className="verse-theme"><span />{timer.verse.theme}</span>
              <span className="verse-number">{String(scripturesIndex(timer.verse.reference)).padStart(2, "0")} <span>/ 10</span></span>
            </div>
            <span className="quote-mark" aria-hidden="true">“</span>
            <blockquote>{timer.verse.text}</blockquote>
            <div className="verse-reference-row">
              <cite>{timer.verse.reference}</cite>
              <span className="translation-label">{timer.verse.translation}</span>
            </div>
          </article>

          <div className="verse-bottom-row">
            <span className="verse-prompt"><Heart size={13} /> Carry this with you</span>
            <button className="next-verse" type="button" onClick={timer.nextVerse}>Next verse <ChevronRight size={16} /></button>
          </div>

          <div className="scripture-note">
            <span className="note-ornament"><span /></span>
            <p>Take one slow breath. You don’t have to do it all at once.</p>
          </div>
        </aside>
      </main>

      <footer className="site-footer">
        <span>Made for thoughtful work and tender hearts.</span>
        <span className="footer-center"><span /> STILL <i>&</i> STEADY</span>
        <span className="footer-right">Grace for the work. Rest for the soul. <Sparkles size={13} /></span>
      </footer>

      <SettingsDrawer
        open={settingsOpen}
        settings={timer.settings}
        onClose={() => setSettingsOpen(false)}
        onSave={timer.saveSettings}
      />
    </div>
  );
}

function scripturesIndex(reference: string) {
  const references = [
    "Philippians 4:6–7", "Matthew 6:34", "Isaiah 41:10", "Psalm 55:22", "1 Peter 5:7",
    "Joshua 1:9", "John 14:27", "2 Timothy 1:7", "Proverbs 3:5–6", "Romans 12:2",
  ];
  const index = references.indexOf(reference);
  return index < 0 ? 1 : index + 1;
}
