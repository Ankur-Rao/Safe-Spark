/**
 * All sound in SafeSpark is synthesised with the Web Audio API — no audio files
 * to download, nothing to fail on a weak connection, and the siren starts in
 * single-digit milliseconds from the button press.
 *
 * Every entry point is gesture-initiated. Nothing here can start on its own.
 */

let ctx = null;

function audioContext() {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function audioSupported() {
  return typeof window !== 'undefined' && Boolean(window.AudioContext || window.webkitAudioContext);
}

// ------------------------------------------------------------------- siren --

let sirenNodes = null;

/**
 * Personal-alarm siren: two detuned square waves swept between 2.2k and 3.4k Hz,
 * which is the band human hearing is most sensitive to and the one that carries
 * across a street.
 */
export function startSiren(volume = 0.5) {
  const ac = audioContext();
  if (!ac || sirenNodes) return false;

  const master = ac.createGain();
  master.gain.setValueAtTime(0, ac.currentTime);
  master.gain.linearRampToValueAtTime(volume, ac.currentTime + 0.08);

  // Soften the harshest harmonics so phone speakers don't just distort.
  const shaper = ac.createBiquadFilter();
  shaper.type = 'bandpass';
  shaper.frequency.value = 2800;
  shaper.Q.value = 0.7;

  const oscA = ac.createOscillator();
  oscA.type = 'square';
  oscA.frequency.value = 2400;

  const oscB = ac.createOscillator();
  oscB.type = 'sawtooth';
  oscB.frequency.value = 2410;
  oscB.detune.value = 14;

  // LFO sweeps both oscillators — the rising/falling wail is what reads as alarm.
  const lfo = ac.createOscillator();
  lfo.type = 'triangle';
  lfo.frequency.value = 3.2;
  const lfoGain = ac.createGain();
  lfoGain.gain.value = 620;
  lfo.connect(lfoGain);
  lfoGain.connect(oscA.frequency);
  lfoGain.connect(oscB.frequency);

  oscA.connect(shaper);
  oscB.connect(shaper);
  shaper.connect(master);
  master.connect(ac.destination);

  oscA.start();
  oscB.start();
  lfo.start();

  sirenNodes = { oscA, oscB, lfo, master };
  return true;
}

export function stopSiren() {
  if (!sirenNodes || !ctx) return;
  const { oscA, oscB, lfo, master } = sirenNodes;
  const t = ctx.currentTime;
  try {
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(0.0001, t + 0.12);
    oscA.stop(t + 0.15);
    oscB.stop(t + 0.15);
    lfo.stop(t + 0.15);
  } catch {
    /* already stopped */
  }
  sirenNodes = null;
}

export function sirenRunning() {
  return Boolean(sirenNodes);
}

// ----------------------------------------------------------------- ringtone --

let ringTimer = null;
let ringStop = null;

/** North-American ring cadence: 2s of 440+480 Hz, 4s of silence. */
export function startRingtone(volume = 0.22) {
  const ac = audioContext();
  if (!ac || ringTimer) return false;

  const ring = () => {
    const t = ac.currentTime;
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.05);
    gain.gain.setValueAtTime(volume, t + 1.9);
    gain.gain.linearRampToValueAtTime(0.0001, t + 2);

    const a = ac.createOscillator();
    a.frequency.value = 440;
    const b = ac.createOscillator();
    b.frequency.value = 480;
    a.connect(gain);
    b.connect(gain);
    gain.connect(ac.destination);
    a.start(t);
    b.start(t);
    a.stop(t + 2.05);
    b.stop(t + 2.05);
  };

  ring();
  ringTimer = setInterval(ring, 6000);
  ringStop = () => {
    clearInterval(ringTimer);
    ringTimer = null;
  };
  return true;
}

export function stopRingtone() {
  if (ringStop) ringStop();
  ringStop = null;
  ringTimer = null;
}

/** Short confirmation blip — used when an alert actually leaves the device. */
export function blip(kind = 'ok') {
  const ac = audioContext();
  if (!ac) return;
  const t = ac.currentTime;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
  const osc = ac.createOscillator();
  osc.type = 'sine';
  const [f1, f2] = kind === 'alert' ? [880, 520] : [620, 940];
  osc.frequency.setValueAtTime(f1, t);
  osc.frequency.exponentialRampToValueAtTime(f2, t + 0.22);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.3);
}

// ------------------------------------------------------------------ speech --

export function speechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

let currentUtterance = null;

/** Speak a line as the simulated caller. Resolves when the line finishes. */
export function speak(text, { rate = 1.02, pitch = 0.92, volume = 1 } = {}) {
  return new Promise((resolve) => {
    if (!speechSupported()) {
      // Fall back to a time-proportional wait so the transcript still paces
      // correctly on browsers without speech synthesis.
      setTimeout(resolve, Math.min(6000, 420 + text.length * 48));
      return;
    }
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = rate;
      u.pitch = pitch;
      u.volume = volume;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      currentUtterance = u;
      window.speechSynthesis.speak(u);
    } catch {
      resolve();
    }
  });
}

export function cancelSpeech() {
  if (!speechSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* noop */
  }
  currentUtterance = null;
}

// --------------------------------------------------------------- recognition --

export function recognitionSupported() {
  return (
    typeof window !== 'undefined' &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
  );
}

/**
 * Thin wrapper over the Web Speech API. Returns null when unsupported so the
 * caller can fall back to the simulated listener.
 */
export function createRecognizer({ onResult, onEnd, onError } = {}) {
  const Ctor =
    typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);
  if (!Ctor) return null;

  const rec = new Ctor();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = 'en-US';

  rec.onresult = (event) => {
    let interim = '';
    let final = '';
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const chunk = event.results[i];
      if (chunk.isFinal) final += chunk[0].transcript;
      else interim += chunk[0].transcript;
    }
    onResult?.({ interim: interim.trim(), final: final.trim() });
  };
  rec.onend = () => onEnd?.();
  rec.onerror = (e) => onError?.(e?.error || 'unknown');

  return rec;
}

// ------------------------------------------------------------------ haptics --

export function vibrate(pattern) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported */
  }
}

/** Tear everything down — called when the agent screen unmounts. */
export function silenceAll() {
  stopSiren();
  stopRingtone();
  cancelSpeech();
}
