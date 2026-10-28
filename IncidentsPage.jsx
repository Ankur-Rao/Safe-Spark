import { useCallback, useMemo, useState } from 'react';
import {
  Check,
  Clock,
  Flame,
  LoaderCircle,
  MapPin,
  Plus,
  Radio,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import AppHeader from '../components/AppHeader';
import CampusMap from '../components/map/CampusMap';
import IncidentFeed from '../components/incidents/IncidentFeed';
import ReportModal from '../components/incidents/ReportModal';
import { useApp } from '../context/AppContext';
import { useIncidents } from '../context/IncidentContext';
import { INCIDENT_CATEGORIES } from '../data/incidents';
import { IU_CENTER } from '../data/blueLights';

const WINDOWS = [
  { hours: 3, label: '3h' },
  { hours: 12, label: '12h' },
  { hours: 24, label: '24h' },
  { hours: 168, label: '7d' },
];

export default function IncidentsPage() {
  const { location } = useApp();
  const {
    feed,
    visibleIncidents,
    loading,
    addIncident,
    confirmIncident,
    confirmedIds,
    activeCategories,
    toggleCategory,
    setAllCategories,
    windowHours,
    setWindowHours,
    sortMode,
    setSortMode,
    liveMode,
  } = useIncidents();

  const [reportOpen, setReportOpen] = useState(false);
  const [picking, setPicking] = useState(false);
  const [pickedPoint, setPickedPoint] = useState(null);
  const [selected, setSelected] = useState(null);
  const [focus, setFocus] = useState(null);
  const [showHeat, setShowHeat] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const allOn = activeCategories.length === INCIDENT_CATEGORIES.length;

  const startPicking = useCallback(() => {
    setReportOpen(false);
    setPicking(true);
  }, []);

  const confirmPick = () => {
    setPicking(false);
    setReportOpen(true);
  };

  const cancelPick = () => {
    setPicking(false);
    setPickedPoint(null);
    setReportOpen(true);
  };

  const selectIncident = (inc) => {
    setSelected(inc);
    setFocus({ lat: inc.lat, lng: inc.lng, zoom: 17, k: Date.now() });
  };

  const lastHour = useMemo(
    () =>
      visibleIncidents.filter(
        (i) => Date.now() - new Date(i.created_at).getTime() < 3600_000,
      ).length,
    [visibleIncidents],
  );

  return (
    <div className="flex min-h-[calc(100dvh-58px-var(--sa-bottom))] flex-col">
      <AppHeader
        title="Community Reports"
        subtitle={
          <span className="flex items-center gap-1.5">
            <Radio size={11} className={liveMode ? 'text-safe-400' : 'text-warn-400'} />
            {liveMode ? 'Live · realtime' : 'Demo data · this device'} ·{' '}
            {visibleIncidents.length} shown
          </span>
        }
        actions={
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-label="Filters"
            aria-pressed={filtersOpen}
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition ${
              filtersOpen ? 'bg-spark-500/15 text-spark-400' : 'text-slate-400 hover:bg-white/10'
            }`}
          >
            <SlidersHorizontal size={18} />
          </button>
        }
      />

      {/* ----------------------------------------------------------- the map -- */}
      <div className="relative h-[42vh] min-h-[260px] shrink-0 border-b border-white/10">
        <CampusMap
          className="absolute inset-0"
          center={IU_CENTER}
          zoom={15}
          userPos={location}
          incidents={visibleIncidents}
          showBlueLights={false}
          showIncidents
          showHeat={showHeat}
          selectedIncidentId={selected?.id}
          onSelectIncident={selectIncident}
          onMapClick={picking ? (pt) => setPickedPoint(pt) : undefined}
          pinDrop={picking ? pickedPoint : null}
          focus={focus}
        />

        <button
          type="button"
          onClick={() => setShowHeat((v) => !v)}
          aria-pressed={showHeat}
          className={`absolute right-3 top-3 z-[500] chip ${showHeat ? 'chip-on' : ''}`}
        >
          <Flame size={14} />
          Heat
        </button>

        {picking ? (
          <div className="absolute inset-x-0 bottom-0 z-[600] animate-slideUp border-t
                          border-spark-400/30 bg-ink-900/95 p-3 backdrop-blur-xl">
            <p className="mb-2.5 flex items-center gap-2 text-xs font-semibold text-spark-400">
              <MapPin size={14} />
              {pickedPoint
                ? `Pin set at ${pickedPoint.lat.toFixed(5)}, ${pickedPoint.lng.toFixed(5)}`
                : 'Tap the map where it happened'}
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={cancelPick} className="btn-ghost flex-1">
                <X size={15} />
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmPick}
                disabled={!pickedPoint}
                className="btn-primary flex-[2]"
              >
                <Check size={16} />
                Use this spot
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* ---------------------------------------------------------- filters -- */}
      {filtersOpen ? (
        <div className="animate-slideUp space-y-3 border-b border-white/10 bg-ink-800/60 px-4 py-3">
          <div>
            <p className="label mb-2">Categories</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAllCategories(!allOn)}
                className={`chip ${allOn ? 'chip-on' : ''}`}
              >
                {allOn ? 'Clear all' : 'Select all'}
              </button>
              {INCIDENT_CATEGORIES.map((cat) => {
                const on = activeCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    aria-pressed={on}
                    className="chip"
                    style={
                      on
                        ? {
                            borderColor: `${cat.color}99`,
                            background: `${cat.color}22`,
                            color: cat.color,
                          }
                        : undefined
                    }
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: cat.color, opacity: on ? 1 : 0.4 }}
                    />
                    {cat.short}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="label flex items-center gap-1">
              <Clock size={11} />
              Window
            </span>
            {WINDOWS.map((w) => (
              <button
                key={w.hours}
                type="button"
                onClick={() => setWindowHours(w.hours)}
                className={`chip ${windowHours === w.hours ? 'chip-on' : ''}`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* ------------------------------------------------------------- feed -- */}
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <span className="text-xs font-bold text-slate-200">
          {lastHour > 0 ? `${lastHour} in the last hour` : 'Recent reports'}
        </span>
        <div className="ml-auto flex gap-1.5">
          {[
            { id: 'recent', label: 'Recent' },
            { id: 'distance', label: 'Nearest' },
          ].map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSortMode(s.id)}
              className={`chip py-1 text-[11px] ${sortMode === s.id ? 'chip-on' : ''}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
          <LoaderCircle size={16} className="animate-spin" />
          Loading reports…
        </div>
      ) : (
        <IncidentFeed
          items={feed}
          selectedId={selected?.id}
          onSelect={selectIncident}
          onConfirm={confirmIncident}
          confirmedIds={confirmedIds}
          emptyHint="Try widening the time window or switching categories back on."
        />
      )}

      <div className="h-24" />

      {/* -------------------------------------------------------------- FAB -- */}
      {!picking ? (
        <button
          type="button"
          onClick={() => setReportOpen(true)}
          className="fixed bottom-[calc(72px+var(--sa-bottom))] left-1/2 z-[800] flex -translate-x-1/2
                     items-center gap-2 rounded-full bg-spark-500 px-5 py-3.5 text-sm font-bold
                     text-ink-900 shadow-glow transition active:scale-95"
        >
          <Plus size={18} strokeWidth={2.6} />
          Report a concern
        </button>
      ) : null}

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={addIncident}
        location={location}
        pickedPoint={pickedPoint}
        onRequestPick={startPicking}
      />
    </div>
  );
}
