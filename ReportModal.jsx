import { useEffect, useState } from 'react';
import {
  Car,
  Crosshair,
  EyeOff,
  Lightbulb,
  MapPin,
  MessageSquareWarning,
  TriangleAlert,
  UserX,
  Users,
} from 'lucide-react';
import Modal from '../Modal';
import { INCIDENT_CATEGORIES } from '../../data/incidents';

const ICONS = {
  Lightbulb,
  MessageSquareWarning,
  UserX,
  Car,
  Users,
  TriangleAlert,
};

const MAX_LEN = 320;

export default function ReportModal({
  open,
  onClose,
  onSubmit,
  location,
  pickedPoint,
  onRequestPick,
}) {
  const [category, setCategory] = useState(null);
  const [description, setDescription] = useState('');
  const [anonymous, setAnonymous] = useState(true);
  const [usePicked, setUsePicked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (pickedPoint) setUsePicked(true);
  }, [pickedPoint]);

  // Reset only on a fresh open, so the pick-on-map round trip keeps the draft.
  useEffect(() => {
    if (!open) {
      setSubmitting(false);
    }
  }, [open]);

  const point = usePicked && pickedPoint ? pickedPoint : location;
  const canSubmit = Boolean(category) && description.trim().length >= 4 && !submitting;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    await onSubmit({
      category,
      description,
      lat: point.lat,
      lng: point.lng,
      anonymous,
    });
    setCategory(null);
    setDescription('');
    setAnonymous(true);
    setUsePicked(false);
    setSubmitting(false);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Report a safety concern"
      subtitle="Other students see this on the map within seconds."
      footer={
        <div className="flex gap-2">
          <button type="button" className="btn-ghost flex-1" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary flex-[2]"
            disabled={!canSubmit}
            onClick={submit}
          >
            {submitting ? 'Posting…' : 'Post report'}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <p className="label mb-2">What happened?</p>
          <div className="grid grid-cols-2 gap-2">
            {INCIDENT_CATEGORIES.map((cat) => {
              const Icon = ICONS[cat.icon] || TriangleAlert;
              const on = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  aria-pressed={on}
                  className={`flex min-h-[64px] flex-col items-start gap-1.5 rounded-xl border p-3
                              text-left transition active:scale-[0.98] ${
                                on
                                  ? 'border-transparent bg-white/10'
                                  : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07]'
                              }`}
                  style={on ? { borderColor: cat.color, background: `${cat.color}1f` } : undefined}
                >
                  <Icon size={17} style={{ color: cat.color }} />
                  <span className="text-[12.5px] font-semibold leading-tight text-slate-100">
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
          {category ? (
            <p className="mt-2 text-[11px] leading-snug text-slate-500">
              {INCIDENT_CATEGORIES.find((c) => c.id === category)?.hint}
            </p>
          ) : null}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="label">Describe it</span>
            <span
              className={`text-[11px] ${
                description.length > MAX_LEN - 40 ? 'text-warn-400' : 'text-slate-600'
              }`}
            >
              {description.length}/{MAX_LEN}
            </span>
          </div>
          <textarea
            value={description}
            maxLength={MAX_LEN}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Where exactly, what you saw, and whether it is still happening."
            className="input resize-none"
          />
          <p className="mt-2 text-[11px] leading-snug text-slate-500">
            Describe behaviour and clothing, not race or ethnicity. Reports that identify
            people by appearance alone get removed.
          </p>
        </div>

        <div>
          <p className="label mb-2">Location</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setUsePicked(false)}
              aria-pressed={!usePicked}
              className={`btn min-h-[52px] flex-col gap-0.5 text-xs ${
                !usePicked
                  ? 'border border-spark-400/60 bg-spark-500/15 text-spark-400'
                  : 'border border-white/12 bg-white/5 text-slate-300'
              }`}
            >
              <Crosshair size={16} />
              Where I am
            </button>
            <button
              type="button"
              onClick={onRequestPick}
              aria-pressed={usePicked}
              className={`btn min-h-[52px] flex-col gap-0.5 text-xs ${
                usePicked
                  ? 'border border-spark-400/60 bg-spark-500/15 text-spark-400'
                  : 'border border-white/12 bg-white/5 text-slate-300'
              }`}
            >
              <MapPin size={16} />
              {pickedPoint ? 'Pin set — change' : 'Drop a pin'}
            </button>
          </div>
          <p className="mt-2 font-mono text-[11px] text-slate-500">
            {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
            {!usePicked && location.source !== 'gps' ? ' · simulated position' : ''}
          </p>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10
                          bg-white/5 p-3.5">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-spark-500"
          />
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-100">
              <EyeOff size={14} className="text-slate-400" />
              Post anonymously
            </span>
            <span className="mt-1 block text-[11px] leading-snug text-slate-500">
              {anonymous
                ? 'Your name is hidden from other students. Moderators can still see the account behind a report.'
                : 'Your first name and last initial appear on the report.'}
            </span>
          </span>
        </label>

        <p className="rounded-xl border border-danger-400/25 bg-danger-500/10 px-3.5 py-2.5
                      text-[11px] leading-relaxed text-slate-300">
          This is a community board, not a police report. If something is happening right
          now, call 911 or use the SOS tab first.
        </p>
      </div>
    </Modal>
  );
}
