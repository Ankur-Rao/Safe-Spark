import { useState } from 'react';
import { Bell, BellOff, Plus, Trash2, UserPlus } from 'lucide-react';
import Modal from '../Modal';
import { useApp } from '../../context/AppContext';

export default function ContactsModal({ open, onClose }) {
  const { contacts, addContact, removeContact, toggleContactNotify } = useApp();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', relation: '', number: '' });

  const valid = form.name.trim().length > 1 && form.number.trim().length >= 7;

  const save = () => {
    if (!valid) return;
    addContact({
      name: form.name.trim(),
      relation: form.relation.trim() || 'Contact',
      number: form.number.trim(),
    });
    setForm({ name: '', relation: '', number: '' });
    setAdding(false);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Trusted contacts"
      subtitle="Everyone with the bell on gets your location the moment you send an SOS."
      footer={
        adding ? (
          <div className="flex gap-2">
            <button type="button" className="btn-ghost flex-1" onClick={() => setAdding(false)}>
              Cancel
            </button>
            <button type="button" className="btn-primary flex-[2]" disabled={!valid} onClick={save}>
              Add contact
            </button>
          </div>
        ) : (
          <button type="button" className="btn-primary w-full" onClick={() => setAdding(true)}>
            <UserPlus size={17} />
            Add a contact
          </button>
        )
      }
    >
      <div className="space-y-3">
        {contacts.length === 0 && !adding ? (
          <p className="py-8 text-center text-sm text-slate-500">
            No trusted contacts yet. An SOS with nobody to notify only makes noise.
          </p>
        ) : null}

        {contacts.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-spark-500/15
                             text-sm font-bold text-spark-400">
              {c.name.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-100">{c.name}</p>
              <p className="truncate text-[11px] text-slate-500">
                {c.relation} · {c.number}
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggleContactNotify(c.id)}
              aria-pressed={c.notify}
              aria-label={c.notify ? 'Stop notifying' : 'Notify on SOS'}
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition ${
                c.notify
                  ? 'bg-safe-500/15 text-safe-400'
                  : 'bg-white/5 text-slate-500 hover:text-slate-300'
              }`}
            >
              {c.notify ? <Bell size={16} /> : <BellOff size={16} />}
            </button>
            <button
              type="button"
              onClick={() => removeContact(c.id)}
              aria-label={`Remove ${c.name}`}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-500
                         transition hover:bg-danger-500/15 hover:text-danger-400"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        {adding ? (
          <div className="animate-slideUp space-y-2.5 rounded-2xl border border-spark-400/30
                          bg-spark-500/[0.07] p-3.5">
            <p className="label flex items-center gap-1.5">
              <Plus size={12} />
              New contact
            </p>
            <input
              className="input"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="input"
              placeholder="Relationship (roommate, parent…)"
              value={form.relation}
              onChange={(e) => setForm({ ...form, relation: e.target.value })}
            />
            <input
              className="input"
              type="tel"
              inputMode="tel"
              placeholder="Phone number"
              value={form.number}
              onChange={(e) => setForm({ ...form, number: e.target.value })}
            />
          </div>
        ) : null}

        <p className="pt-1 text-[11px] leading-relaxed text-slate-500">
          Contacts are stored on this device only. Nothing is sent to them in this prototype —
          the dispatch log on the SOS screen shows exactly what a live build would send.
        </p>
      </div>
    </Modal>
  );
}
