import { useEffect, useRef } from 'react';
import { Bot, PhoneCall, TriangleAlert, User } from 'lucide-react';

const ROLE = {
  agent: {
    Icon: Bot,
    wrap: 'bg-spark-500/10 border-spark-400/25',
    name: 'SafeSpark',
    nameClass: 'text-spark-400',
  },
  caller: {
    Icon: PhoneCall,
    wrap: 'bg-safe-500/10 border-safe-400/25',
    name: 'Marcus (simulated)',
    nameClass: 'text-safe-400',
  },
  you: {
    Icon: User,
    wrap: 'bg-white/5 border-white/10',
    name: 'You',
    nameClass: 'text-slate-300',
  },
  system: {
    Icon: TriangleAlert,
    wrap: 'bg-transparent border-transparent',
    name: 'System',
    nameClass: 'text-slate-500',
  },
};

export default function TranscriptStream({ lines, interim, listening }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [lines, interim]);

  return (
    <div className="scroll-area flex-1 space-y-2.5 px-4 py-4" aria-live="polite">
      {lines.length === 0 ? (
        <p className="py-10 text-center text-sm leading-relaxed text-slate-500">
          The transcript appears here once a session starts.
          <br />
          Nothing is recorded or uploaded in this prototype.
        </p>
      ) : null}

      {lines.map((line) => {
        const role = ROLE[line.role] || ROLE.system;
        const { Icon } = role;

        if (line.role === 'system') {
          const tone =
            line.tone === 'critical'
              ? 'text-danger-400'
              : line.tone === 'warn' || line.tone === 'elevated'
                ? 'text-warn-400'
                : 'text-slate-500';
          return (
            <div key={line.id} className={`flex items-center gap-2 px-1 py-1 text-[11px] ${tone}`}>
              <Icon size={12} className="shrink-0" />
              <span className="flex-1 leading-snug">{line.text}</span>
              <span className="shrink-0 font-mono text-[10px] opacity-60">{line.at}</span>
            </div>
          );
        }

        const critical = line.tone === 'critical';
        const elevated = line.tone === 'elevated';

        return (
          <div
            key={line.id}
            className={`rounded-2xl border px-3.5 py-2.5 ${
              critical
                ? 'border-danger-400/40 bg-danger-500/12'
                : elevated
                  ? 'border-warn-400/35 bg-warn-500/10'
                  : role.wrap
            } ${line.role === 'you' ? 'ml-8' : 'mr-8'}`}
          >
            <div className="mb-1 flex items-center gap-1.5">
              <Icon
                size={12}
                className={critical ? 'text-danger-400' : elevated ? 'text-warn-400' : role.nameClass}
              />
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  critical ? 'text-danger-400' : elevated ? 'text-warn-400' : role.nameClass
                }`}
              >
                {role.name}
              </span>
              {line.tone === 'prompt' ? (
                <span className="rounded-full bg-white/10 px-1.5 text-[9px] font-bold text-slate-400">
                  SAY THIS
                </span>
              ) : null}
              <span className="ml-auto font-mono text-[10px] text-slate-600">{line.at}</span>
            </div>
            <p className="text-[13.5px] leading-relaxed text-slate-100">{line.text}</p>
          </div>
        );
      })}

      {listening && interim ? (
        <div className="ml-8 rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2.5 opacity-70">
          <p className="text-[13.5px] italic leading-relaxed text-slate-300">{interim}…</p>
        </div>
      ) : null}

      <div ref={endRef} />
    </div>
  );
}
