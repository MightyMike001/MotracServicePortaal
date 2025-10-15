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
  global: {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      'Cache-Control': 'no-store',
      Pragma: 'no-cache',
      Expires: '0'
    },
    fetch: createNoCacheFetch()
  }
});

export async function getCurrentSession() {
  const result = await supabase.auth.getSession();
  if (result.error) throw result.error;
  return result.data;
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}

export async function signInWithPassword({ email, password }) {
  const result = await supabase.auth.signInWithPassword({ email, password });
  if (result.error) throw result.error;
  return result.data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

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

function normaliseAccountRequest(entry) {
  if (!entry) return null;

  return {
    id: entry.id,
    name: entry.name ?? '—',
    organisation: entry.organisation ?? '—',
    email: entry.email ?? '',
    phone: entry.phone ?? '',
    requestNotes: entry.request_notes ?? '',
    requestedRole: entry.requested_role ?? null,
    status: entry.status ?? 'pending',
    loginEnabled: entry.login_enabled ?? false,
    passwordSetAt: entry.password_set_at ?? null,
    authUserId: entry.auth_user_id ?? null,
    assignedRole: entry.assigned_role ?? null,
    assignedFleetId: entry.assigned_fleet_id ?? null,
    assignedFleetName: entry.assigned_fleet_name ?? null,
    assignedByProfileId: entry.assigned_by_profile_id ?? null,
    completedAt: entry.completed_at ?? null,
    submittedAt: entry.created_at ?? null,
    updatedAt: entry.updated_at ?? null
  };
}

async function fetchAccountRequestById(id) {
  if (!id) return null;

  const { data, error } = await supabase
    .from('motrac_service_portaal_account_request_overview')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return normaliseAccountRequest(data);
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
    fleetId: item.customer_fleet_id ?? null,
    fleetName: item.customer_fleet_name ?? '—',
    ref: item.reference ?? '—',
    model: item.model ?? '—',
    modelType: item.model_type ?? '—',
    bmwStatus: item.bmw_status ?? 'Onbekend',
    bmwExpiry: item.bmw_expiry ?? null,
    hours: toNumber(item.hours ?? item.odo),
    hoursDate: item.hours_date ?? item.odo_date ?? null,
    odo: toNumber(item.hours ?? item.odo),
    odoDate: item.hours_date ?? item.odo_date ?? null,
    location: item.location_name ?? 'Onbekende locatie',
    activity: normaliseActivity(item.activity ?? []),
    contract: normaliseContract(item.contract),
    openActivityCount: (() => {
      const value = toNumber(item.open_activity_count);
      return value == null ? 0 : value;
    })(),
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

export async function fetchAccountRequests() {
  const { data, error } = await supabase
    .from('motrac_service_portaal_account_request_overview')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(normaliseAccountRequest).filter(Boolean);
}

export async function fetchProfileByAuthUserId(authUserId) {
  if (!authUserId) return null;

  const { data, error } = await supabase
    .from('motrac_service_portaal_user_directory')
    .select(
      'id, auth_user_id, display_name, email, phone, role, default_location_id, default_location_name, last_sign_in_at'
    )
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function touchProfileSignIn() {
  const { error } = await supabase.rpc('touch_portal_profile_last_sign_in');
  if (error) throw error;
}

export async function fetchFleetMemberships(profileId) {
  if (!profileId) return [];

  const { data, error } = await supabase
    .from('motrac_service_portaal_profile_fleet_memberships')
    .select('customer_fleet_id, customer_fleet_name')
    .eq('profile_id', profileId);

  if (error) throw error;

  return (data || []).map(item => ({
    fleetId: item.customer_fleet_id ?? null,
    fleetName: item.customer_fleet_name ?? '—'
  }));
}

export async function createAccountRequest({ name, organisation, email, phone, requestNotes }) {
  const payload = {
    name: name?.trim(),
    organisation: organisation?.trim(),
    email: email?.trim()?.toLowerCase(),
    phone: phone?.trim() || null,
    request_notes: requestNotes?.trim() || null
  };

  const { data, error } = await supabase
    .from('motrac_service_portaal_account_requests')
    .insert(payload)
    .select('id')
    .single();

  if (error) throw error;
  return fetchAccountRequestById(data?.id);
}

export async function approveAccountRequest({ id, assignedRole, assignedFleetId, assignedByProfileId }) {
  if (!id) throw new Error('Accountaanvraag-ID ontbreekt.');

  const payload = {
    status: 'approved',
    assigned_role: assignedRole || null,
    assigned_fleet_id: assignedFleetId || null,
    assigned_by_profile_id: assignedByProfileId || null,
    completed_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('motrac_service_portaal_account_requests')
    .update(payload)
    .eq('id', id)
    .select('id')
    .single();

  if (error) throw error;
  return fetchAccountRequestById(data?.id);
}

export async function rejectAccountRequest({ id, assignedByProfileId }) {
  if (!id) throw new Error('Accountaanvraag-ID ontbreekt.');

  const payload = {
    status: 'rejected',
    assigned_role: null,
    assigned_fleet_id: null,
    assigned_by_profile_id: assignedByProfileId || null,
    login_enabled: false,
    completed_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('motrac_service_portaal_account_requests')
    .update(payload)
    .eq('id', id)
    .select('id')
    .single();

  if (error) throw error;
  return fetchAccountRequestById(data?.id);
}
