import { useState } from 'react';
import {
  Bot,
  CircleCheck,
  Mic,
  MicOff,
  Phone,
  Play,
  SendHorizontal,
  Settings2,
  ShieldCheck,
  Square,
  TriangleAlert,
} from 'lucide-react';
import AppHeader from '../components/AppHeader';
import Modal from '../components/Modal';
import TranscriptStream from '../components/agent/TranscriptStream';
import CallOverlay from '../components/agent/CallOverlay';
import { useAgent } from '../context/AgentContext';
import { useApp } from '../context/AppContext';
import { useAlerts } from '../context/AlertContext';
import { formatDuration } from '../lib/time';

const QUICK_PHRASES = [
  { text: 'SafeSpark help', tone: 'danger' },
  { text: "I'm being followed", tone: 'danger' },
  { text: 'Leave me alone', tone: 'warn' },
  { text: "I'm home", tone: 'safe' },
];

const RISK_STYLES = {
  calm: {
    label: 'Monitoring · all clear',
    ring: 'border-safe-400/30 bg-safe-500/10',
    dot: 'bg-safe-400',
    text: 'text-safe-400',
  },
  elevated: {
    label: 'Elevated · listening closely',
    ring: 'border-warn-400/40 bg-warn-500/10',
    dot: 'bg-warn-400',
    text: 'text-warn-400',
  },
  critical: {
    label: 'Critical · alert dispatched',
    ring: 'border-danger-400/50 bg-danger-500/12',
    dot: 'bg-danger-400',
    text: 'text-danger-400',
  },
};

