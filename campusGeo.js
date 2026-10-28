/**
 * A lightweight walkable-path graph for IU Bloomington.
 *
 * Why this exists: a straight "as the crow flies" line to the nearest blue light
 * is useless at 1am — it routes you through a building. This graph is a coarse
 * model of the main streets and campus walkways so SafeSpark can return a route
 * that actually follows pavement, estimate a believable walking time, and bias
 * the route toward *lit* paths.
 *
 * It is deliberately coarse (≈70 nodes). In production you would swap this for
 * OSM pedestrian ways via a routing service (OSRM/Valhalla/GraphHopper) — the
 * `findWalkingRoute()` signature in /src/lib/geo.js is designed so that swap is
 * a one-file change.
 */

// ---------------------------------------------------------------- the grid --
// Main east–west streets (latitude) and north–south streets (longitude).
const EW = [
  { id: '3rd', lat: 39.16246, label: 'E 3rd St', lit: true },
  { id: '4th', lat: 39.16528, label: 'E 4th St', lit: true },
  { id: 'kirkwood', lat: 39.16646, label: 'Kirkwood Ave', lit: true },
  { id: '7th', lat: 39.16977, label: 'E 7th St', lit: true },
  { id: '10th', lat: 39.17232, label: 'E 10th St', lit: true },
  { id: '13th', lat: 39.17560, label: 'N Fee Ln / 13th', lit: true },
  { id: '17th', lat: 39.17940, label: 'E 17th St', lit: true },
];

const NS = [
  { id: 'dunn', lng: -86.52880, label: 'N Dunn St', lit: true },
  { id: 'indiana', lng: -86.52630, label: 'N Indiana Ave', lit: true },
  { id: 'woodlawn', lng: -86.52345, label: 'N Woodlawn Ave', lit: true },
  { id: 'jordan', lng: -86.52040, label: 'N Jordan Ave', lit: true },
  { id: 'eagleson', lng: -86.51800, label: 'N Eagleson Ave', lit: true },
  { id: 'union', lng: -86.51530, label: 'N Union St', lit: false },
];

/** Intersections that don't exist on the ground (campus core has no through-streets). */
const SKIP_INTERSECTIONS = new Set([
  '7th@union',
  '4th@union',
  '3rd@union',
  '3rd@eagleson',
  'kirkwood@woodlawn',
  'kirkwood@jordan',
  'kirkwood@eagleson',
  'kirkwood@union',
]);

const nodes = [];
const edges = [];

const nodeIndex = new Map();
function addNode(id, lat, lng, label) {
  if (nodeIndex.has(id)) return nodeIndex.get(id);
  const node = { id, lat, lng, label };
  nodes.push(node);
  nodeIndex.set(id, node);
  return node;
}

function addEdge(a, b, { lit = true, kind = 'street' } = {}) {
  if (!nodeIndex.has(a) || !nodeIndex.has(b)) return;
  edges.push({ a, b, lit, kind });
}

// Build the street intersections.
for (const row of EW) {
  for (const col of NS) {
    const id = `${row.id}@${col.id}`;
    if (SKIP_INTERSECTIONS.has(id)) continue;
    addNode(id, row.lat, col.lng, `${row.label} & ${col.label}`);
  }
}

// Link consecutive intersections along each east–west street.
for (const row of EW) {
  const present = NS.filter((c) => nodeIndex.has(`${row.id}@${c.id}`));
  for (let i = 0; i < present.length - 1; i += 1) {
    addEdge(`${row.id}@${present[i].id}`, `${row.id}@${present[i + 1].id}`, {
      lit: row.lit && present[i].lit,
    });
  }
}

// Link consecutive intersections along each north–south street.
for (const col of NS) {
  const present = EW.filter((r) => nodeIndex.has(`${r.id}@${col.id}`));
  for (let i = 0; i < present.length - 1; i += 1) {
    addEdge(`${present[i].id}@${col.id}`, `${present[i + 1].id}@${col.id}`, {
      lit: col.lit,
    });
  }
}

// ------------------------------------------------- campus interior walkways --
// Named waypoints inside the campus core, where there are no streets.
const WALK_NODES = [
  ['w-sample-gates', 39.16594, -86.52934, 'Sample Gates'],
  ['w-old-crescent', 39.16688, -86.52796, 'Old Crescent walk'],
  ['w-franklin', 39.16702, -86.52712, 'Franklin Hall'],
  ['w-woodburn', 39.16746, -86.52330, 'Woodburn Hall walk'],
  ['w-ballantine', 39.16716, -86.52192, 'Ballantine Hall'],
  ['w-imu', 39.16846, -86.52402, 'Indiana Memorial Union'],
  ['w-imu-east', 39.16878, -86.52262, 'IMU east walk'],
  ['w-dunn-meadow-s', 39.16924, -86.52520, 'Dunn Meadow south'],
  ['w-dunn-meadow-n', 39.17060, -86.52604, 'Dunn Meadow north'],
  ['w-showalter', 39.16712, -86.51932, 'Showalter Fountain'],
  ['w-mac', 39.16670, -86.51660, 'Musical Arts Center'],
  ['w-chem', 39.16896, -86.52126, 'Chemistry Building'],
  ['w-simon', 39.16986, -86.52010, 'Simon Hall'],
  ['w-arboretum-s', 39.17062, -86.52040, 'Arboretum south'],
  ['w-arboretum-n', 39.17160, -86.52018, 'Arboretum north'],
  ['w-wells', 39.17168, -86.51862, 'Wells Library'],
  ['w-luddy', 39.17238, -86.52348, 'Luddy Hall'],
  ['w-hodge', 39.17134, -86.52618, 'Hodge Hall (Kelley)'],
  ['w-srsc', 39.17528, -86.52030, 'SRSC'],
  ['w-briscoe', 39.17996, -86.51846, 'Briscoe Quad'],
  ['w-mcnutt', 39.17900, -86.51972, 'McNutt Quad'],
  ['w-foster', 39.17754, -86.51704, 'Foster Quad'],
  ['w-eigenmann', 39.17616, -86.51506, 'Eigenmann Hall'],
  ['w-assembly', 39.18076, -86.52520, 'Assembly Hall'],
  ['w-forest', 39.16416, -86.52384, 'Forest Quad'],
  ['w-read', 39.16402, -86.52108, 'Read Center'],
  ['w-collins', 39.16512, -86.51906, 'Collins LLC'],
];

