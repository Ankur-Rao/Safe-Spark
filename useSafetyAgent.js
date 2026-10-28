import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAlerts } from '../../context/AlertContext';
import {
  AMBIENT_LINES,
  FAKE_CALL_SCRIPT,
  SAFE_PHRASES,
  SIMULATED_HEARD,
  TRIGGER_PHRASES,
} from '../../data/agentScript';
import {
  blip,
  cancelSpeech,
  createRecognizer,
  recognitionSupported,
  speak,
  startRingtone,
  stopRingtone,
  vibrate,
} from '../../lib/audio';
import { useInterval } from '../../lib/hooks';
import { stamp, uid } from '../../lib/time';

const CHECK_IN_GRACE_SEC = 20;
const AMBIENT_EVERY_SEC = 50;

const normalise = (s) =>
  s
    .toLowerCase()
    .replace(/[^\w\s']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function matchTrigger(text) {
  const t = normalise(text);
  if (!t) return null;
  return (
    TRIGGER_PHRASES.find((trigger) =>
      trigger.phrases.some((p) => t.includes(normalise(p))),
    ) || null
  );
}

function matchSafe(text) {
  const t = normalise(text);
  return SAFE_PHRASES.some((p) => t.includes(normalise(p)));
}

/**
 * The agent's whole state machine: session lifecycle, transcript, listening,
 * trigger detection, the check-in loop, and Fake Phone Call playback.
 */
export function useSafetyAgent() {
  const { settings, location } = useApp();
  const { sendSosNow, toggleAlarm, alarmOn, toast, sosState } = useAlerts();

  const [active, setActive] = useState(false);
  const [mode, setMode] = useState('monitor'); // 'monitor' | 'call'
  const [lines, setLines] = useState([]);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [risk, setRisk] = useState('calm'); // calm | elevated | critical
  const [checkIn, setCheckIn] = useState({ pending: false, secondsLeft: 0 });
  const [callState, setCallState] = useState('idle'); // idle | ringing | connected
  const [callPrompt, setCallPrompt] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [usingRealMic, setUsingRealMic] = useState(false);

  const counters = useRef({ sinceCheckIn: 0, sinceAmbient: 0, checkInLeft: 0 });
  const recognizer = useRef(null);
  const simTimer = useRef(null);
  const callTimer = useRef(null);
  const callIndex = useRef(0);
  const ambientIndex = useRef(0);
  const simIndex = useRef(0);

  // -------------------------------------------------------------- transcript --
  const push = useCallback((role, text, tone = 'normal') => {
    setLines((list) => [
      ...list.slice(-120),
      { id: uid('ln'), role, text, tone, at: stamp() },
    ]);
  }, []);

  // ----------------------------------------------------------- escalation --
  const escalate = useCallback(
    (trigger) => {
      setRisk(trigger.severity === 'critical' ? 'critical' : 'elevated');
      push('system', `Trigger detected — ${trigger.label}`, trigger.severity);
      push('agent', trigger.response, trigger.severity);
      vibrate([200, 80, 200]);

      if (trigger.severity === 'critical') {
        sendSosNow(`Voice trigger: ${trigger.label}`);
        if (settings.alarmOnTrigger && !alarmOn) toggleAlarm();
        if (mode === 'monitor') speak(trigger.response, { rate: 1.05 });
      } else {
        blip('alert');
      }
    },
    [alarmOn, mode, push, sendSosNow, settings.alarmOnTrigger, toggleAlarm],
  );

  const standDown = useCallback(() => {
    counters.current.checkInLeft = 0;
    counters.current.sinceCheckIn = 0;
    setCheckIn({ pending: false, secondsLeft: 0 });
    setRisk('calm');
    push('agent', "Good. Standing down — I'll keep listening until you end the walk.");
  }, [push]);

  // --------------------------------------------------------- what was said --
  const handleUtterance = useCallback(
    (text, { fromUser = true } = {}) => {
      const clean = text.trim();
      if (!clean) return;
      if (fromUser) push('you', clean);

      const trigger = matchTrigger(clean);
      if (trigger) {
        escalate(trigger);
        return;
      }

      if (matchSafe(clean)) {
        standDown();
        return;
      }

      if (counters.current.checkInLeft > 0) {
        counters.current.checkInLeft = 0;
        counters.current.sinceCheckIn = 0;
        setCheckIn({ pending: false, secondsLeft: 0 });
        push('agent', 'Got it. Check-in cleared — still with you.');
      }
    },
    [escalate, push, standDown],
  );

  /** Typed input from the composer. */
  const submitText = useCallback(
    (text) => handleUtterance(text, { fromUser: true }),
    [handleUtterance],
  );

  // ------------------------------------------------------------ listening --
  const stopListening = useCallback(() => {
    setListening(false);
    setInterim('');
    try {
      recognizer.current?.stop();
    } catch {
      /* already stopped */
    }
    recognizer.current = null;
    clearInterval(simTimer.current);
    simTimer.current = null;
  }, []);

  const startListening = useCallback(() => {
    if (listening) return;

    if (recognitionSupported()) {
      const rec = createRecognizer({
        onResult: ({ interim: i, final }) => {
          setInterim(i);
          if (final) {
            setInterim('');
            handleUtterance(final);
          }
        },
        onEnd: () => {
          // Chrome ends the session periodically; restart while still armed.
          if (recognizer.current) {
            try {
              recognizer.current.start();
            } catch {
              /* restart race — ignore */
            }
          }
        },
        onError: (err) => {
          if (err === 'not-allowed' || err === 'service-not-allowed') {
            stopListening();
            push(
              'system',
              'Microphone blocked by the browser — switching to the simulated listener.',
              'warn',
            );
            startSimulatedListener();
          }
        },
      });

      if (rec) {
        recognizer.current = rec;
        try {
          rec.start();
          setListening(true);
          setUsingRealMic(true);
          push('system', 'Microphone live — speech recognition running on-device.');
          return;
        } catch {
          recognizer.current = null;
        }
      }
    }

    startSimulatedListener();

    function startSimulatedListener() {
      setListening(true);
      setUsingRealMic(false);
      push(
        'system',
        'Simulated listener running — this browser has no speech recognition API.',
      );
      clearInterval(simTimer.current);
      simTimer.current = setInterval(() => {
        const heard = SIMULATED_HEARD[simIndex.current % SIMULATED_HEARD.length];
        simIndex.current += 1;
        handleUtterance(heard);
      }, 11_000);
    }
  }, [handleUtterance, listening, push, stopListening]);

  const toggleListening = useCallback(() => {
    if (listening) {
      stopListening();
      push('system', 'Microphone off.');
    } else {
      startListening();
    }
  }, [listening, push, startListening, stopListening]);

  // ------------------------------------------------------- fake phone call --
  const clearCallTimers = useCallback(() => {
    clearTimeout(callTimer.current);
    callTimer.current = null;
    cancelSpeech();
    stopRingtone();
  }, []);

  const runCallStep = useCallback(() => {
    const step = FAKE_CALL_SCRIPT[callIndex.current % FAKE_CALL_SCRIPT.length];
    callIndex.current += 1;

    if (step.from === 'caller') {
      setCallPrompt(null);
      push('caller', step.text);
      speak(step.text, { rate: 1.0, pitch: 0.88 }).then(() => {
        callTimer.current = setTimeout(runCallStep, step.pause);
      });
    } else {
      // Prompt the user with their line so the call sounds two-sided.
      setCallPrompt(step.text);
      push('you', step.text, 'prompt');
      callTimer.current = setTimeout(runCallStep, step.pause);
    }
  }, [push]);

  const answerCall = useCallback(() => {
    stopRingtone();
    setCallState('connected');
    push('system', 'Call connected — Marcus (simulated)');
    callIndex.current = 0;
    callTimer.current = setTimeout(runCallStep, 400);
  }, [push, runCallStep]);

  const hangUp = useCallback(() => {
    clearCallTimers();
    setCallState('idle');
    setCallPrompt(null);
    push('system', 'Call ended.');
  }, [clearCallTimers, push]);

  // --------------------------------------------------------------- session --
  const start = useCallback(
    (nextMode = mode) => {
      setActive(true);
      setMode(nextMode);
      setLines([]);
      setRisk('calm');
      setElapsed(0);
      counters.current = { sinceCheckIn: 0, sinceAmbient: 0, checkInLeft: 0 };
      ambientIndex.current = 0;

      push('system', `Session started · ${nextMode === 'call' ? 'Fake Phone Call' : 'Active Monitoring'} mode`);
      push(
        'agent',
        nextMode === 'call'
          ? "Incoming call in three seconds. Answer it out loud and walk normally — I'm still listening for your trigger words underneath."
          : `I'm with you. I'll check in every ${Math.round(
              settings.checkInIntervalSec / 60,
            )} min. Say "SafeSpark help" at any point and I send everything immediately.`,
      );

      startListening();

      if (nextMode === 'call') {
        setCallState('ringing');
        startRingtone();
        callTimer.current = setTimeout(answerCall, 3200);
      }
    },
    [answerCall, mode, push, settings.checkInIntervalSec, startListening],
  );

  const stop = useCallback(() => {
    setActive(false);
    stopListening();
    clearCallTimers();
    setCallState('idle');
    setCheckIn({ pending: false, secondsLeft: 0 });
    setRisk('calm');
    push('system', 'Session ended. Nothing further is being monitored.');
  }, [clearCallTimers, push, stopListening]);

  const switchMode = useCallback(
    (nextMode) => {
      if (nextMode === mode) return;
      setMode(nextMode);
      if (!active) return;

      clearCallTimers();
      if (nextMode === 'call') {
        setCallState('ringing');
        startRingtone();
        push('system', 'Switched to Fake Phone Call mode — incoming call…');
        callTimer.current = setTimeout(answerCall, 2600);
      } else {
        setCallState('idle');
        setCallPrompt(null);
        push('system', 'Switched to Active Monitoring. Still listening.');
      }
    },
    [active, answerCall, clearCallTimers, mode, push],
  );

  // ------------------------------------------------------------ the ticker --
  useInterval(
    () => {
      setElapsed((e) => e + 1);
      const c = counters.current;

      // Outstanding check-in: count down, then escalate.
      if (c.checkInLeft > 0) {
        c.checkInLeft -= 1;
        setCheckIn({ pending: true, secondsLeft: c.checkInLeft });
        if (c.checkInLeft === 0) {
          setCheckIn({ pending: false, secondsLeft: 0 });
          setRisk('critical');
          push('system', 'No response to safety check-in — escalating.', 'critical');
          push(
            'agent',
            'You did not answer the check-in. Alerting your trusted contacts with your live location now.',
            'critical',
          );
          sendSosNow('No response to safety check-in');
          vibrate([300, 100, 300]);
        }
        return;
      }

      c.sinceCheckIn += 1;
      c.sinceAmbient += 1;

      if (c.sinceCheckIn >= settings.checkInIntervalSec) {
        c.sinceCheckIn = 0;
        c.checkInLeft = CHECK_IN_GRACE_SEC;
        setCheckIn({ pending: true, secondsLeft: CHECK_IN_GRACE_SEC });
        push('agent', 'Check-in — still with me? Tap "I\'m okay" or just answer out loud.', 'warn');
        vibrate([80, 60, 80]);
        blip('ok');
        if (mode === 'monitor') speak('Check in. Are you still okay?');
        return;
      }

      if (c.sinceAmbient >= AMBIENT_EVERY_SEC && mode === 'monitor' && risk === 'calm') {
        c.sinceAmbient = 0;
        const line = AMBIENT_LINES[ambientIndex.current % AMBIENT_LINES.length];
        ambientIndex.current += 1;
        push('agent', line);
      }
    },
    active ? 1000 : null,
  );

  const respondCheckIn = useCallback(() => {
    counters.current.checkInLeft = 0;
    counters.current.sinceCheckIn = 0;
    setCheckIn({ pending: false, secondsLeft: 0 });
    push('you', "I'm okay");
    push('agent', 'Thanks. Timer reset — still watching your route.');
    blip('ok');
  }, [push]);

  // Clean up every timer and audio node when the screen unmounts.
  useEffect(
    () => () => {
      clearInterval(simTimer.current);
      clearTimeout(callTimer.current);
      cancelSpeech();
      stopRingtone();
      try {
        recognizer.current?.stop();
      } catch {
        /* noop */
      }
    },
    [],
  );

  // Reflect an SOS fired from elsewhere (the SOS tab) in the transcript.
  const lastSos = useRef(sosState);
  useEffect(() => {
    if (active && sosState === 'active' && lastSos.current !== 'active') {
      push('system', 'SOS is active — contacts are being notified.', 'critical');
      setRisk('critical');
    }
    lastSos.current = sosState;
  }, [active, push, sosState]);

  return {
    active,
    mode,
    lines,
    listening,
    interim,
    risk,
    checkIn,
    callState,
    callPrompt,
    elapsed,
    usingRealMic,
    location,
    start,
    stop,
    switchMode,
    toggleListening,
    submitText,
    respondCheckIn,
    answerCall,
    hangUp,
    toast,
  };
}
