/**
 * Safety gear catalog.
 *
 * Revenue model for the MVP is affiliate referral, so each product carries a
 * retailer search URL rather than a fabricated product page. `buildAffiliateUrl`
 * appends your associate tag only when one is configured, which keeps dev builds
 * and screenshots free of a half-real tracking parameter.
 *
 * Prices are indicative catalog figures for the prototype — wire them to the
 * retailer's live price (or your own Supabase `products` table) before launch.
 *
 * Product art is drawn as an inline icon + gradient (see ProductCard), so there
 * are no external image requests and nothing can render as a broken box.
 */

const AFFILIATE_TAG = import.meta.env?.VITE_AFFILIATE_TAG || '';

export function buildAffiliateUrl(product) {
  const url = new URL('https://www.amazon.com/s');
  url.searchParams.set('k', product.searchTerm);
  if (AFFILIATE_TAG) url.searchParams.set('tag', AFFILIATE_TAG);
  return url.toString();
}

export const SHOP_CATEGORIES = [
  { id: 'all', label: 'All gear' },
  { id: 'alarms', label: 'Alarms' },
  { id: 'defense', label: 'Defense' },
  { id: 'wearables', label: 'Wearables' },
  { id: 'dorm', label: 'Dorm & door' },
  { id: 'night', label: 'Night walk' },
];

