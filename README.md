# SafeSpark

Campus safety platform MVP — built for Indiana University Bloomington undergraduates.

Five features, one thumb, at night: a **blue light map** that routes you to the nearest working
emergency phone, an **AI walk-home agent** that listens for trigger phrases and escalates on its
own, a **community incident map**, **one-tap SOS** with speed dial, and a **safety gear shop**
that funds the free tier.

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
```

```bash
npm run build        # Vercel-ready static build → /dist
npm run build:single # one self-contained index.html → /dist-single  (demos, QR codes, offline pitching)
npm run preview      # serve the production build locally
```

Node 18+. No environment variables are required to run — see *Demo mode* below.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | React 18 + Vite 5 (JSX) |
| Routing | react-router-dom (HashRouter — works on any static host, no server rewrites) |
| Styling | Tailwind CSS 3, dark-only high-contrast night theme |
| Icons | lucide-react |
| Maps | Leaflet + react-leaflet, OpenStreetMap raster tiles |
| Backend | Supabase (Postgres + Auth + Realtime) |
| Audio | Web Audio API + Web Speech API (no audio assets) |
| Hosting | Vercel |

---

## Demo mode vs live mode

SafeSpark runs fully in **both** modes, and every screen works in each:

- **Demo mode** (no env vars) — seed data from `/src/data`, writes to `localStorage`. This is what
  the published prototype runs on. Reports you file persist on the device.
- **Live mode** — set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`. Incidents
  read, write and stream from Postgres with realtime subscriptions.

The switch is automatic. `src/lib/supabase.js` exposes one promise-based `incidentsApi`, so no
component ever branches on whether a backend exists.

```bash
cp .env.example .env.local   # then paste your keys
```

The SQL to create the `incidents` table, its RLS policies and the realtime publication is at the
bottom of `src/lib/supabase.js` — paste it into the Supabase SQL editor.

### Deploying to Vercel

Framework preset **Vite**, build command `npm run build`, output `dist`. Add the two `VITE_*`
variables in Project → Settings → Environment Variables. Nothing else to configure.

---

## What's simulated, and why that's on purpose

This is an MVP. These are modelled on-screen rather than wired to a paid service:

| Simulated | What a production build does instead |
|---|---|
| SOS SMS + push dispatch | Twilio / Expo push, fired from a Supabase edge function |
| Live tracking link | Signed, expiring token minted server-side, position streamed to it |
| Speech recognition fallback | Real `SpeechRecognition` runs when the browser has it; a scripted listener stands in when it doesn't |
| Fake call audio | `speechSynthesis` + a synthesised ring cadence — already the real mechanism |
| Checkout | Stripe Checkout session; the affiliate link stays as the free path |

The dispatch log on the SOS screen deliberately mirrors real Twilio timing (queued → delivered,
per recipient) so copy, ordering and failure states can be user-tested before a cent is spent.

A first-run notice tells the user all of this before they touch anything. For a safety product
that is not a nicety: someone who believes their SOS reached their roommate when it didn't is
worse off than someone with no app at all.

---

## Before this goes in front of a real student

1. **Replace `src/data/blueLights.js`.** The 30 phones in it are hand-placed approximations. Get
   the real set from IU Public Safety / IUPD and keep the `verified` flag honest — the UI shows it.
2. **Re-verify the phone numbers** in `src/data/contacts.js` against iu.edu/police and
   bloomington.in.gov.
3. **Restrict sign-up to IU addresses** (Supabase Auth → Providers → Email, or a trigger on
   `auth.users` for `@iu.edu` / `@indiana.edu`).
4. **Moderation for the incident feed.** The report form already tells users to describe behaviour
   and clothing rather than race; that needs a human queue and a report-a-report path behind it.
5. **Decide the data-retention policy** for location history before you start storing any.

---

## Project structure

