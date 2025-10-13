import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.0';

const SUPABASE_URL = 'https://gizddlytlnnkvlgpvkcs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpemRkbHl0bG5ua3ZsZ3B2a2NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNzQ4OTEsImV4cCI6MjA3NTg1MDg5MX0.F8cRkJC5pq0O9eG-hL89Y33ga56AXd-moaSlOtpOg3A';

const noCacheFetch = (input, init = {}) => {
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
    fetch: noCacheFetch
  }
});

export async function fetchLocations() {
  const { data, error } = await supabase
    .from('locations_with_all')
    .select('name')
    .order('name');

  if (error) throw error;

  const names = (data || []).map(location => location.name);
  const unique = Array.from(new Set(names.filter(Boolean)));
  if (!unique.includes('Alle locaties')) {
    unique.unshift('Alle locaties');
  }

  return unique;
}

function mapContract(rawContract) {
  const contract = Array.isArray(rawContract) ? rawContract[0] : rawContract;
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

  const hoursRaw = contract.hours_per_year;
  const hoursNumber =
    typeof hoursRaw === 'number' ? hoursRaw : Number(hoursRaw);
  const uren = Number.isFinite(hoursNumber) ? hoursNumber : null;

  return {
    nummer: contract.contract_number ?? '—',
    start: contract.start_date ?? null,
    eind: contract.end_date ?? null,
    uren,
    type: contract.contract_type ?? '—',
    model: contract.model ?? '—'
  };
}

function mapActivity(rawActivity = []) {
  return rawActivity
    .map(item => ({
      id: item.activity_code ?? '—',
      type: item.activity_type ?? 'Onbekend',
      desc: item.description ?? '',
      status: item.status ?? 'Open',
      date: item.activity_date ?? null
    }))
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
}

export async function fetchFleet() {
  const { data, error } = await supabase
    .from('fleet_assets')
    .select(`
      id,
      reference,
      model,
      bmw_status,
      bmw_expiry,
      odo,
      odo_date,
      active,
      location:location_id ( name ),
      contract:fleet_contracts ( contract_number, start_date, end_date, hours_per_year, contract_type, model ),
      activity:fleet_activity ( activity_code, activity_type, description, status, activity_date )
    `)
    .order('id');

  if (error) throw error;

  return (data || []).map(item => ({
    id: item.id,
    ref: item.reference ?? '—',
    model: item.model ?? '—',
    bmwStatus: item.bmw_status ?? 'Onbekend',
    bmwExpiry: item.bmw_expiry ?? null,
    odo: (() => {
      const raw = item.odo;
      const value = typeof raw === 'number' ? raw : Number(raw);
      return Number.isFinite(value) ? value : null;
    })(),
    odoDate: item.odo_date ?? null,
    location: item.location?.name ?? 'Onbekende locatie',
    activity: mapActivity(item.activity),
    contract: mapContract(item.contract),
    active: item.active ?? true
  }));
}

export async function fetchUsers() {
  const { data, error } = await supabase
    .from('motrac_service_portaal_user_directory')
    .select(`
      id,
      display_name,
      email,
      phone,
      role,
      default_location_name
    `)
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
