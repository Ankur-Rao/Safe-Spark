import { useCallback, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Lightbulb,
  LoaderCircle,
  Locate,
  Navigation,
  Route as RouteIcon,
  TriangleAlert,
  X,
} from 'lucide-react';
import AppHeader from '../components/AppHeader';
import CampusMap from '../components/map/CampusMap';
import { useApp } from '../context/AppContext';
import { useIncidents } from '../context/IncidentContext';
import { useAlerts } from '../context/AlertContext';
import { BLUE_LIGHTS, IU_CENTER } from '../data/blueLights';
import {
  findWalkingRoute,
  formatFeet,
  formatWalkTime,
  haversine,
  sortByDistance,
} from '../lib/geo';
import { vibrate } from '../lib/audio';

export default function MapPage() {
  const { location, locating, requestLocation, settings, updateSetting } = useApp();
  const { visibleIncidents, routeAvoidPoints } = useIncidents();
  const { toast } = useAlerts();

  const [showBlueLights, setShowBlueLights] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [route, setRoute] = useState(null);
  const [target, setTarget] = useState(null);
  const [focus, setFocus] = useState(null);
  const [fitBounds, setFitBounds] = useState(null);
  const [listOpen, setListOpen] = useState(false);
  const [routing, setRouting] = useState(false);

  const nearbyLights = useMemo(
    () => sortByDistance(location, BLUE_LIGHTS).slice(0, 12),
    [location],
  );

  const routeTo = useCallback(
    (light, from = location) => {
      const result = findWalkingRoute(from, light, {
        preferLit: settings.preferLitRoutes,
        avoidIncidents: settings.avoidRecentIncidents ? routeAvoidPoints : [],
      });
      setTarget(light);
      setRoute(result);
      setFitBounds(result.coords);
      setListOpen(false);
      vibrate(30);
      return result;
    },
    [location, routeAvoidPoints, settings.avoidRecentIncidents, settings.preferLitRoutes],
  );

  const findNearest = useCallback(async () => {
    setRouting(true);
    // Try for a real fix first; fall back to the simulated position if denied.
    const fix = await requestLocation();
    const from = fix ?? location;

    const working = BLUE_LIGHTS.filter((b) => b.status === 'online');
    const sorted = sortByDistance(from, working);
    const nearest = sorted[0];

    if (!nearest) {
      toast('No blue lights available in this area.', 'warn');
      setRouting(false);
      return;
    }

    const result = routeTo(nearest, from);
    setRouting(false);
    toast(
      `Nearest working blue light: ${nearest.name} · ${formatWalkTime(result.distance)} walk`,
      'safe',
      5200,
    );
  }, [location, requestLocation, routeTo, toast]);

  const clearRoute = () => {
    setRoute(null);
    setTarget(null);
    setFitBounds(null);
  };

  const recenter = () => {
    setFocus({ lat: location.lat, lng: location.lng, zoom: 17, k: Date.now() });
  };

  return (
    <div className="flex h-[calc(100dvh-58px-var(--sa-bottom))] flex-col">
      <AppHeader
        title="Blue Light Map"
        subtitle={`${BLUE_LIGHTS.filter((b) => b.status === 'online').length} working phones · IU Bloomington`}
      />

      <div className="relative flex-1 overflow-hidden">
        <CampusMap
          className="absolute inset-0"
          center={IU_CENTER}
          zoom={15}
          userPos={location}
          blueLights={BLUE_LIGHTS}
          incidents={visibleIncidents}
          showBlueLights={showBlueLights}
          showIncidents={showIncidents}
          route={route}
          selectedBlueLightId={target?.id}
          onSelectBlueLight={(bl) => routeTo(bl)}
          focus={focus}
          fitBounds={fitBounds}
        />

        {/* ------------------------------------------------- layer filters -- */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] flex flex-wrap gap-2 p-3">
          <button
            type="button"
            onClick={() => setShowBlueLights((v) => !v)}
            aria-pressed={showBlueLights}
            className={`chip pointer-events-auto ${showBlueLights ? 'chip-on' : ''}`}
          >
            <Lightbulb size={14} />
            Blue lights
          </button>
          <button
            type="button"
            onClick={() => setShowIncidents((v) => !v)}
            aria-pressed={showIncidents}
            className={`chip pointer-events-auto ${
              showIncidents ? 'border-warn-400/60 bg-warn-500/15 text-warn-400' : ''
            }`}
          >
            <TriangleAlert size={14} />
            Reports
            {showIncidents && visibleIncidents.length ? (
              <span className="ml-0.5 rounded-full bg-black/30 px-1.5 text-[10px]">
                {visibleIncidents.length}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => {
              const next = !settings.preferLitRoutes;
              updateSetting('preferLitRoutes', next);
              if (target) {
                const r = findWalkingRoute(location, target, {
                  preferLit: next,
                  avoidIncidents: settings.avoidRecentIncidents ? routeAvoidPoints : [],
                });
                setRoute(r);
                setFitBounds(r.coords);
              }
            }}
            aria-pressed={settings.preferLitRoutes}
            className={`chip pointer-events-auto ${
              settings.preferLitRoutes ? 'border-safe-400/60 bg-safe-500/15 text-safe-400' : ''
            }`}
          >
            <RouteIcon size={14} />
            Prefer lit
          </button>
        </div>

        {/* ------------------------------------------------------- recenter -- */}
        <button
          type="button"
          onClick={recenter}
          aria-label="Recenter on my location"
          className="absolute right-3 top-16 z-[500] grid h-11 w-11 place-items-center rounded-full
                     border border-white/10 bg-ink-800/90 text-slate-200 shadow-lg
                     backdrop-blur transition active:scale-95"
        >
          <Locate size={18} />
        </button>

        {/* ------------------------------------------------- bottom overlay -- */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[600] space-y-2 p-3">
          {route && target ? (
            <div className="panel pointer-events-auto animate-slideUp p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-spark-500/15">
                  <Navigation size={17} className="text-spark-400" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">{target.name}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {formatFeet(route.distance)} ·{' '}
                    <span className="font-semibold text-spark-400">
                      {formatWalkTime(route.distance)} walk
                    </span>{' '}
                    · {Math.round(route.litShare * 100)}% lit
                  </p>
                  {route.detoured ? (
                    <p className="mt-1.5 text-[11px] leading-snug text-warn-400">
                      Routed the long way to stay on lit paths and clear of recent reports.
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={clearRoute}
                  aria-label="Clear route"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400
                             transition hover:bg-white/10 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {route.viaNodes?.length ? (
                <p className="mt-3 border-t border-white/10 pt-3 text-[11px] leading-relaxed text-slate-500">
                  <span className="label">Via</span>{' '}
                  {route.viaNodes.slice(0, 4).join(' → ')}
                  {route.viaNodes.length > 4 ? ' → …' : ''}
                </p>
              ) : null}
            </div>
          ) : null}

          <button
            type="button"
            onClick={findNearest}
            disabled={routing || locating}
            className="btn-primary pointer-events-auto w-full text-base shadow-glow"
          >
            {routing || locating ? (
              <>
                <LoaderCircle size={18} className="animate-spin" />
                Getting your location…
              </>
            ) : (
              <>
                <Navigation size={18} />
                Find nearest blue light
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setListOpen((v) => !v)}
            className="btn-ghost pointer-events-auto w-full bg-ink-800/90 backdrop-blur"
          >
            {listOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            {listOpen ? 'Hide list' : `Nearby phones (${nearbyLights.length})`}
          </button>

          {listOpen ? (
            <div className="panel scroll-area pointer-events-auto max-h-[38vh] animate-slideUp divide-y divide-white/5">
              {nearbyLights.map((bl) => (
                <button
                  key={bl.id}
                  type="button"
                  onClick={() => routeTo(bl)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/5"
                >
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                      bl.status === 'online'
                        ? 'bg-spark-400 shadow-[0_0_10px_#5ec8ff]'
                        : 'bg-slate-600'
                    }`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-100">
                      {bl.name}
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      {bl.area}
                      {bl.status !== 'online' ? ' · out of service' : ''}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-bold text-spark-400">
                      {formatFeet(haversine(location, bl))}
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      {formatWalkTime(haversine(location, bl))}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
