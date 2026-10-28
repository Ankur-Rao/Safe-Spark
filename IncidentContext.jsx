import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { INCIDENT_CATEGORIES, SEED_INCIDENTS } from '../data/incidents';
import { incidentsApi, isSupabaseConfigured } from '../lib/supabase';
import { useApp } from './AppContext';
import { useAlerts } from './AlertContext';
import { sortByDistance } from '../lib/geo';
import { recencyWeight, uid } from '../lib/time';

const IncidentContext = createContext(null);

const ALL_CATEGORY_IDS = INCIDENT_CATEGORIES.map((c) => c.id);

export function IncidentProvider({ children }) {
  const { location, profile } = useApp();
  const { toast } = useAlerts();

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [activeCategories, setActiveCategories] = useState(ALL_CATEGORY_IDS);
  const [windowHours, setWindowHours] = useState(12);
  const [sortMode, setSortMode] = useState('recent'); // 'recent' | 'distance'
  const [confirmed, setConfirmed] = useState(() => new Set());

  // Initial load + realtime subscription.
  useEffect(() => {
    let alive = true;

    incidentsApi
      .list({ seed: SEED_INCIDENTS })
      .then((rows) => {
        if (!alive) return;
        setIncidents(rows);
        setLoading(false);
      })
      .catch((err) => {
        if (!alive) return;
        setLoadError(err?.message || 'Could not load incidents.');
        setIncidents(SEED_INCIDENTS);
        setLoading(false);
      });

    const unsubscribe = incidentsApi.subscribe((row) => {
      setIncidents((list) =>
        list.some((i) => i.id === row.id) ? list : [row, ...list],
      );
    });

    return () => {
      alive = false;
      unsubscribe?.();
    };
  }, []);

  const addIncident = useCallback(
    async ({ category, description, lat, lng, anonymous }) => {
      const record = {
        id: uid('inc'),
        category,
        description: description.trim(),
        lat,
        lng,
        anonymous,
        author: anonymous ? 'Anonymous' : profile.name || 'You',
        confirmations: 0,
        created_at: new Date().toISOString(),
      };

      setIncidents((list) => [record, ...list]);

      try {
        await incidentsApi.create(record);
        toast('Report posted to the campus map.', 'safe');
      } catch (err) {
        toast('Saved locally — could not reach the server.', 'warn');
      }
      return record;
    },
    [profile.name, toast],
  );

  const confirmIncident = useCallback(
    async (id) => {
      if (confirmed.has(id)) return;
      let nextCount = 0;
      setIncidents((list) =>
        list.map((i) => {
          if (i.id !== id) return i;
          nextCount = (i.confirmations || 0) + 1;
          return { ...i, confirmations: nextCount };
        }),
      );
      setConfirmed((set) => new Set(set).add(id));
      try {
        await incidentsApi.confirm(id, nextCount);
      } catch {
        /* optimistic update stands; retry queue is post-MVP */
      }
    },
    [confirmed],
  );

  const toggleCategory = useCallback((id) => {
    setActiveCategories((list) =>
      list.includes(id) ? list.filter((c) => c !== id) : [...list, id],
    );
  }, []);

  const setAllCategories = useCallback(
    (on) => setActiveCategories(on ? ALL_CATEGORY_IDS : []),
    [],
  );

  // ------------------------------------------------------------- derived --
  const withinWindow = useMemo(() => {
    const cutoff = Date.now() - windowHours * 3600_000;
    return incidents.filter((i) => new Date(i.created_at).getTime() >= cutoff);
  }, [incidents, windowHours]);

  const visibleIncidents = useMemo(
    () => withinWindow.filter((i) => activeCategories.includes(i.category)),
    [withinWindow, activeCategories],
  );

  const feed = useMemo(() => {
    const annotated = sortByDistance(location, visibleIncidents);
    if (sortMode === 'distance') return annotated;
    return [...annotated].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    );
  }, [visibleIncidents, location, sortMode]);

  /** Fresh, higher-severity reports the router should steer around. */
  const routeAvoidPoints = useMemo(
    () =>
      incidents
        .filter((i) => recencyWeight(i.created_at, 6) > 0.25)
        .filter((i) => {
          const cat = INCIDENT_CATEGORIES.find((c) => c.id === i.category);
          return (cat?.severity ?? 1) >= 2;
        })
        .map((i) => ({ lat: i.lat, lng: i.lng })),
    [incidents],
  );

  const value = useMemo(
    () => ({
      incidents,
      visibleIncidents,
      feed,
      loading,
      loadError,
      addIncident,
      confirmIncident,
      confirmedIds: confirmed,
      activeCategories,
      toggleCategory,
      setAllCategories,
      windowHours,
      setWindowHours,
      sortMode,
      setSortMode,
      routeAvoidPoints,
      liveMode: isSupabaseConfigured,
    }),
    [
      incidents,
      visibleIncidents,
      feed,
      loading,
      loadError,
      addIncident,
      confirmIncident,
      confirmed,
      activeCategories,
      toggleCategory,
      setAllCategories,
      windowHours,
      sortMode,
      routeAvoidPoints,
    ],
  );

  return (
    <IncidentContext.Provider value={value}>{children}</IncidentContext.Provider>
  );
}

export function useIncidents() {
  const ctx = useContext(IncidentContext);
  if (!ctx) throw new Error('useIncidents must be used inside <IncidentProvider>');
  return ctx;
}
