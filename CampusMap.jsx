import { useEffect, useMemo } from 'react';
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import { BLUE_LIGHTS, IU_CENTER } from '../../data/blueLights';
import { CAMPUS_LANDMARKS, PATH_EDGES, PATH_NODES } from '../../data/campusGeo';
import { CATEGORY_BY_ID } from '../../data/incidents';
import { recencyWeight, timeAgo } from '../../lib/time';
import { formatFeet, haversine } from '../../lib/geo';
import { blueLightIcon, incidentIcon, pinDropIcon, userIcon } from './mapIcons';

/** Keeps the Leaflet viewport in sync with React state (fly-to, resize). */
function MapSync({ focus, follow, userPos, fitBounds }) {
  const map = useMap();

  useEffect(() => {
    // The map mounts inside a flex column; Leaflet needs a nudge once laid out.
    const t = setTimeout(() => map.invalidateSize(), 160);
    return () => clearTimeout(t);
  }, [map]);

  useEffect(() => {
    if (!focus) return;
    map.flyTo([focus.lat, focus.lng], focus.zoom ?? 17, { duration: 0.8 });
  }, [focus, map]);

  useEffect(() => {
    if (!fitBounds?.length || fitBounds.length < 2) return;
    map.fitBounds(fitBounds, {
      paddingTopLeft: [40, 90],
      paddingBottomRight: [40, 230],
      maxZoom: 18,
      animate: true,
    });
  }, [fitBounds, map]);

  useEffect(() => {
    if (!follow || !userPos) return;
    map.panTo([userPos.lat, userPos.lng], { animate: true });
  }, [follow, userPos, map]);

  return null;
}

