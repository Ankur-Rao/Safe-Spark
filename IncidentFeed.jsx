import {
  Car,
  Check,
  Lightbulb,
  MessageSquareWarning,
  ThumbsUp,
  TriangleAlert,
  UserX,
  Users,
} from 'lucide-react';
import { CATEGORY_BY_ID } from '../../data/incidents';
import { formatFeet } from '../../lib/geo';
import { timeAgo } from '../../lib/time';

const ICONS = {
  Lightbulb,
  MessageSquareWarning,
  UserX,
  Car,
  Users,
  TriangleAlert,
};

export default function IncidentFeed({
  items,
  selectedId,
  onSelect,
  onConfirm,
  confirmedIds,
  emptyHint,
}) {
  if (!items.length) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-sm text-slate-400">No reports match these filters.</p>
        {emptyHint ? (
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{emptyHint}</p>
        ) : null}
      </div>
    );
  }

  return (
    <ul className="divide-y divide-white/5">
      {items.map((inc) => {
        const cat = CATEGORY_BY_ID[inc.category];
        const Icon = ICONS[cat?.icon] || TriangleAlert;
        const selected = inc.id === selectedId;
        const alreadyConfirmed = confirmedIds?.has(inc.id);

        return (
          <li key={inc.id}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => onSelect?.(inc)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelect?.(inc);
              }}
              className={`flex cursor-pointer gap-3 px-4 py-3.5 transition ${
                selected ? 'bg-white/[0.07]' : 'hover:bg-white/[0.035]'
              }`}
            >
              <span
                className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl"
                style={{ background: `${cat?.color ?? '#94a3b8'}22` }}
              >
                <Icon size={17} style={{ color: cat?.color ?? '#94a3b8' }} />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span
                    className="truncate text-[13px] font-bold"
                    style={{ color: cat?.color ?? '#cbd5e1' }}
                  >
                    {cat?.label ?? 'Report'}
                  </span>
                  <span className="ml-auto shrink-0 text-[11px] text-slate-500">
                    {timeAgo(inc.created_at)}
                  </span>
                </div>

                <p className="mt-1 text-[13px] leading-snug text-slate-200">
                  {inc.description}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <span className="text-[11px] text-slate-500">{inc.author}</span>
                  {inc._distance != null ? (
                    <span className="text-[11px] font-semibold text-spark-400">
                      {formatFeet(inc._distance)} away
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onConfirm?.(inc.id);
                    }}
                    disabled={alreadyConfirmed}
                    className={`ml-auto flex min-h-[30px] items-center gap-1.5 rounded-full border
                                px-2.5 py-1 text-[11px] font-bold transition ${
                                  alreadyConfirmed
                                    ? 'border-safe-400/40 bg-safe-500/10 text-safe-400'
                                    : 'border-white/12 bg-white/5 text-slate-300 hover:bg-white/10 active:scale-95'
                                }`}
                  >
                    {alreadyConfirmed ? <Check size={12} /> : <ThumbsUp size={12} />}
                    {inc.confirmations || 0}
                    <span className="font-medium">
                      {alreadyConfirmed ? 'confirmed' : 'saw it too'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
