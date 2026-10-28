import { Phone, PhoneCall } from 'lucide-react';
import Modal from '../Modal';

/**
 * Every dial goes through here. A one-tap 911 is a great feature and a terrible
 * accident, so the app opens the system dialer pre-filled and lets the person
 * press the final call button themselves.
 */
export default function CallConfirm({ target, onClose }) {
  const open = Boolean(target);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={target ? `Call ${target.name}?` : ''}
      subtitle={target?.role || target?.relation}
      size="sm"
      footer={
        <div className="flex gap-2">
          <button type="button" className="btn-ghost flex-1" onClick={onClose}>
            Not now
          </button>
          <a
            href={`tel:${(target?.number || '').replace(/[^\d+]/g, '')}`}
            onClick={onClose}
            className={`btn flex-[2] ${
              target?.emergency
                ? 'bg-danger-500 text-white hover:bg-danger-400'
                : 'bg-spark-500 text-ink-900 hover:bg-spark-400'
            }`}
          >
            <PhoneCall size={17} />
            Open dialer
          </a>
        </div>
      }
    >
      {target ? (
        <div className="space-y-4 text-center">
          <div
            className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${
              target.emergency ? 'bg-danger-500/15' : 'bg-spark-500/15'
            }`}
          >
            <Phone
              size={26}
              className={target.emergency ? 'text-danger-400' : 'text-spark-400'}
            />
          </div>
          <p className="font-mono text-2xl font-bold tracking-wide text-white">
            {target.number}
          </p>
          {target.note ? (
            <p className="text-sm leading-relaxed text-slate-400">{target.note}</p>
          ) : null}
          <p className="text-[11px] leading-relaxed text-slate-500">
            SafeSpark opens your phone's dialer with the number filled in. You press call —
            the app never places one for you.
          </p>
        </div>
      ) : null}
    </Modal>
  );
}