function ClickCapture({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

/**
 * The shared campus map. Both /map and /incidents render this with different
 * layers switched on, so marker styling and the night basemap stay identical
 * between the two screens.
 */
/** Street + walkway geometry, precomputed once. Drawn as a faint vector layer so
 *  the campus is readable on a slow connection, and so unlit stretches are
 *  visible as dashes rather than being a number buried in the route card. */
const PATH_LINES = (() => {
  const byId = new Map(PATH_NODES.map((n) => [n.id, n]));
  return PATH_EDGES.map((e, i) => {
    const a = byId.get(e.a);
    const b = byId.get(e.b);
    if (!a || !b) return null;
    return {
      id: `edge-${i}`,
      positions: [
        [a.lat, a.lng],
        [b.lat, b.lng],
      ],
      lit: e.lit,
      kind: e.kind,
    };
  }).filter(Boolean);
})();

export default function CampusMap({
  center = IU_CENTER,
  zoom = 16,
  showPaths = true,
  userPos,
  showBlueLights = true,
  showIncidents = false,
  showHeat = false,
  blueLights = BLUE_LIGHTS,
  incidents = [],
  route = null,
  selectedBlueLightId = null,
  selectedIncidentId = null,
  onSelectBlueLight,
  onSelectIncident,
  onMapClick,
  pinDrop = null,
  focus = null,
  fitBounds = null,
  follow = false,
  className = '',
}) {
  const heatPoints = useMemo(() => {
    if (!showHeat) return [];
    return incidents.map((i) => {
      const cat = CATEGORY_BY_ID[i.category];
      const w = recencyWeight(i.created_at, 12);
      return {
        id: `${i.id}-heat`,
        lat: i.lat,
        lng: i.lng,
        color: cat?.color || '#94a3b8',
        radius: 10 + (cat?.severity ?? 1) * 4 + w * 10,
        opacity: 0.1 + w * 0.2,
      };
    });
  }, [incidents, showHeat]);

  // NOTE: the caller owns positioning entirely (pages pass `absolute inset-0`).
  // Merging a hardcoded `relative` here would collide with it — Tailwind emits
  // `.relative` after `.absolute`, so the wrapper would lose its inset sizing
  // and collapse the map to zero height.
  return (
    <div className={className}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        zoomControl={false}
        scrollWheelZoom
        className="h-full w-full"
        preferCanvas
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />

        {/* Vector landmarks sit under everything so the campus stays readable
            even before the raster tiles arrive (or if they never do). */}
        {CAMPUS_LANDMARKS.map((lm) => (
          <Polygon
            key={lm.id}
            positions={lm.ring}
            pathOptions={{
              color: lm.kind === 'green' ? '#1d3b2a' : '#1b2437',
              fillColor: lm.kind === 'green' ? '#122a1e' : '#161f30',
              fillOpacity: 0.55,
              weight: 1,
            }}
          />
        ))}

        {showPaths
          ? PATH_LINES.map((line) => (
              <Polyline
                key={line.id}
                positions={line.positions}
                pathOptions={{
                  color: line.lit ? '#3a4d6b' : '#2a3347',
                  weight: line.kind === 'street' ? 3 : 2,
                  opacity: line.lit ? 0.75 : 0.6,
                  dashArray: line.lit ? undefined : '3 6',
                  lineCap: 'round',
                }}
                interactive={false}
              />
            ))
          : null}

        {showHeat
          ? heatPoints.map((h) => (
              <CircleMarker
                key={h.id}
                center={[h.lat, h.lng]}
                radius={h.radius}
                pathOptions={{
                  color: h.color,
                  fillColor: h.color,
                  fillOpacity: h.opacity,
                  opacity: 0,
                  weight: 0,
                }}
                interactive={false}
              />
            ))
          : null}

        {route?.coords?.length ? (
          <>
            <Polyline
              positions={route.coords}
              pathOptions={{ color: '#05070d', weight: 11, opacity: 0.85 }}
            />
            <Polyline
              positions={route.coords}
              pathOptions={{
                color: '#5ec8ff',
                weight: 5,
                opacity: 0.95,
                dashArray: '1 10',
                lineCap: 'round',
              }}
            />
          </>
        ) : null}

        {showBlueLights
          ? blueLights.map((bl) => (
              <Marker
                key={bl.id}
                position={[bl.lat, bl.lng]}
                icon={blueLightIcon({
                  selected: bl.id === selectedBlueLightId,
                  offline: bl.status !== 'online',
                })}
                eventHandlers={{ click: () => onSelectBlueLight?.(bl) }}
              >
                <Popup>
                  <strong className="block text-[13px] text-white">{bl.name}</strong>
                  <span className="text-slate-400">{bl.area}</span>
                  {userPos ? (
                    <span className="mt-1 block text-slate-300">
                      {formatFeet(haversine(userPos, bl))} away
                    </span>
                  ) : null}
                  <span
                    className={`mt-1 block text-[11px] font-semibold ${
                      bl.status === 'online' ? 'text-safe-400' : 'text-warn-400'
                    }`}
                  >
                    {bl.status === 'online' ? 'Reported working' : 'Reported out of service'}
                  </span>
                </Popup>
              </Marker>
            ))
          : null}

        {showIncidents
          ? incidents.map((inc) => (
              <Marker
                key={inc.id}
                position={[inc.lat, inc.lng]}
                icon={incidentIcon(inc.category, {
                  weight: recencyWeight(inc.created_at, 12),
                  selected: inc.id === selectedIncidentId,
                })}
                eventHandlers={{ click: () => onSelectIncident?.(inc) }}
              >
                <Popup>
                  <strong className="block text-[13px] text-white">
                    {CATEGORY_BY_ID[inc.category]?.label ?? 'Report'}
                  </strong>
                  <span className="mt-1 block text-slate-300">{inc.description}</span>
                  <span className="mt-1 block text-[11px] text-slate-500">
                    {timeAgo(inc.created_at)} · {inc.author}
                  </span>
                </Popup>
              </Marker>
            ))
          : null}

        {pinDrop ? (
          <Marker position={[pinDrop.lat, pinDrop.lng]} icon={pinDropIcon()} />
        ) : null}

        {userPos ? (
          <>
            {userPos.accuracy ? (
              <CircleMarker
                center={[userPos.lat, userPos.lng]}
                radius={Math.min(60, Math.max(14, userPos.accuracy / 2))}
                pathOptions={{
                  color: '#4ade80',
                  fillColor: '#4ade80',
                  fillOpacity: 0.07,
                  weight: 1,
                  opacity: 0.3,
                }}
                interactive={false}
              />
            ) : null}
            <Marker
              position={[userPos.lat, userPos.lng]}
              icon={userIcon({ gps: userPos.source === 'gps' })}
              zIndexOffset={600}
            />
          </>
        ) : null}

        {onMapClick ? <ClickCapture onMapClick={onMapClick} /> : null}
        <MapSync
          focus={focus}
          follow={follow}
          userPos={userPos}
          fitBounds={fitBounds}
        />
      </MapContainer>
    </div>
  );
}
