import { createClient } from '@supabase/supabase-js';

/**
 * Supabase wiring.
 *
 * SafeSpark is built to run in two modes, and every screen works in both:
 *
 *   CONFIGURED  — VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are present.
 *                 Incidents read/write/stream against Postgres with realtime.
 *   DEMO        — no keys. Seed data from /src/data plus localStorage.
 *                 This is what the published prototype runs on.
 *
 * Keeping the fallback real (rather than a "connect Supabase" wall) means the
 * MVP can be demoed on a laptop with no network and still behave correctly.
 */

const url = import.meta.env?.VITE_SUPABASE_URL || '';
const anonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
      realtime: { params: { eventsPerSecond: 5 } },
    })
  : null;

const LOCAL_KEY = 'safespark.incidents.v1';
const listeners = new Set();

function readLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLocal(rows) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(rows));
  } catch {
    /* private browsing / quota — in-memory state still holds for the session */
  }
}

/**
 * Incident data access. Same promise-based surface in both modes, so no
 * component ever branches on whether Supabase exists.
 */
export const incidentsApi = {
  async list({ seed = [] } = {}) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(250);
      if (error) throw error;
      return data ?? [];
    }
    const stored = readLocal();
    if (stored) return stored;
    writeLocal(seed);
    return seed;
  },

  async create(incident) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('incidents')
        .insert(incident)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const rows = readLocal() ?? [];
    const next = [incident, ...rows];
    writeLocal(next);
    listeners.forEach((fn) => fn(incident));
    return incident;
  },

  async confirm(id, nextCount) {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('incidents')
        .update({ confirmations: nextCount })
        .eq('id', id);
      if (error) throw error;
      return;
    }
    const rows = (readLocal() ?? []).map((r) =>
      r.id === id ? { ...r, confirmations: nextCount } : r,
    );
    writeLocal(rows);
  },

  /** Returns an unsubscribe function in both modes. */
  subscribe(onInsert) {
    if (isSupabaseConfigured) {
      const channel = supabase
        .channel('incidents-feed')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'incidents' },
          (payload) => onInsert(payload.new),
        )
        .subscribe();
      return () => supabase.removeChannel(channel);
    }
    listeners.add(onInsert);
    return () => listeners.delete(onInsert);
  },
};

/**
 * ---------------------------------------------------------------------------
 * SCHEMA — run this in the Supabase SQL editor to switch from demo to live.
 * ---------------------------------------------------------------------------
 *
 * create table public.incidents (
 *   id            uuid primary key default gen_random_uuid(),
 *   category      text not null,
 *   description   text not null check (char_length(description) between 4 and 600),
 *   lat           double precision not null,
 *   lng           double precision not null,
 *   anonymous     boolean not null default true,
 *   author        text,
 *   reporter_id   uuid references auth.users (id) on delete set null,
 *   confirmations integer not null default 0,
 *   created_at    timestamptz not null default now()
 * );
 *
 * alter table public.incidents enable row level security;
 *
 * -- Anyone signed in can read the map. Nobody can read reporter_id but the owner.
 * create policy "incidents are readable by authenticated users"
 *   on public.incidents for select to authenticated using (true);
 *
 * create policy "users insert their own reports"
 *   on public.incidents for insert to authenticated
 *   with check (reporter_id = auth.uid());
 *
 * create policy "users edit their own reports"
 *   on public.incidents for update to authenticated
 *   using (reporter_id = auth.uid());
 *
 * alter publication supabase_realtime add table public.incidents;
 *
 * create index incidents_created_at_idx on public.incidents (created_at desc);
 *
 * -- Restrict sign-up to IU addresses in Auth → Providers → Email,
 * -- or enforce it with a trigger on auth.users for @iu.edu / @indiana.edu.
 */
