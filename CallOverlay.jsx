import { Phone, PhoneOff, Volume2 } from 'lucide-react';

/**
 * The incoming-call screen for Fake Phone Call mode. Deliberately mimics a
 * native call sheet — the deterrent only works if a glance at the screen from
 * a few feet away reads as "she is on the phone with someone".
 */
export default function CallOverlay({ state, onAnswer, onHangUp, prompt, elapsed }) {
  if (state === 'idle') return null;

  if (state === 'ringing') {
    return (
      <div className="absolute inset-0 z-[700] flex animate-fadeIn flex-col items-center justify-between
                      bg-ink-900/97 px-6 py-12 backdrop-blur-xl">
        <div className="flex flex-col items-center gap-3 pt-10">
          <div className="relative grid h-24 w-24 place-items-center rounded-full bg-safe-500/15">
            <span className="absolute inset-0 animate-pulseRing rounded-full bg-safe-400/25" />
            <span className="text-3xl font-bold text-safe-400">M</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-white">Marcus</p>
          <p className="text-sm text-slate-400">mobile · incoming call</p>
          <p className="mt-1 rounded-full bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Simulated by SafeSpark
          </p>
        </div>

        <div className="flex w-full max-w-xs items-center justify-between">
          <button
            type="button"
            onClick={onHangUp}
            className="grid h-16 w-16 place-items-center rounded-full bg-danger-500 text-white
                       shadow-glow-danger transition active:scale-95"
            aria-label="Decline call"
          >
            <PhoneOff size={24} />
          </button>
          <button
            type="button"
            onClick={onAnswer}
            className="grid h-16 w-16 animate-beacon place-items-center rounded-full bg-safe-500
                       text-ink-900 transition active:scale-95"
            aria-label="Answer call"
          >
            <Phone size={24} />
          </button>
        </div>
      </div>
    );
  }

  const mins = Math.floor(elapsed / 60);
  const secs = String(elapsed % 60).padStart(2, '0');

  return (
    <div className="border-b border-safe-400/25 bg-safe-500/10 px-4 py-2.5">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-safe-500/20 text-sm font-bold text-safe-400">
          M
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-tight text-white">Marcus</p>
          <p className="flex items-center gap-1.5 text-[11px] text-safe-400">
            <Volume2 size={11} />
            {mins}:{secs} · on speaker
          </p>
        </div>
        <button
          type="button"
          onClick={onHangUp}
          className="grid h-10 w-10 place-items-center rounded-full bg-danger-500 text-white
                     transition active:scale-95"
          aria-label="End call"
        >
          <PhoneOff size={17} />
        </button>
      </div>

      {prompt ? (
        <p className="mt-2 rounded-xl border border-white/10 bg-ink-900/60 px-3 py-2 text-[13px] text-slate-200">
          <span className="mr-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Say this
          </span>
          {prompt}
        </p>
      ) : null}
    </div>
  );
}
