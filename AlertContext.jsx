import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useApp } from './AppContext';
import { blip, startSiren, stopSiren, vibrate } from '../lib/audio';
import { stamp, uid } from '../lib/time';

const AlertContext = createContext(null);

const ARM_SECONDS = 5;

/**
 * SOS lifecycle, the audible alarm, and the toast queue.
 *
 * ⚠️ Everything dispatched here is SIMULATED. No SMS, push or call leaves the
 * device in the MVP — the dispatch log models the timing of a real Twilio /
 * Expo-push integration so the flow, copy and failure states can be designed
 * and user-tested before a single message is paid for.
 */
export function AlertProvider({ children }) {
  const { location, notifiedContacts, settings, profile } = useApp();

  const [sosState, setSosState] = useState('idle'); // idle | arming | active
  const [countdown, setCountdown] = useState(ARM_SECONDS);
  const [activeAlert, setActiveAlert] = useState(null);
  const [dispatchLog, setDispatchLog] = useState([]);
  const [alertHistory, setAlertHistory] = useState([]);
  const [alarmOn, setAlarmOn] = useState(false);
  const [toasts, setToasts] = useState([]);

  const armTimer = useRef(null);
  const dispatchTimers = useRef([]);
  const latest = useRef({ location, notifiedContacts, profile });

  useEffect(() => {
    latest.current = { location, notifiedContacts, profile };
  }, [location, notifiedContacts, profile]);

  // --------------------------------------------------------------- toasts --
  const toast = useCallback((message, kind = 'info', ttl = 4200) => {
    const id = uid('toast');
    setToasts((list) => [...list, { id, message, kind }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), ttl);
    return id;
  }, []);

  const dismissToast = useCallback(
    (id) => setToasts((list) => list.filter((t) => t.id !== id)),
    [],
  );

  // ---------------------------------------------------------- dispatch log --
  const pushLog = useCallback((entry) => {
    setDispatchLog((log) => [
      ...log,
      { id: uid('log'), at: stamp(), ...entry },
    ]);
  }, []);

  const clearDispatchTimers = useCallback(() => {
    dispatchTimers.current.forEach(clearTimeout);
    dispatchTimers.current = [];
  }, []);

  const later = useCallback((ms, fn) => {
    const id = setTimeout(fn, ms);
    dispatchTimers.current.push(id);
    return id;
  }, []);

  // --------------------------------------------------------------- the SOS --
  const fireSos = useCallback(
    (reason = 'Manual SOS') => {
      const { location: loc, notifiedContacts: targets, profile: who } = latest.current;

      const alert = {
        id: uid('sos'),
        reason,
        startedAt: new Date().toISOString(),
        lat: loc.lat,
        lng: loc.lng,
        locationSource: loc.source,
        // Simulated share link — a real build would mint a signed, expiring
        // token server-side and stream position to it.
        trackingLink: `https://track.safespark.app/l/${Math.random()
          .toString(36)
          .slice(2, 8)
          .toUpperCase()}`,
        recipients: targets.map((c) => c.name),
      };

      setActiveAlert(alert);
      setSosState('active');
      setDispatchLog([]);
      clearDispatchTimers();

      vibrate([120, 60, 120, 60, 240]);
      blip('alert');

      pushLog({
        kind: 'system',
        text: `SOS triggered — ${reason}`,
        tone: 'danger',
      });
      pushLog({
        kind: 'system',
        text: `Location locked: ${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)} (${
          loc.source === 'gps' ? 'GPS' : 'simulated'
        })`,
      });

      if (!targets.length) {
        later(500, () =>
          pushLog({
            kind: 'system',
            tone: 'warn',
            text: 'No trusted contacts are set to notify — add one in Contacts below.',
          }),
        );
      }

      targets.forEach((contact, i) => {
        later(650 + i * 420, () =>
          pushLog({
            kind: 'sms',
            tone: 'pending',
            text: `SMS queued → ${contact.name} (${contact.number})`,
          }),
        );
        later(1500 + i * 520, () =>
          pushLog({
            kind: 'sms',
            tone: 'ok',
            text: `Delivered → ${contact.name}: "${who.name} triggered SafeSpark SOS at IU Bloomington. Live location: ${alert.trackingLink}"`,
          }),
        );
      });

      later(900, () =>
        pushLog({
          kind: 'push',
          tone: 'ok',
          text: 'Push alert sent to all SafeSpark contacts nearby',
        }),
      );

      if (settings.shareLocationWithContacts) {
        later(2200, () =>
          pushLog({
            kind: 'system',
            tone: 'ok',
            text: 'Live location sharing is ON — updates every 5 s until you cancel',
          }),
        );
      }

      later(3400, () =>
        pushLog({
          kind: 'system',
          tone: 'warn',
          text: 'Prototype stops here. A production build would now offer a one-tap 911 dial.',
        }),
      );

      return alert;
    },
    [clearDispatchTimers, later, pushLog, settings.shareLocationWithContacts],
  );

  const armSos = useCallback(
    (reason = 'Manual SOS') => {
      if (sosState === 'active') return;
      setSosState('arming');
      setCountdown(ARM_SECONDS);
      vibrate(60);

      let remaining = ARM_SECONDS;
      clearInterval(armTimer.current);
      armTimer.current = setInterval(() => {
        remaining -= 1;
        setCountdown(remaining);
        vibrate(40);
        if (remaining <= 0) {
          clearInterval(armTimer.current);
          armTimer.current = null;
          fireSos(reason);
        }
      }, 1000);
    },
    [fireSos, sosState],
  );

  /** Skip the countdown — used by hold-to-send and by agent trigger phrases. */
  const sendSosNow = useCallback(
    (reason = 'Manual SOS') => {
      clearInterval(armTimer.current);
      armTimer.current = null;
      if (sosState === 'active') {
        pushLog({ kind: 'system', tone: 'danger', text: `Escalated — ${reason}` });
        return activeAlert;
      }
      return fireSos(reason);
    },
    [activeAlert, fireSos, pushLog, sosState],
  );

  const cancelSos = useCallback(
    (reason = 'Cancelled by user') => {
      clearInterval(armTimer.current);
      armTimer.current = null;
      clearDispatchTimers();

      if (sosState === 'active' && activeAlert) {
        setAlertHistory((h) => [
          { ...activeAlert, endedAt: new Date().toISOString(), outcome: reason },
          ...h,
        ]);
        toast('Contacts notified that you are safe.', 'safe');
      } else if (sosState === 'arming') {
        toast('SOS cancelled.', 'info');
      }

      setSosState('idle');
      setActiveAlert(null);
      setCountdown(ARM_SECONDS);
      setDispatchLog([]);
      blip('ok');
    },
    [activeAlert, clearDispatchTimers, sosState, toast],
  );

  // ---------------------------------------------------------------- alarm --
  const toggleAlarm = useCallback(() => {
    setAlarmOn((on) => {
      if (on) {
        stopSiren();
        return false;
      }
      const started = startSiren(0.5);
      if (!started) {
        toast('This browser blocked the audio alarm.', 'warn');
        return false;
      }
      vibrate([200, 100, 200]);
      return true;
    });
  }, [toast]);

  useEffect(
    () => () => {
      stopSiren();
      clearInterval(armTimer.current);
      dispatchTimers.current.forEach(clearTimeout);
    },
    [],
  );

  const value = useMemo(
    () => ({
      sosState,
      countdown,
      armSeconds: ARM_SECONDS,
      activeAlert,
      dispatchLog,
      alertHistory,
      armSos,
      sendSosNow,
      cancelSos,
      alarmOn,
      toggleAlarm,
      toasts,
      toast,
      dismissToast,
      pushLog,
    }),
    [
      sosState,
      countdown,
      activeAlert,
      dispatchLog,
      alertHistory,
      armSos,
      sendSosNow,
      cancelSos,
      alarmOn,
      toggleAlarm,
      toasts,
      toast,
      dismissToast,
      pushLog,
    ],
  );

  return <AlertContext.Provider value={value}>{children}</AlertContext.Provider>;
}

export function useAlerts() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlerts must be used inside <AlertProvider>');
  return ctx;
}
