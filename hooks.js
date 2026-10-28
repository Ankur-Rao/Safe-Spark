import { useCallback, useEffect, useRef, useState } from 'react';

/** State that survives a reload. Falls back to in-memory if storage is blocked. */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw != null ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* private mode / quota — session state still works */
    }
  }, [key, value]);

  return [value, setValue];
}

/** setInterval that always calls the latest callback and cleans itself up. */
export function useInterval(callback, delay) {
  const saved = useRef(callback);
  useEffect(() => {
    saved.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay == null) return undefined;
    const id = setInterval(() => saved.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

/** A ticking "now" so relative timestamps stay honest without a reload. */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useInterval(() => setNow(Date.now()), intervalMs);
  return now;
}

/** Close on Escape and lock body scroll while a modal or drawer is open. */
export function useDismissable(open, onClose) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);
}

/** Press-and-hold with progress, used by the SOS button. */
export function useHoldToConfirm(durationMs, onComplete) {
  const [progress, setProgress] = useState(0);
  const frame = useRef(null);
  const startedAt = useRef(0);

  const stop = useCallback(() => {
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = null;
    setProgress(0);
  }, []);

  const start = useCallback(() => {
    if (frame.current) return;
    startedAt.current = performance.now();
    const tick = (t) => {
      const pct = Math.min(1, (t - startedAt.current) / durationMs);
      setProgress(pct);
      if (pct >= 1) {
        frame.current = null;
        setProgress(0);
        onComplete?.();
        return;
      }
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  }, [durationMs, onComplete]);

  useEffect(() => () => stop(), [stop]);

  return { progress, start, stop };
}