export const PRODUCTS = [
  {
    id: 'p-alarm-keychain',
    name: 'Personal Alarm Keychain',
    tagline: '130 dB siren, pull-pin activation',
    price: 19.99,
    compareAt: 26.0,
    category: 'alarms',
    icon: 'Siren',
    accent: '#22a7f0',
    rating: 4.8,
    reviews: 2411,
    badge: 'Most carried',
    searchTerm: 'personal safety alarm keychain 130db',
    blurb:
      'A pull-pin siren loud enough to be heard across a quad. The point is not to hurt anyone — it is to make you impossible to approach quietly, and to turn every head within a block.',
    specs: [
      'Rated 130 dB at 1 ft',
      'Pull-pin activation, re-arms by reinserting',
      'Replaceable LR44 cells, ~60 min continuous',
      'Carabiner clips to a bag strap, not buried in a pocket',
    ],
    whyItWorks:
      'Noise is the deterrent with the fewest ways to go wrong. Nothing to aim, nothing to train on, nothing that can be taken and used against you.',
  },
  {
    id: 'p-pepper-spray',
    name: 'Pepper Spray + Quick-Release Clip',
    tagline: 'Flip-top safety, 10 ft stream',
    price: 14.99,
    compareAt: 19.99,
    category: 'defense',
    icon: 'SprayCan',
    accent: '#f03030',
    rating: 4.7,
    reviews: 5180,
    badge: null,
    searchTerm: 'pepper spray keychain quick release',
    blurb:
      'Flip-top cap so it cannot discharge in your bag, and a quick-release clip so it comes off the keyring without your keys attached.',
    specs: [
      '0.54 oz canister, ~10 ft stream',
      'Flip-top safety over the actuator',
      'Quick-release ring separates from keys',
      'UV marking dye in the formula',
    ],
    whyItWorks:
      'Range buys you distance and distance buys you time. Practise the draw with the inert trainer canister before you ever need it.',
    policyNote:
      'Campus housing and employers set their own rules on what you may carry, and those rules differ from state law. Check IU policy and your lease before buying.',
  },
  {
    id: 'p-window-breaker',
    name: 'Window Breaker & Belt Cutter',
    tagline: 'Spring-loaded punch, keyring size',
    price: 12.5,
    compareAt: null,
    category: 'defense',
    icon: 'Hammer',
    accent: '#fbbf24',
    rating: 4.6,
    reviews: 1894,
    badge: null,
    searchTerm: 'car window breaker seatbelt cutter keychain',
    blurb:
      'Spring-loaded tip shatters tempered side glass with a press, and the recessed blade cuts a jammed belt. Made for the car, not for a person.',
    specs: [
      'Spring-loaded carbide tip — no swing needed',
      'Recessed blade, safe against a thumb',
      'Keyring or visor clip',
      'Works on tempered side glass, not a laminated windshield',
    ],
    whyItWorks:
      'The scenario is a car you need to get out of fast. Keep it on the keyring you drive with, not in the trunk.',
  },
  {
    id: 'p-safety-ring',
    name: 'Covert Alert Ring',
    tagline: 'Double-press sends your location',
    price: 69.0,
    compareAt: 89.0,
    category: 'wearables',
    icon: 'Fingerprint',
    accent: '#a78bfa',
    rating: 4.4,
    reviews: 612,
    badge: 'Pairs with SafeSpark',
    searchTerm: 'smart safety ring panic button bluetooth',
    blurb:
      'Looks like jewellery, works like a panic button. A double-press over Bluetooth fires the same alert as the in-app SOS, without taking your phone out.',
    specs: [
      'Bluetooth LE, ~4 month battery',
      'Double-press alert, long-press cancel',
      'Water resistant, sizes 5–11',
      'Triggers SafeSpark SOS when paired',
    ],
    whyItWorks:
      'Reaching for a phone is visible. A ring is not — which matters when the whole point is not to signal that you are signalling.',
  },
  {
    id: 'p-panic-clip',
    name: 'Bluetooth Panic Clip',
    tagline: 'Bag-strap button, no phone needed',
    price: 34.0,
    compareAt: null,
    category: 'wearables',
    icon: 'BellRing',
    accent: '#5ec8ff',
    rating: 4.3,
    reviews: 388,
    badge: 'Pairs with SafeSpark',
    searchTerm: 'bluetooth panic button personal safety clip',
    blurb:
      'Clips to a backpack strap at collarbone height, where your hand already is. Press-and-hold fires SOS; a short press starts a check-in timer.',
    specs: [
      'Bluetooth LE, coin-cell replaceable',
      'Hold 2s = SOS · short press = check-in',
      'Strap, belt or lapel clip',
      'Haptic confirm so you know it sent',
    ],
    whyItWorks:
      'Muscle memory beats menus. The button lives in one place and does one thing.',
  },
  {
    id: 'p-door-alarm',
    name: 'Door Stop Alarm',
    tagline: '120 dB wedge for dorms and sublets',
    price: 16.99,
    compareAt: 22.0,
    category: 'dorm',
    icon: 'DoorClosed',
    accent: '#4ade80',
    rating: 4.7,
    reviews: 3276,
    badge: 'Hotel + sublet pick',
    searchTerm: 'door stop alarm wedge security 120db',
    blurb:
      'A rubber wedge that screams when the door pushes against it. No tools, no drilling, nothing your landlord can object to.',
    specs: [
      '120 dB when the wedge is depressed',
      'Rubber grip holds on carpet or hardwood',
      'Three-level sensitivity switch',
      'Packs flat — travels well',
    ],
    whyItWorks:
      'Dorm locks and sublet locks are whatever the last tenant left behind. This one you bring yourself.',
  },
  {
    id: 'p-flashlight',
    name: 'Strobe Tactical Flashlight',
    tagline: '1000 lm, disorienting strobe mode',
    price: 24.99,
    compareAt: 32.0,
    category: 'night',
    icon: 'Flashlight',
    accent: '#f59e0b',
    rating: 4.5,
    reviews: 1540,
    badge: null,
    searchTerm: 'rechargeable tactical flashlight 1000 lumen strobe',
    blurb:
      'Bright enough to make a dark stretch of path a non-issue, with a strobe mode that makes it very hard to look directly at you.',
    specs: [
      '1000 lumens, USB-C rechargeable',
      'High / low / strobe cycle',
      'Aluminium body, pocket clip',
      '~6 hr on low',
    ],
    whyItWorks:
      'Most "unsafe" walks are really just unlit walks. Fixing the light fixes most of the feeling.',
  },
  {
    id: 'p-test-strips',
    name: 'Drink Test Strips',
    tagline: '20 strips, two common compounds',
    price: 15.0,
    compareAt: null,
    category: 'night',
    icon: 'TestTube',
    accent: '#38bdf8',
    rating: 4.2,
    reviews: 920,
    badge: null,
    searchTerm: 'drink test strips drug detection',
    blurb:
      'Wallet-sized strips that check a drop of a drink in about two minutes. Keep a few in a phone case and share them around the table.',
    specs: [
      '20 single-use strips per pack',
      'Screens two commonly used compounds',
      'Results in ~2 minutes',
      'Fits a phone case or card slot',
    ],
    whyItWorks:
      'A negative strip is not a guarantee and it does not cover everything — treat it as one check among several, not permission to leave a drink unattended.',
  },
  {
    id: 'p-kubotan',
    name: 'Grip Bar Keychain',
    tagline: 'Knuckle-stabilising keyring bar',
    price: 11.0,
    compareAt: null,
    category: 'defense',
    icon: 'Key',
    accent: '#94a3b8',
    rating: 4.1,
    reviews: 744,
    badge: null,
    searchTerm: 'self defense keychain kubotan',
    blurb:
      'A solid bar that keeps keys from twisting in your hand and gives you something to hold. Simple, legal to carry almost anywhere, cheap enough to have on every set.',
    specs: [
      'Aluminium, ~5.5 in',
      'Knurled grip',
      'Split ring + clip',
      'Under 2 oz',
    ],
    whyItWorks:
      'Worth pairing with one real self-defence class — IUPD runs free sessions. The object is only as useful as the hour you spent learning to use it.',
  },
  {
    id: 'p-reflective-band',
    name: 'LED Reflective Armband',
    tagline: 'Be visible to the cars, not just the cameras',
    price: 9.99,
    compareAt: 14.0,
    category: 'night',
    icon: 'Watch',
    accent: '#4ade80',
    rating: 4.6,
    reviews: 1102,
    badge: null,
    searchTerm: 'led reflective running armband rechargeable',
    blurb:
      'For the walk home that includes crossing Jordan or 17th. Steady or blink, rechargeable, weighs nothing.',
    specs: [
      'USB-C rechargeable, ~10 hr',
      'Steady or blink',
      'Fits arm, wrist or bag strap',
      'Weather resistant',
    ],
    whyItWorks:
      'The most common night-time campus injury is not an assault. It is a car that did not see someone crossing.',
  },
];
