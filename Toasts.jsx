import { CircleCheck, Info, TriangleAlert, X } from 'lucide-react';
import { useAlerts } from '../context/AlertContext';

const TONE = {
  safe: { icon: CircleCheck, ring: 'border-safe-400/40', text: 'text-safe-400' },
  warn: { icon: TriangleAlert, ring: 'border-warn-400/40', text: 'text-warn-400' },
  danger: { icon: TriangleAlert, ring: 'border-danger-400/50', text: 'text-danger-400' },
  info: { icon: Info, ring: 'border-spark-400/40', text: 'text-spark-400' },
};

export default function Toasts() {
  const { toasts, dismissToast } = useAlerts();
  if (!toasts.length) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-[max(0.75rem,var(--sa-top))] z-[1400]
                 flex flex-col items-center gap-2 px-3"
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => {
        const tone = TONE[t.kind] || TONE.info;
        const Icon = tone.icon;
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex w-full max-w-sm animate-slideUp items-start gap-3
                        rounded-2xl border ${tone.ring} bg-ink-800/95 px-4 py-3
                        shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl`}
          >
            <Icon size={18} className={`mt-0.5 shrink-0 ${tone.text}`} />
            <p className="flex-1 text-sm leading-snug text-slate-100">{t.message}</p>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              aria-label="Dismiss"
              className="-mr-1 -mt-0.5 grid h-7 w-7 place-items-center rounded-full
                         text-slate-500 transition hover:bg-white/10 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