```
src/
├── main.jsx                  entry
├── App.jsx                   routes + provider tree
├── index.css                 Tailwind layers, Leaflet night-theme overrides
│
├── context/
│   ├── AppContext.jsx        profile, trusted contacts, settings, geolocation
│   ├── AlertContext.jsx      SOS state machine, siren, dispatch log, toasts
│   ├── AgentContext.jsx      hoists the agent session above the router
│   ├── IncidentContext.jsx   incident list, filters, realtime subscription
│   └── CartContext.jsx       cart lines, totals, drawer state
│
├── lib/
│   ├── supabase.js           client + incidentsApi + schema SQL
│   ├── geo.js                haversine, Dijkstra routing, distance/time formatting
│   ├── audio.js              siren, ring cadence, speech synthesis + recognition, haptics
│   ├── hooks.js              useLocalStorage, useInterval, useHoldToConfirm, useDismissable
│   └── time.js               relative time, recency weighting, ids
│
├── data/
│   ├── blueLights.js         30 IU blue light phones  ← replace before launch
│   ├── campusGeo.js          walkable path graph + landmark polygons
│   ├── incidents.js          categories + seed reports
│   ├── contacts.js           public lines + default trusted contacts
│   ├── products.js           gear catalog + affiliate URL builder
│   └── agentScript.js        trigger phrases, safe phrases, fake call script
│
├── components/
│   ├── AppHeader.jsx  BottomNav.jsx  Modal.jsx  Toasts.jsx  FirstRunNotice.jsx
│   ├── map/           CampusMap.jsx, mapIcons.js
│   ├── agent/         useSafetyAgent.js, TranscriptStream.jsx, CallOverlay.jsx
│   ├── incidents/     ReportModal.jsx, IncidentFeed.jsx
│   ├── sos/           SosButton.jsx, CallConfirm.jsx, ContactsModal.jsx
│   └── shop/          ProductCard.jsx, ProductModal.jsx, CartDrawer.jsx, productIcons.js
│
└── pages/
    ├── MapPage.jsx  AgentPage.jsx  IncidentsPage.jsx  SosPage.jsx  ShopPage.jsx
```

---

## Notes on the interesting parts

**Routing to a blue light** (`src/lib/geo.js`). A straight line to the nearest phone is useless at
1am — it routes you through Ballantine Hall. `campusGeo.js` models the main streets and campus
walkways as a ~70-node graph with a `lit` flag per segment; `findWalkingRoute()` runs Dijkstra over
it with two multipliers: unlit segments cost 1.75× when *Prefer lit* is on, and segments near a
recent, higher-severity report cost 2.2×. The route card tells you when it took the long way and
why. Swapping in OSRM or Valhalla later is a one-function change.

**The agent is deterministic, not a model.** Phrase matching plus a timer-driven check-in loop. For
escalation logic, a rule you can read and test beats a model you have to trust. The LLM belongs on
top of this layer for conversation quality — never underneath it deciding whether to call for help.

**The agent lives above the router.** A walk-home companion that stops monitoring when you tab over
to the map is a safety feature that quietly turns itself off. `AgentContext` keeps the session,
check-in timer and transcript alive across navigation, and the Agent tab shows a live dot from
every screen.

**Nothing dials for you.** Every speed-dial tile opens a confirmation sheet, then a `tel:` link.
One-tap 911 is a great feature and a terrible accident.

**The alarm is opt-in on trigger.** Auto-sounding a siren can escalate a situation someone was
trying to walk quietly away from. The setting exists, defaults off, and says why.

**Map markers are divIcons, not sprites.** No image requests, nothing to 404 through a bundler, and
full control over the glow. The street graph also draws as a faint vector layer, so the campus
stays readable before the raster tiles arrive — or if they never do.

---

## Revenue

Affiliate commission on gear (`buildAffiliateUrl` in `src/data/products.js` appends
`VITE_AFFILIATE_TAG` when one is set, and leaves links clean when it isn't). The map, the agent,
the incident feed and SOS stay free for every student — the safety features never need a paywall.
Catalog prices are indicative placeholders; wire them to live retailer prices or a Supabase
`products` table before launch.
