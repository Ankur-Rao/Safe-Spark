/**
 * Community incident categories + seed reports.
 *
 * Seed reports are fictional demo content placed on real campus geography so the
 * feed and heat layer have something to render on first launch. In production
 * these come from the `incidents` table in Supabase (see /src/lib/supabase.js)
 * and seeds are never shown.
 */

export const INCIDENT_CATEGORIES = [
  {
    id: 'lighting',
    label: 'Poor lighting',
    short: 'Lighting',
    icon: 'Lightbulb',
    color: '#fbbf24',
    hint: 'Burnt-out lamps, dark stretch of path, broken fixture.',
    severity: 1,
  },
  {
    id: 'harassment',
    label: 'Harassment / catcalling',
    short: 'Harassment',
    icon: 'MessageSquareWarning',
    color: '#f472b6',
    hint: 'Someone shouting at, following or verbally harassing passers-by.',
    severity: 3,
  },
  {
    id: 'suspicious-person',
    label: 'Aggressive or suspicious person',
    short: 'Person',
    icon: 'UserX',
    color: '#fb923c',
    hint: 'Behaviour that made you feel unsafe. Describe, never identify by race.',
    severity: 3,
  },
  {
    id: 'vehicle',
    label: 'Suspicious vehicle',
    short: 'Vehicle',
    icon: 'Car',
    color: '#a78bfa',
    hint: 'Car circling, idling with occupants, or following people.',
    severity: 2,
  },
  {
    id: 'crowd',
    label: 'Unsafe crowd',
    short: 'Crowd',
    icon: 'Users',
    color: '#38bdf8',
    hint: 'Large or aggressive crowd blocking a route.',
    severity: 2,
  },
  {
    id: 'hazard',
    label: 'Physical hazard',
    short: 'Hazard',
    icon: 'TriangleAlert',
    color: '#94a3b8',
    hint: 'Ice, broken pavement, blocked exit, construction with no lighting.',
    severity: 1,
  },
];

export const CATEGORY_BY_ID = Object.fromEntries(
  INCIDENT_CATEGORIES.map((c) => [c.id, c]),
);

const minutesAgo = (m) => new Date(Date.now() - m * 60_000).toISOString();

export const SEED_INCIDENTS = [
  {
    id: 'inc-seed-1',
    category: 'lighting',
    description:
      'Three lamps out along the Dunn Meadow path between 7th and the IMU. Pitch black for about 100 feet.',
    lat: 39.16986,
    lng: -86.52566,
    created_at: minutesAgo(42),
    anonymous: true,
    author: 'Anonymous',
    confirmations: 14,
  },
  {
    id: 'inc-seed-2',
    category: 'harassment',
    description:
      'Group outside a house on Kirkwood yelling at women walking past toward the Gates. Kept going for several minutes.',
    lat: 39.16650,
    lng: -86.53090,
    created_at: minutesAgo(96),
    anonymous: true,
    author: 'Anonymous',
    confirmations: 22,
  },
  {
    id: 'inc-seed-3',
    category: 'vehicle',
    description:
      'Dark sedan slow-rolling the Jordan Ave stretch by Read Center, circled twice while I walked.',
    lat: 39.16402,
    lng: -86.52062,
    created_at: minutesAgo(155),
    anonymous: false,
    author: 'Jules R.',
    confirmations: 9,
  },
  {
    id: 'inc-seed-4',
    category: 'suspicious-person',
    description:
      'Someone sitting in the Arboretum shelter calling out to people on the path. Left the area around 11:40.',
    lat: 39.17108,
    lng: -86.52030,
    created_at: minutesAgo(210),
    anonymous: true,
    author: 'Anonymous',
    confirmations: 11,
  },
  {
    id: 'inc-seed-5',
    category: 'lighting',
    description:
      'The SRSC north lot has one working light. Long walk to the far row in the dark after late lift.',
    lat: 39.17642,
    lng: -86.52049,
    created_at: minutesAgo(320),
    anonymous: true,
    author: 'Anonymous',
    confirmations: 31,
  },
  {
    id: 'inc-seed-6',
    category: 'crowd',
    description:
      'Big crowd spilling off the sidewalk at 10th & Woodlawn after the game, hard to get through.',
    lat: 39.17232,
    lng: -86.52345,
    created_at: minutesAgo(58),
    anonymous: true,
    author: 'Anonymous',
    confirmations: 6,
  },
  {
    id: 'inc-seed-7',
    category: 'hazard',
    description:
      'Construction fence narrowed the walkway by Luddy to one person wide, no lighting on the detour.',
    lat: 39.17238,
    lng: -86.52390,
    created_at: minutesAgo(430),
    anonymous: false,
    author: 'Priya N.',
    confirmations: 4,
  },
  {
    id: 'inc-seed-8',
    category: 'harassment',
    description:
      'Man followed me from the Wells Library plaza to 10th St. Stopped when I went into the lit area.',
    lat: 39.17168,
    lng: -86.51862,
    created_at: minutesAgo(25),
    anonymous: true,
    author: 'Anonymous',
    confirmations: 17,
  },
];
