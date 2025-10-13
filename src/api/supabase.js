import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.0';

/**
 * Resolve the Supabase configuration.
 *
 * The configuration can be provided in three ways (priority order):
 *  1. Via a global `window.__SUPABASE_CONFIG__` object (useful for deployments).
 *  2. Via environment variables injected at build time.
 *  3. Falling back to the default development credentials that ship with the repo.
 */
function resolveSupabaseConfig() {
  const globalConfig = typeof window !== 'undefined' ? window.__SUPABASE_CONFIG__ : undefined;

  const url =
    globalConfig?.url ||
    (typeof process !== 'undefined' ? process.env?.SUPABASE_URL : undefined) ||
    'https://gizddlytlnnkvlgpvkcs.supabase.co';

  const anonKey =
    globalConfig?.anonKey ||
    (typeof process !== 'undefined' ? process.env?.SUPABASE_ANON_KEY : undefined) ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpemRkbHl0bG5ua3ZsZ3B2a2NzIiwi' +
      'cm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNzQ4OTEsImV4cCI6MjA3NTg1MDg5MX0.F8cRkJC5pq0O9eG-hL89Y33ga56AXd-moaSlOtpOg3A';

  if (!url || !anonKey) {
    throw new Error('Supabase configuratie ontbreekt. Controleer de URL en anon key.');
  }

  return { url, anonKey };
}

function createNoCacheFetch() {
  return (input, init = {}) => {
    const headers = new Headers(init.headers || {});
    headers.set('Cache-Control', 'no-store');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');

    return fetch(input, {
      ...init,
      cache: 'no-store',
      headers
    });
  };
}

const { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY } = resolveSupabaseConfig();

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false
  },
  global: {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Cache-Control': 'no-store',
      Pragma: 'no-cache',
      Expires: '0'
    },
    fetch: createNoCacheFetch()
  }
});

function toNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function normaliseContract(contractLike) {
  const contract = Array.isArray(contractLike) ? contractLike[0] : contractLike;
  if (!contract) {
    return {
      nummer: '—',
      start: null,
      eind: null,
      uren: null,
      type: '—',
      model: '—'
    };
  }

  return {
    nummer: contract.contract_number ?? '—',
    start: contract.start_date ?? null,
    eind: contract.end_date ?? null,
    uren: toNumber(contract.hours_per_year),
    type: contract.contract_type ?? '—',
    model: contract.model ?? '—'
  };
}

function normaliseActivity(activity = []) {
  return activity
    .map(item => ({
      id: item.activity_code ?? '—',
      type: item.activity_type ?? 'Onbekend',
      desc: item.description ?? '',
      status: item.status ?? 'Open',
      date: item.activity_date ?? null
    }))
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
}

export async function fetchLocations() {
  const { data, error } = await supabase
    .from('locations_with_all')
    .select('id, name')
    .order('name');

  if (error) throw error;

  const uniqueNames = [];
  const seen = new Set();

  for (const location of data || []) {
    const name = location?.name;
    if (!name || seen.has(name)) continue;
    seen.add(name);
    uniqueNames.push(name);
  }

  return seen.has('Alle locaties')
    ? uniqueNames
    : ['Alle locaties', ...uniqueNames];
}

export async function fetchFleet() {
  const { data, error } = await supabase
    .from('fleet_assets_overview')
    .select('*')
    .order('id');

  if (error) throw error;

  return (data || []).map(item => ({
    id: item.id,
    ref: item.reference ?? '—',
    model: item.model ?? '—',
    bmwStatus: item.bmw_status ?? 'Onbekend',
    bmwExpiry: item.bmw_expiry ?? null,
    odo: toNumber(item.odo),
    odoDate: item.odo_date ?? null,
    location: item.location_name ?? 'Onbekende locatie',
    activity: normaliseActivity(item.activity ?? []),
    contract: normaliseContract(item.contract),
    active: item.active ?? true
  }));
}

export async function fetchUsers() {
  const { data, error } = await supabase
    .from('motrac_service_portaal_user_directory')
    .select('id, display_name, email, phone, role, default_location_name')
    .order('display_name');

  if (error) throw error;

  return (data || []).map(user => ({
    id: user.id,
    name: user.display_name ?? '—',
    email: user.email ?? '',
    phone: user.phone ?? '',
    location: user.default_location_name ?? '—',
    role: user.role ?? 'Gebruiker'
  }));
}
