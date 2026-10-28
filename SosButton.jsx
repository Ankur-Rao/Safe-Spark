import { Siren } from 'lucide-react';
import { useHoldToConfirm } from '../../lib/hooks';

/**
 * Two ways in, because stress does different things to different people:
 *   tap  → 5-second armed countdown you can cancel (protects against pocket taps)
 *   hold → fires immediately at 1.2s, no countdown
 */
export default function SosButton({ state, countdown, armSeconds, onArm, onSendNow, onCancel }) {
  const { progress, start, stop } = useHoldToConfirm(1200, onSendNow);

  const armed = state === 'arming';
  const live = state === 'active';

  const ring = live ? 1 : armed ? 1 - countdown / armSeconds : progress;
  const circumference = 2 * Math.PI * 92;

  return (
    <div className="flex flex-col items-center">
      <div className="relative grid h-[232px] w-[232px] place-items-center">
        <svg
          className="absolute inset-0 -rotate-90"
          viewBox="0 0 200 200"
          aria-hidden="true"
        >
          <circle cx="100" cy="100" r="92" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6" />
          <circle
            cx="100"
            cy="100"
            r="92"
            fill="none"
            stroke={live ? '#ff6b6b' : '#f03030'}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - ring)}
            style={{ transition: armed ? 'stroke-dashoffset 1s linear' : 'stroke-dashoffset 80ms linear' }}
          />
        </svg>

        {!live ? (
          <span className="absolute h-[176px] w-[176px] animate-pulseRing rounded-full bg-danger-500/20" />
        ) : null}

        <button
          type="button"
          onPointerDown={live ? undefined : start}
          onPointerUp={live ? undefined : stop}
          onPointerLeave={live ? undefined : stop}
          onPointerCancel={live ? undefined : stop}
          onClick={() => {
            if (live) return;
            if (armed) onCancel();
            else if (progress === 0) onArm();
          }}
          aria-label={
            live ? 'SOS active' : armed ? `Cancel SOS, ${countdown} seconds` : 'Send SOS alert'
          }
          className={`relative grid h-[172px] w-[172px] select-none place-items-center rounded-full
                      text-white shadow-glow-danger transition active:scale-[0.97] ${
                        live ? 'bg-danger-600' : 'bg-danger-500 hover:bg-danger-400'
                      }`}
        >
          {armed ? (
            <span className="flex flex-col items-center">
              <span className="font-mono text-6xl font-bold leading-none">{countdown}</span>
              <span className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em]">
                Tap to cancel
              </span>
            </span>
          ) : live ? (
            <span className="flex flex-col items-center">
              <Siren size={44} className="animate-beacon" />
              <span className="mt-2 text-sm font-extrabold uppercase tracking-[0.18em]">
                SOS live
              </span>
            </span>
          ) : (
            <span className="flex flex-col items-center">
              <Siren size={46} strokeWidth={2.2} />
              <span className="mt-1.5 text-2xl font-extrabold tracking-wide">SOS</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-80">
                Tap or hold
              </span>
            </span>
          )}
        </button>
      </div>

      <p className="mt-4 max-w-[280px] text-center text-xs leading-relaxed text-slate-400">
        {live ? (
          <span className="font-semibold text-danger-400">
            Alert sent. Your contacts have your live location.
          </span>
        ) : armed ? (
          'Sending in a moment — tap the button again to stop it.'
        ) : (
          <>
            <span className="font-semibold text-slate-300">Tap</span> for a 5-second countdown,
            or <span className="font-semibold text-slate-300">hold</span> to send right now.
          </>
        )}
      </p>
    </div>
  );
}