for (const [id, lat, lng, label] of WALK_NODES) addNode(id, lat, lng, label);

// kind: 'path' = campus walkway, 'street' = sidewalk alongside a road.
// lit:false marks the stretches students actually complain about after dark.
const WALK_EDGES = [
  ['kirkwood@dunn', 'w-sample-gates', true],
  ['w-sample-gates', 'w-old-crescent', true],
  ['w-old-crescent', 'w-franklin', true],
  ['w-franklin', 'w-dunn-meadow-s', false],
  ['w-franklin', 'w-woodburn', true],
  ['w-woodburn', 'w-ballantine', true],
  ['w-woodburn', 'w-imu-east', true],
  ['w-imu', 'w-dunn-meadow-s', true],
  ['w-imu', 'w-imu-east', true],
  ['w-imu', '7th@woodlawn', true],
  ['w-imu-east', 'w-chem', true],
  ['w-dunn-meadow-s', 'w-dunn-meadow-n', false],
  ['w-dunn-meadow-n', '7th@indiana', true],
  ['w-dunn-meadow-n', '10th@indiana', false],
  ['w-ballantine', 'w-showalter', true],
  ['w-ballantine', '4th@jordan', true],
  ['w-showalter', 'w-mac', false],
  ['w-showalter', 'w-collins', true],
  ['w-showalter', 'w-simon', true],
  ['w-chem', 'w-simon', true],
  ['w-simon', 'w-arboretum-s', true],
  ['w-arboretum-s', 'w-arboretum-n', false],
  ['w-arboretum-n', 'w-wells', true],
  ['w-arboretum-n', '10th@jordan', true],
  ['w-wells', '10th@eagleson', true],
  ['w-luddy', '10th@woodlawn', true],
  ['w-hodge', '10th@indiana', true],
  ['w-hodge', '7th@indiana', true],
  ['w-srsc', '13th@jordan', true],
  ['w-srsc', 'w-mcnutt', false],
  ['w-mcnutt', 'w-briscoe', true],
  ['w-mcnutt', '17th@jordan', true],
  ['w-briscoe', '17th@eagleson', true],
  ['w-foster', '13th@eagleson', true],
  ['w-foster', 'w-eigenmann', false],
  ['w-eigenmann', '13th@union', true],
  ['w-assembly', '17th@indiana', true],
  ['w-forest', '4th@woodlawn', true],
  ['w-forest', 'w-read', true],
  ['w-read', '4th@jordan', true],
  ['w-read', 'w-collins', true],
  ['w-collins', '4th@eagleson', false],
  ['w-mac', '4th@eagleson', true],
];

for (const [a, b, lit] of WALK_EDGES) addEdge(a, b, { lit, kind: 'path' });

export const PATH_NODES = nodes;
export const PATH_EDGES = edges;

/** Landmark polygons drawn under the markers so the map stays legible
 *  even on a slow connection before the basemap tiles arrive. */
export const CAMPUS_LANDMARKS = [
  {
    id: 'dunn-meadow',
    name: 'Dunn Meadow',
    kind: 'green',
    ring: [
      [39.16896, -86.52636],
      [39.17086, -86.52680],
      [39.17112, -86.52470],
      [39.16930, -86.52430],
    ],
  },
  {
    id: 'arboretum',
    name: 'IU Arboretum',
    kind: 'green',
    ring: [
      [39.17010, -86.52120],
      [39.17210, -86.52140],
      [39.17220, -86.51940],
      [39.17020, -86.51930],
    ],
  },
  {
    id: 'woodlawn-field',
    name: 'Woodlawn Field',
    kind: 'green',
    ring: [
      [39.17330, -86.52300],
      [39.17470, -86.52310],
      [39.17475, -86.52130],
      [39.17335, -86.52125],
    ],
  },
  {
    id: 'old-crescent',
    name: 'Old Crescent',
    kind: 'built',
    ring: [
      [39.16600, -86.52900],
      [39.16790, -86.52880],
      [39.16800, -86.52660],
      [39.16620, -86.52650],
    ],
  },
  {
    id: 'imu-block',
    name: 'Indiana Memorial Union',
    kind: 'built',
    ring: [
      [39.16800, -86.52470],
      [39.16930, -86.52470],
      [39.16930, -86.52330],
      [39.16800, -86.52330],
    ],
  },
  {
    id: 'stadium',
    name: 'Memorial Stadium',
    kind: 'built',
    ring: [
      [39.17980, -86.52720],
      [39.18180, -86.52720],
      [39.18180, -86.52470],
      [39.17980, -86.52470],
    ],
  },
];
