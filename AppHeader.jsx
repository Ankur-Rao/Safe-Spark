import { Link, useNavigate } from 'react-router-dom';
import { Crosshair, LoaderCircle, Satellite, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAlerts } from '../context/AlertContext';

export default function AppHeader({ title, subtitle, actions }) {
  const { location, locating, requestLocation } = useApp();
  const { sosState, activeAlert, cancelSos } = useAlerts();
  const navigate = useNavigate();

  const gps = location.source === 'gps';

  return (
    <header className="sticky top-0 z-[900] border-b border-white/10 bg-ink-900/90 backdrop-blur-xl">
      {sosState === 'active' ? (
        // Two real buttons side by side rather than a button inside a button:
        // nesting them swallows the inner click and breaks keyboard access.
        <div className="flex items-center gap-2 bg-danger-600 px-4 py-2">
          <button
            type="button"
            onClick={() => navigate('/sos')}
            className="flex min-w-0 flex-1 items-center gap-2 py-1 text-left"
          >
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-pulseRing rounded-full bg-white" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
            </span>
            <span className="truncate text-xs font-bold uppercase tracking-wider text-white">
              SOS active · contacts notified
            </span>
          </button>
          <button
            type="button"
            onClick={() => cancelSos("I'm safe")}
            className="shrink-0 rounded-full bg-white/20 px-3 py-1.5 text-[11px] font-bold
                       text-white transition hover:bg-white/30 active:scale-95"
          >
            I'm safe
          </button>
        </div>
      ) : null}

      <div className="mx-auto flex max-w-xl items-center gap-3 px-4 pb-3 pt-[max(0.75rem,var(--sa-top))]">
        <Link to="/map" className="flex shrink-0 items-center gap-2" aria-label="SafeSpark home">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-spark-500/15 shadow-glow">
            <ShieldCheck size={19} className="text-spark-400" />
          </span>
        </Link>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[17px] font-bold leading-tight text-white">{title}</h1>
          {subtitle ? (
            <p className="truncate text-xs leading-tight text-slate-400">{subtitle}</p>
          ) : null}
        </div>

        {actions}

        <button
          type="button"
          onClick={() => requestLocation()}
          disabled={locating}
          title={
            gps
              ? `GPS fix · ±${Math.round(location.accuracy ?? 0)} m`
              : 'Simulated campus position — tap to use real GPS'
          }
          className={`flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5
                      text-[11px] font-bold transition ${
                        gps
                          ? 'border-safe-400/40 bg-safe-500/10 text-safe-400'
                          : 'border-warn-400/40 bg-warn-500/10 text-warn-400'
                      }`}
        >
          {locating ? (
            <LoaderCircle size={13} className="animate-spin" />
          ) : gps ? (
            <Satellite size={13} />
          ) : (
            <Crosshair size={13} />
          )}
          {locating ? 'Locating' : gps ? 'GPS' : 'Sim'}
        </button>
      </div>
    </header>
  );
}
