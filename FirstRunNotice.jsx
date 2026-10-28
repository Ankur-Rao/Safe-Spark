import { useState } from 'react';
import { Phone, ShieldAlert } from 'lucide-react';
import Modal from './Modal';
import { useLocalStorage } from '../lib/hooks';
import { isSupabaseConfigured } from '../lib/supabase';

/**
 * Shown once per device. A safety app that simulates its alerts has to say so
 * before the first use, not in a footnote — if someone believes the SOS reached
 * their roommate when it did not, the product has done harm.
 */
export default function FirstRunNotice() {
  const [seen, setSeen] = useLocalStorage('safespark.notice.v1', false);
  const [open, setOpen] = useState(!seen);

  const close = () => {
    setSeen(true);
    setOpen(false);
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Before you start"
      subtitle="SafeSpark is a working prototype, not a live emergency service."
      footer={
        <button type="button" className="btn-primary w-full" onClick={close}>
          I understand — open SafeSpark
        </button>
      }
    >
      <div className="space-y-4 text-sm leading-relaxed text-slate-300">
        <div className="flex gap-3 rounded-2xl border border-danger-400/30 bg-danger-500/10 p-4">
          <Phone size={20} className="mt-0.5 shrink-0 text-danger-400" />
          <p className="text-slate-200">
            <strong className="text-white">In a real emergency, call 911.</strong> Nothing
            in this prototype contacts police, dispatch or anyone else on your behalf.
          </p>
        </div>

        <div className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <ShieldAlert size={20} className="mt-0.5 shrink-0 text-warn-400" />
          <div className="space-y-2">
            <p>
              SOS alerts, contact notifications and the AI companion are{' '}
              <strong className="text-white">simulated</strong> so the flow can be
              designed and tested. Messages are rendered on-screen only.
            </p>
            <p>
              Blue light locations are hand-placed approximations for the demo and are
              not a verified IU Public Safety dataset.
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Data mode:{' '}
          <span className="font-semibold text-slate-300">
            {isSupabaseConfigured ? 'Supabase (live)' : 'local demo storage'}
          </span>
          . Community reports you file stay on this device until Supabase keys are added.
        </p>
      </div>
    </Modal>
  );
}