export default function AgentPage() {
  const agent = useAgent();
  const { settings, updateSetting } = useApp();
  const { alarmOn, toggleAlarm } = useAlerts();
  const [draft, setDraft] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const risk = RISK_STYLES[agent.risk];

  const send = (e) => {
    e?.preventDefault();
    const text = draft.trim();
    if (!text) return;
    agent.submitText(text);
    setDraft('');
  };

  return (
    <div className="flex h-[calc(100dvh-58px-var(--sa-bottom))] flex-col">
      <AppHeader
        title="AI Safety Agent"
        subtitle={agent.active ? `Session ${formatDuration(agent.elapsed)}` : 'Not monitoring'}
        actions={
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Agent settings"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-400
                       transition hover:bg-white/10 hover:text-white"
          >
            <Settings2 size={18} />
          </button>
        }
      />

      <div className="relative flex flex-1 flex-col overflow-hidden">
        <CallOverlay
          state={agent.callState}
          onAnswer={agent.answerCall}
          onHangUp={agent.hangUp}
          prompt={agent.callPrompt}
          elapsed={agent.elapsed}
        />

        {/* ----------------------------------------------------- mode switch -- */}
        <div className="border-b border-white/10 px-4 py-3">
          <div
            role="radiogroup"
            aria-label="Agent mode"
            className="grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-ink-800 p-1"
          >
            {[
              { id: 'monitor', label: 'Active Monitoring', Icon: ShieldCheck },
              { id: 'call', label: 'Fake Phone Call', Icon: Phone },
            ].map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={agent.mode === id}
                onClick={() => (agent.active ? agent.switchMode(id) : agent.start(id))}
                className={`flex min-h-[42px] items-center justify-center gap-2 rounded-xl px-2
                            text-[13px] font-bold transition ${
                              agent.mode === id
                                ? 'bg-spark-500 text-ink-900'
                                : 'text-slate-400 hover:bg-white/5'
                            }`}
              >
                <Icon size={15} />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>

          <div
            className={`mt-3 flex items-center gap-2.5 rounded-xl border px-3 py-2 ${
              agent.active ? risk.ring : 'border-white/10 bg-white/5'
            }`}
          >
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              {agent.active ? (
                <span
                  className={`absolute inline-flex h-full w-full animate-pulseRing rounded-full ${risk.dot}`}
                />
              ) : null}
              <span
                className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                  agent.active ? risk.dot : 'bg-slate-600'
                }`}
              />
            </span>
            <span
              className={`flex-1 text-xs font-semibold ${agent.active ? risk.text : 'text-slate-500'}`}
            >
              {agent.active ? risk.label : 'Agent idle — start a session before you set off'}
            </span>
            {agent.active ? (
              <span className="font-mono text-[11px] text-slate-500">
                {formatDuration(agent.elapsed)}
              </span>
            ) : null}
          </div>
        </div>

        {/* ------------------------------------------------------ check-in -- */}
        {agent.checkIn.pending ? (
          <div className="mx-4 mt-3 flex animate-slideUp items-center gap-3 rounded-2xl border
                          border-warn-400/40 bg-warn-500/12 px-4 py-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-warn-500/20">
              <span className="font-mono text-sm font-bold text-warn-400">
                {agent.checkIn.secondsLeft}
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white">Safety check-in</p>
              <p className="text-[11px] leading-snug text-warn-400">
                No answer in {agent.checkIn.secondsLeft}s and I alert your contacts.
              </p>
            </div>
            <button
              type="button"
              onClick={agent.respondCheckIn}
              className="btn min-h-[40px] shrink-0 bg-safe-500 px-4 text-ink-900 hover:bg-safe-400"
            >
              <CircleCheck size={16} />
              I'm okay
            </button>
          </div>
        ) : null}

        <TranscriptStream
          lines={agent.lines}
          interim={agent.interim}
          listening={agent.listening}
        />

        {/* ------------------------------------------------------- composer -- */}
        <div className="border-t border-white/10 bg-ink-900/95 px-4 pb-3 pt-3">
          <div className="scroll-area mb-2.5 flex gap-2 overflow-x-auto pb-1">
            {QUICK_PHRASES.map((p) => (
              <button
                key={p.text}
                type="button"
                disabled={!agent.active}
                onClick={() => agent.submitText(p.text)}
                className={`chip shrink-0 disabled:opacity-35 ${
                  p.tone === 'danger'
                    ? 'border-danger-400/40 text-danger-400'
                    : p.tone === 'warn'
                      ? 'border-warn-400/40 text-warn-400'
                      : 'border-safe-400/40 text-safe-400'
                }`}
              >
                “{p.text}”
              </button>
            ))}
          </div>

          <form onSubmit={send} className="flex items-end gap-2">
            <button
              type="button"
              onClick={agent.toggleListening}
              disabled={!agent.active}
              aria-pressed={agent.listening}
              aria-label={agent.listening ? 'Stop listening' : 'Start listening'}
              className={`grid h-[46px] w-[46px] shrink-0 place-items-center rounded-xl border transition
                          active:scale-95 disabled:opacity-35 ${
                            agent.listening
                              ? 'border-danger-400/50 bg-danger-500/15 text-danger-400'
                              : 'border-white/12 bg-white/5 text-slate-300'
                          }`}
            >
              {agent.listening ? (
                <span className="relative grid place-items-center">
                  <span className="absolute h-8 w-8 animate-pulseRing rounded-full bg-danger-500/30" />
                  <Mic size={19} />
                </span>
              ) : (
                <MicOff size={19} />
              )}
            </button>

            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={!agent.active}
              placeholder={
                agent.active ? 'Say something, or type it here…' : 'Start a session to talk'
              }
              className="input min-h-[46px] flex-1 disabled:opacity-40"
              aria-label="Message the agent"
            />

            <button
              type="submit"
              disabled={!agent.active || !draft.trim()}
              aria-label="Send"
              className="btn-primary h-[46px] w-[46px] shrink-0 px-0"
            >
              <SendHorizontal size={18} />
            </button>
          </form>

          <div className="mt-2.5 flex gap-2">
            {agent.active ? (
              <button type="button" onClick={agent.stop} className="btn-ghost flex-1">
                <Square size={15} />
                End session
              </button>
            ) : (
              <button
                type="button"
                onClick={() => agent.start(agent.mode)}
                className="btn-primary flex-1 shadow-glow"
              >
                <Play size={16} />
                Start {agent.mode === 'call' ? 'fake call' : 'monitoring'}
              </button>
            )}
            <button
              type="button"
              onClick={toggleAlarm}
              className={`btn flex-1 ${
                alarmOn
                  ? 'bg-danger-500 text-white hover:bg-danger-400'
                  : 'border border-white/12 bg-white/5 text-slate-200 hover:bg-white/10'
              }`}
            >
              <TriangleAlert size={15} />
              {alarmOn ? 'Silence alarm' : 'Sound alarm'}
            </button>
          </div>

          <p className="mt-2 text-center text-[10px] leading-snug text-slate-600">
            {agent.listening
              ? agent.usingRealMic
                ? 'Live speech recognition · audio stays on this device'
                : 'Simulated listener · this browser has no speech recognition API'
              : 'Microphone off'}
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------- settings -- */}
      <Modal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Agent settings"
        subtitle="How closely SafeSpark watches, and what it does on its own."
      >
        <div className="space-y-5">
          <div>
            <p className="label mb-2">Check-in every</p>
            <div className="grid grid-cols-4 gap-2">
              {[60, 120, 300, 600].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => updateSetting('checkInIntervalSec', sec)}
                  className={`btn min-h-[42px] text-xs ${
                    settings.checkInIntervalSec === sec
                      ? 'bg-spark-500 text-ink-900'
                      : 'border border-white/12 bg-white/5 text-slate-300'
                  }`}
                >
                  {sec < 60 ? `${sec}s` : `${sec / 60}m`}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-snug text-slate-500">
              Miss a check-in by 20 seconds and the agent dispatches an alert on its own.
            </p>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10
                            bg-white/5 p-3.5">
            <input
              type="checkbox"
              checked={settings.alarmOnTrigger}
              onChange={(e) => updateSetting('alarmOnTrigger', e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-spark-500"
            />
            <span>
              <span className="block text-sm font-semibold text-slate-100">
                Sound the alarm automatically on a critical trigger
              </span>
              <span className="mt-1 block text-[11px] leading-snug text-slate-500">
                Off by default. A siren that starts on its own can escalate a situation you
                were trying to walk away from — keep it manual unless you have decided
                otherwise.
              </span>
            </span>
          </label>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-100">
              <Bot size={15} className="text-spark-400" />
              Trigger phrases
            </p>
            <ul className="space-y-1.5 text-[12px] text-slate-400">
              <li>
                <span className="font-mono text-danger-400">“SafeSpark help”</span> — sends
                everything immediately
              </li>
              <li>
                <span className="font-mono text-danger-400">“I'm being followed”</span> — same,
                plus route guidance
              </li>
              <li>
                <span className="font-mono text-warn-400">“Leave me alone”</span> — arms the
                alert, waits for you
              </li>
              <li>
                <span className="font-mono text-safe-400">“I'm home” / “I'm safe”</span> —
                stands the agent down
              </li>
            </ul>
          </div>

          <p className="text-[11px] leading-relaxed text-slate-500">
            Detection runs locally on the transcript — nothing is uploaded, and no audio is
            stored. In production this layer would stay rule-based, with the language model
            used only for conversation quality on top of it.
          </p>
        </div>
      </Modal>
    </div>
  );
}
