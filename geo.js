import { PATH_NODES, PATH_EDGES } from '../data/campusGeo';

const R = 6371000; // Earth radius, metres
const toRad = (d) => (d * Math.PI) / 180;

/** Great-circle distance in metres. */
export function haversine(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(metres) {
  if (metres == null || Number.isNaN(metres)) return '—';
  if (metres < 1000) return `${Math.round(metres / 5) * 5} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}

export function formatFeet(metres) {
  const ft = metres * 3.28084;
  if (ft < 1000) return `${Math.round(ft / 10) * 10} ft`;
  return `${(ft / 5280).toFixed(2)} mi`;
}

/** Brisk, slightly-nervous walking pace — 1.45 m/s. */
export const WALK_SPEED_MPS = 1.45;

export function walkingMinutes(metres) {
  return Math.max(1, Math.round(metres / WALK_SPEED_MPS / 60));
}

export function formatWalkTime(metres) {
  const mins = walkingMinutes(metres);
  return mins === 1 ? '1 min' : `${mins} min`;
}

/** Compass bearing a → b, in degrees from north. */
export function bearing(a, b) {
  const φ1 = toRad(a.lat);
  const φ2 = toRad(b.lat);
  const Δλ = toRad(b.lng - a.lng);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (Math.atan2(y, x) * 180) / Math.PI;
}

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
export function compassPoint(deg) {
  return COMPASS[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
}

// ----------------------------------------------------------------- routing --

/** Adjacency built once at module load. */
const adjacency = (() => {
  const nodeById = new Map(PATH_NODES.map((n) => [n.id, n]));
  const adj = new Map(PATH_NODES.map((n) => [n.id, []]));
  for (const edge of PATH_EDGES) {
    const a = nodeById.get(edge.a);
    const b = nodeById.get(edge.b);
    if (!a || !b) continue;
    const d = haversine(a, b);
    adj.get(a.id).push({ to: b.id, d, lit: edge.lit });
    adj.get(b.id).push({ to: a.id, d, lit: edge.lit });
  }
  return { adj, nodeById };
})();

export function nearestPathNode(point) {
  let best = null;
  let bestD = Infinity;
  for (const node of PATH_NODES) {
    const d = haversine(point, node);
    if (d < bestD) {
      bestD = d;
      best = node;
    }
  }
  return { node: best, distance: bestD };
}

/**
 * Walking route from `from` to `to` across the campus path graph.
 *
 * Options:
 *   preferLit        multiply unlit segments so the route favours lit pavement
 *   avoidIncidents   array of {lat,lng} that push the route away from recent reports
 *
 * Returns { coords, distance, minutes, litShare, detoured } where `coords` is a
 * [[lat,lng], …] polyline ready for Leaflet, and `distance` is the true metric
 * length of that polyline (not the weighted cost used for the search).
 */
export function findWalkingRoute(from, to, options = {}) {
  const { preferLit = true, avoidIncidents = [] } = options;

  const start = nearestPathNode(from);
  const end = nearestPathNode(to);
  if (!start.node || !end.node) {
    return straightLine(from, to);
  }

  const UNLIT_PENALTY = preferLit ? 1.75 : 1;
  const INCIDENT_RADIUS = 70; // metres
  const INCIDENT_PENALTY = 2.2;

  const nearIncident = (node) =>
    avoidIncidents.some((inc) => haversine(node, inc) < INCIDENT_RADIUS);

  const dist = new Map();
  const prev = new Map();
  const visited = new Set();
  dist.set(start.node.id, 0);

  // Small graph (~70 nodes) — a linear-scan priority queue is plenty and keeps
  // the dependency list at zero.
  while (visited.size < PATH_NODES.length) {
    let current = null;
    let currentCost = Infinity;
    for (const [id, cost] of dist) {
      if (!visited.has(id) && cost < currentCost) {
        current = id;
        currentCost = cost;
      }
    }
    if (current == null) break;
    if (current === end.node.id) break;
    visited.add(current);

    for (const edge of adjacency.adj.get(current) ?? []) {
      if (visited.has(edge.to)) continue;
      const toNode = adjacency.nodeById.get(edge.to);
      let weight = edge.d;
      if (!edge.lit) weight *= UNLIT_PENALTY;
      if (nearIncident(toNode)) weight *= INCIDENT_PENALTY;
      const next = currentCost + weight;
      if (next < (dist.get(edge.to) ?? Infinity)) {
        dist.set(edge.to, next);
        prev.set(edge.to, current);
      }
    }
  }

  if (!dist.has(end.node.id)) return straightLine(from, to);

  // Walk the predecessor chain back to the start.
  const chain = [];
  let cursor = end.node.id;
  let guard = 0;
  while (cursor && guard < 500) {
    chain.unshift(cursor);
    if (cursor === start.node.id) break;
    cursor = prev.get(cursor);
    guard += 1;
  }

  const coords = [
    [from.lat, from.lng],
    ...chain.map((id) => {
      const n = adjacency.nodeById.get(id);
      return [n.lat, n.lng];
    }),
    [to.lat, to.lng],
  ];

  // Collapse the duplicate point when the user is already standing on a node.
  const cleaned = coords.filter(
    (p, i) => i === 0 || Math.abs(p[0] - coords[i - 1][0]) > 1e-7 || Math.abs(p[1] - coords[i - 1][1]) > 1e-7,
  );

  let distance = 0;
  let litMetres = 0;
  for (let i = 0; i < cleaned.length - 1; i += 1) {
    const a = { lat: cleaned[i][0], lng: cleaned[i][1] };
    const b = { lat: cleaned[i + 1][0], lng: cleaned[i + 1][1] };
    const seg = haversine(a, b);
    distance += seg;
    const edge = (adjacency.adj.get(chain[i - 1]) ?? []).find(
      (e) => e.to === chain[i],
    );
    if (!edge || edge.lit) litMetres += seg;
  }

  const direct = haversine(from, to);

  return {
    coords: cleaned,
    distance,
    minutes: walkingMinutes(distance),
    litShare: distance > 0 ? litMetres / distance : 1,
    detoured: distance > direct * 1.35,
    viaNodes: chain.map((id) => adjacency.nodeById.get(id)?.label).filter(Boolean),
  };
}

function straightLine(from, to) {
  const distance = haversine(from, to);
  return {
    coords: [
      [from.lat, from.lng],
      [to.lat, to.lng],
    ],
    distance,
    minutes: walkingMinutes(distance),
    litShare: 1,
    detoured: false,
    viaNodes: [],
  };
}

/** Nearest item from a list that has lat/lng, with its distance attached. */
export function nearestTo(point, items, filter = () => true) {
  let best = null;
  let bestD = Infinity;
  for (const item of items) {
    if (!filter(item)) continue;
    const d = haversine(point, item);
    if (d < bestD) {
      bestD = d;
      best = item;
    }
  }
  return best ? { item: best, distance: bestD } : null;
}

/** Sort a copy of `items` by distance from `point`, annotating each with `_distance`. */
export function sortByDistance(point, items) {
  return items
    .map((item) => ({ ...item, _distance: haversine(point, item) }))
    .sort((a, b) => a._distance - b._distance);
}
