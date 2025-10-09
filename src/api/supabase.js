import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.0';

const SUPABASE_URL = 'https://ezcxfobjsvomcjuwbgep.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6Y3hmb2Jqc3ZvbWNqdXdiZ2VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2NzQ3ODcsImV4cCI6MjA3MzI1MDc4N30.IhYZYfB_N2JDOG82NFbB_wxY7BJhahqJd9Y71nhpI3I';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false
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

  return {
    nummer: contract.contract_number ?? '—',
    start: contract.start_date ?? null,
    eind: contract.end_date ?? null,
    uren: contract.hours_per_year ?? null,
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
    odo: typeof item.odo === 'number' ? item.odo : Number(item.odo ?? 0),
    odoDate: item.odo_date ?? null,
    location: item.location?.name ?? 'Onbekende locatie',
    activity: mapActivity(item.activity),
    contract: mapContract(item.contract),
    active: item.active ?? true
  }));
}

export async function fetchUsers() {
  const { data, error } = await supabase
    .from('portal_users')
    .select(`
      id,
      display_name,
      email,
      phone,
      role,
      location:location_id ( name )
    `)
    .order('display_name');

  if (error) throw error;

  return (data || []).map(user => ({
    id: user.id,
    name: user.display_name ?? '—',
    email: user.email ?? '',
    phone: user.phone ?? '',
    location: user.location?.name ?? '—',
    role: user.role ?? 'Gebruiker'
  }));
}
