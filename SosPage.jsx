import { useState } from 'react';
import {
  Bell,
  Building2,
  Copy,
  Heart,
  MapPin,
  Phone,
  ShieldAlert,
  Siren,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import AppHeader from '../components/AppHeader';
import SosButton from '../components/sos/SosButton';
import CallConfirm from '../components/sos/CallConfirm';
import ContactsModal from '../components/sos/ContactsModal';
import { useApp } from '../context/AppContext';
import { useAlerts } from '../context/AlertContext';
import { PUBLIC_LINES } from '../data/contacts';

const LINE_ICON = {
  'line-911': ShieldAlert,
  'line-iupd': Building2,
  'line-bpd': Phone,
  'line-crisis': Heart,
};

const TONE = {
  danger: 'text-danger-400',
  pending: 'text-slate-500',
  ok: 'text-safe-400',
  warn: 'text-warn-400',
};

export default function SosPage() {
  const { location, contacts, notifiedContacts } = useApp();
  const {
    sosState,
    countdown,
    armSeconds,
    armSos,
    sendSosNow,
    cancelSos,
    activeAlert,
    dispatchLog,
    alarmOn,
    toggleAlarm,
    toast,
  } = useAlerts();

  const [callTarget, setCallTarget] = useState(null);
  const [contactsOpen, setContactsOpen] = useState(false);

  const copyLink = async () => {
    if (!activeAlert) return;
    try {
      await navigator.clipboard.writeText(activeAlert.trackingLink);
      toast('Tracking link copied.', 'safe');
    } catch {
      toast('Clipboard blocked — the link is shown above.', 'warn');
    }
  };

  return (
    <div className="min-h-[calc(100dvh-58px-var(--sa-bottom))] pb-6">
      <AppHeader
        title="Emergency"
        subtitle={`${notifiedContacts.length} of ${contacts.length} contacts will be alerted`}
      />

      {/* --------------------------------------------------------- the button -- */}
      <section className="px-4 pb-2 pt-6">
        <SosButton
          state={sosState}
          countdown={countdown}
          armSeconds={armSeconds}
          onArm={() => armSos('Manual SOS')}
          onSendNow={() => sendSosNow('Manual SOS — held')}
          onCancel={() => cancelSos('Cancelled before sending')}
        />
      </section>

      {/* -------------------------------------------------------- live alert -- */}
      {sosState === 'active' && activeAlert ? (
        <section className="mx-4 mt-5 animate-slideUp overflow-hidden rounded-2xl border
                            border-danger-400/35 bg-danger-500/[0.08]">
          <div className="flex items-center gap-2 border-b border-danger-400/20 px-4 py-3">
            <Siren size={16} className="animate-beacon text-danger-400" />
            <span className="flex-1 text-sm font-bold text-white">Alert in progress</span>
            <button
              type="button"
              onClick={() => cancelSos("I'm safe")}
              className="btn min-h-[34px] bg-safe-500 px-3 py-1 text-xs text-ink-900 hover:bg-safe-400"
            >
              I'm safe
            </button>
          </div>

          <div className="space-y-3 px-4 py-3.5">
            <div className="flex items-start gap-2.5">
              <MapPin size={15} className="mt-0.5 shrink-0 text-danger-400" />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[12px] text-slate-200">
                  {activeAlert.lat.toFixed(5)}, {activeAlert.lng.toFixed(5)}
                </p>
                <p className="text-[11px] text-slate-500">
                  {activeAlert.locationSource === 'gps'
                    ? 'GPS fix · updating every 5 s'
                    : 'Simulated position · enable GPS from the header'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={copyLink}
              className="flex w-full items-center gap-2 rounded-xl border border-white/10
                         bg-ink-900/60 px-3 py-2.5 text-left transition hover:bg-ink-900"
            >
              <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-spark-400">
                {activeAlert.trackingLink}
              </span>
              <Copy size={14} className="shrink-0 text-slate-500" />
            </button>

            <div className="scroll-area max-h-44 space-y-1.5 rounded-xl bg-ink-900/60 p-3">
              {dispatchLog.map((entry) => (
                <p
                  key={entry.id}
                  className={`flex gap-2 text-[11px] leading-snug ${
                    TONE[entry.tone] || 'text-slate-400'
                  }`}
                >
                  <span className="shrink-0 font-mono text-slate-600">{entry.at}</span>
                  <span className="flex-1">{entry.text}</span>
                </p>
              ))}
              {dispatchLog.length === 0 ? (
                <p className="text-[11px] text-slate-500">Dispatching…</p>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {/* ------------------------------------------------------------- alarm -- */}
      <section className="px-4 pt-5">
        <button
          type="button"
          onClick={toggleAlarm}
          aria-pressed={alarmOn}
          className={`flex w-full items-center gap-3.5 rounded-2xl border p-4 text-left
                      transition active:scale-[0.99] ${
                        alarmOn
                          ? 'border-danger-400/50 bg-danger-500/15'
                          : 'border-white/10 bg-white/5 hover:bg-white/[0.08]'
                      }`}
        >
          <span
            className={`relative grid h-12 w-12 shrink-0 place-items-center rounded-full ${
              alarmOn ? 'bg-danger-500' : 'bg-white/10'
            }`}
          >
            {alarmOn ? (
              <>
                <span className="absolute inset-0 animate-pulseRing rounded-full bg-danger-500/40" />
                <Volume2 size={22} className="relative text-white" />
              </>
            ) : (
              <VolumeX size={22} className="text-slate-300" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-white">
              {alarmOn ? 'Alarm sounding — tap to silence' : 'Personal alarm'}
            </span>
            <span className="mt-0.5 block text-[11.5px] leading-snug text-slate-400">
              {alarmOn
                ? 'Keep the phone out of your pocket so the speaker is not muffled.'
                : 'Loud two-tone siren through your phone speaker. Turn your volume up first.'}
            </span>
          </span>
        </button>
      </section>

      {/* --------------------------------------------------------- speed dial -- */}
      <section className="px-4 pt-6">
        <h2 className="label mb-3">Speed dial</h2>
        <div className="grid grid-cols-2 gap-2.5">
          {PUBLIC_LINES.map((line) => {
            const Icon = LINE_ICON[line.id] || Phone;
            return (
              <button
                key={line.id}
                type="button"
                onClick={() => setCallTarget(line)}
                className={`flex min-h-[92px] flex-col items-start gap-1.5 rounded-2xl border p-3.5
                            text-left transition active:scale-[0.98] ${
                              line.emergency
                                ? 'border-danger-400/40 bg-danger-500/12 hover:bg-danger-500/20'
                                : 'border-white/10 bg-white/5 hover:bg-white/[0.09]'
                            }`}
              >
                <Icon
                  size={19}
                  className={line.emergency ? 'text-danger-400' : 'text-spark-400'}
                />
                <span className="text-[13.5px] font-bold leading-tight text-white">
                  {line.name}
                </span>
                <span className="text-[10.5px] leading-tight text-slate-500">{line.role}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ----------------------------------------------------------- contacts -- */}
      <section className="px-4 pt-6">
        <div className="mb-3 flex items-center">
          <h2 className="label flex items-center gap-1.5">
            <Users size={12} />
            Trusted contacts
          </h2>
          <button
            type="button"
            onClick={() => setContactsOpen(true)}
            className="ml-auto text-xs font-bold text-spark-400 hover:text-spark-500"
          >
            Manage
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {contacts.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCallTarget(c)}
              className="flex min-h-[96px] flex-col items-center justify-center gap-1.5 rounded-2xl
                         border border-white/10 bg-white/5 p-2.5 text-center transition
                         hover:bg-white/[0.09] active:scale-[0.98]"
            >
              <span className="relative grid h-11 w-11 place-items-center rounded-full
                               bg-spark-500/15 text-base font-bold text-spark-400">
                {c.name.slice(0, 1).toUpperCase()}
                {c.notify ? (
                  <span className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center
                                   rounded-full border-2 border-ink-900 bg-safe-500">
                    <Bell size={9} className="text-ink-900" />
                  </span>
                ) : null}
              </span>
              <span className="w-full truncate text-[11.5px] font-semibold text-slate-200">
                {c.name}
              </span>
            </button>
          ))}

          <button
            type="button"
            onClick={() => setContactsOpen(true)}
            className="flex min-h-[96px] flex-col items-center justify-center gap-1.5 rounded-2xl
                       border border-dashed border-white/15 p-2.5 text-center text-slate-500
                       transition hover:border-spark-400/50 hover:text-spark-400 active:scale-[0.98]"
          >
            <span className="grid h-11 w-11 place-items-center rounded-full border border-white/10">
              +
            </span>
            <span className="text-[11.5px] font-semibold">Add</span>
          </button>
        </div>
      </section>

      <p className="mx-4 mt-6 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3
                    text-[11px] leading-relaxed text-slate-500">
        Prototype behaviour: SOS messages, push alerts and the tracking link are simulated
        on-screen and nothing is transmitted. Dialling opens your phone's own dialer — SafeSpark
        never places a call for you. For a real emergency, call 911.
      </p>

      <CallConfirm target={callTarget} onClose={() => setCallTarget(null)} />
      <ContactsModal open={contactsOpen} onClose={() => setContactsOpen(false)} />
    </div>
  );
}
