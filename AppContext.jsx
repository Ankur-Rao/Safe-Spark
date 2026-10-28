import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { IU_CENTER } from '../data/blueLights';
import { DEFAULT_TRUSTED_CONTACTS } from '../data/contacts';
import { useLocalStorage } from '../lib/hooks';
import { uid } from '../lib/time';

const AppContext = createContext(null);

/** Where the demo drops you when GPS is unavailable: the Arboretum path. */
const SIMULATED_START = { lat: 39.17062, lng: -86.52040 };

export function AppProvider({ children }) {
  const [profile, setProfile] = useLocalStorage('safespark.profile.v1', {
    name: 'Student',
    campus: 'IU Bloomington',
    phone: '',
  });

  const [contacts, setContacts] = useLocalStorage(
    'safespark.contacts.v1',
    DEFAULT_TRUSTED_CONTACTS,
  );

  const [settings, setSettings] = useLocalStorage('safespark.settings.v1', {
    preferLitRoutes: true,
    avoidRecentIncidents: true,
    shareLocationWithContacts: true,
    checkInIntervalSec: 120,
    hapticsEnabled: true,
    // Off by default: an alarm that starts on its own can escalate a situation
    // the user was trying to walk away from. Opt in from the Agent screen.
    alarmOnTrigger: false,
  });

  // ------------------------------------------------------------- location --
  const [location, setLocation] = useState({
    lat: SIMULATED_START.lat,
    lng: SIMULATED_START.lng,
    accuracy: null,
    source: 'simulated', // 'gps' | 'simulated'
    error: null,
    updatedAt: Date.now(),
  });
  const [locating, setLocating] = useState(false);
  const watchId = useRef(null);

  const requestLocation = useCallback(({ watch = false } = {}) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocation((l) => ({
        ...l,
        source: 'simulated',
        error: 'This browser has no geolocation API.',
      }));
      return Promise.resolve(null);
    }

    setLocating(true);

    return new Promise((resolve) => {
      const onOk = (pos) => {
        const next = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          source: 'gps',
          error: null,
          updatedAt: Date.now(),
        };
        setLocation(next);
        setLocating(false);
        resolve(next);
      };

      const onFail = (err) => {
        setLocating(false);
        setLocation((l) => ({
          ...l,
          source: 'simulated',
          error:
            err?.code === 1
              ? 'Location permission denied — showing a simulated campus position.'
              : 'Could not get a GPS fix — showing a simulated campus position.',
        }));
        resolve(null);
      };

      navigator.geolocation.getCurrentPosition(onOk, onFail, {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 15_000,
      });

      if (watch && watchId.current == null) {
        watchId.current = navigator.geolocation.watchPosition(onOk, () => {}, {
          enableHighAccuracy: true,
          maximumAge: 10_000,
        });
      }
    });
  }, []);

  useEffect(
    () => () => {
      if (watchId.current != null) {
        navigator.geolocation?.clearWatch?.(watchId.current);
        watchId.current = null;
      }
    },
    [],
  );

  /** Move the simulated pin — used by the demo walk and by map long-press. */
  const setSimulatedLocation = useCallback((lat, lng) => {
    setLocation({
      lat,
      lng,
      accuracy: 12,
      source: 'simulated',
      error: null,
      updatedAt: Date.now(),
    });
  }, []);

  // ------------------------------------------------------------- contacts --
  const addContact = useCallback(
    (contact) => {
      const record = { id: uid('tc'), notify: true, ...contact };
      setContacts((list) => [...list, record]);
      return record;
    },
    [setContacts],
  );

  const updateContact = useCallback(
    (id, patch) => {
      setContacts((list) => list.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    },
    [setContacts],
  );

  const removeContact = useCallback(
    (id) => setContacts((list) => list.filter((c) => c.id !== id)),
    [setContacts],
  );

  const toggleContactNotify = useCallback(
    (id) =>
      setContacts((list) =>
        list.map((c) => (c.id === id ? { ...c, notify: !c.notify } : c)),
      ),
    [setContacts],
  );

  const updateSetting = useCallback(
    (key, value) => setSettings((s) => ({ ...s, [key]: value })),
    [setSettings],
  );

  const notifiedContacts = useMemo(
    () => contacts.filter((c) => c.notify),
    [contacts],
  );

  const value = useMemo(
    () => ({
      profile,
      setProfile,
      contacts,
      notifiedContacts,
      addContact,
      updateContact,
      removeContact,
      toggleContactNotify,
      settings,
      updateSetting,
      location,
      locating,
      requestLocation,
      setSimulatedLocation,
      campusCenter: IU_CENTER,
    }),
    [
      profile,
      setProfile,
      contacts,
      notifiedContacts,
      addContact,
      updateContact,
      removeContact,
      toggleContactNotify,
      settings,
      updateSetting,
      location,
      locating,
      requestLocation,
      setSimulatedLocation,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
