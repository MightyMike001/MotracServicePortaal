const DEFAULT_LOCATIONS = [
  'Alle locaties',
  'Demovloot Motrac – Almere',
  'Demovloot Motrac – Venlo',
  'Demovloot Motrac – Zwijndrecht',
  'Van Dijk Logistics – Rotterdam'
];

const DEFAULT_CUSTOMER_FLEETS = [
  { id: 'CF-DEMO', name: 'Motrac Demovloot' },
  { id: 'CF-VANDIJK', name: 'Van Dijk Logistics' }
];

const DEFAULT_FLEET = [
  {
    id: 'E16-123456',
    ref: 'Reachtruck – Magazijn A',
    model: 'Linde E16',
    modelType: 'Elektrische heftruck',
    bmwStatus: 'Goedgekeurd',
    bmwExpiry: '2026-03-15',
    hours: 1523,
    hoursDate: '2025-09-28',
    location: 'Demovloot Motrac – Almere',
    customer: {
      name: 'Motrac',
      subLocation: 'Demovloot – Almere'
    },
    fleetId: 'CF-DEMO',
    activity: [
      { id: 'M-1001', type: 'Onderhoud', desc: 'Periodieke servicebeurt', status: 'Afgerond', date: '2025-06-20' },
      { id: 'M-1010', type: 'Storing', desc: 'Mast-sensor foutcode', status: 'Open', date: '2025-10-01' }
    ],
    contract: {
      nummer: 'CTR-2023-ALM-001',
      start: '2023-01-01',
      eind: '2026-12-31',
      uren: 800,
      type: 'Full Service',
      model: 'Linde E16'
    },
    active: true
  },
  {
    id: 'H25-654321',
    ref: 'Buiten terrein',
    model: 'Linde H25',
    modelType: 'Verbranding heftruck',
    bmwStatus: 'Goedgekeurd',
    bmwExpiry: '2025-12-01',
    hours: 3420,
    hoursDate: '2025-09-10',
    location: 'Demovloot Motrac – Zwijndrecht',
    customer: {
      name: 'Motrac',
      subLocation: 'Demovloot – Zwijndrecht'
    },
    fleetId: 'CF-DEMO',
    activity: [],
    contract: {
      nummer: 'CTR-2022-ZWD-019',
      start: '2022-05-15',
      eind: '2025-11-30',
      uren: 1200,
      type: 'PM + Correctief',
      model: 'Linde H25'
    },
    active: true
  },
  {
    id: 'E20-777777',
    ref: 'Productiehal 3',
    model: 'Linde E20',
    modelType: 'Elektrische heftruck',
    bmwStatus: 'Afkeur',
    bmwExpiry: '2025-09-01',
    hours: 801,
    hoursDate: '2025-09-30',
    location: 'Van Dijk Logistics – Rotterdam',
    customer: {
      name: 'Van Dijk Logistics'
    },
    fleetId: 'CF-VANDIJK',
    activity: [
      { id: 'M-1020', type: 'Schade', desc: 'Vork beschadigd', status: 'Open', date: '2025-10-03' }
    ],
    contract: {
      nummer: 'CTR-2024-VNL-003',
      start: '2024-02-01',
      eind: '2027-01-31',
      uren: 900,
      type: 'Full Service',
      model: 'Linde E20'
    },
    active: true
  }
];

const DEFAULT_USERS = [
  { id: 'U1', name: 'Test User 2', email: 'test2@example.com', phone: '+31 6 12345678', location: 'Demovloot Motrac – Almere', role: 'Beheerder' },
  { id: 'U2', name: 'Jan Jansen', email: 'jan.jansen@example.com', phone: '+31 6 98765432', location: 'Demovloot Motrac – Venlo', role: 'Gebruiker' },
  { id: 'U3', name: 'Eva Visser', email: 'eva.visser@example.com', phone: '+31 6 45678901', location: 'Demovloot Motrac – Zwijndrecht', role: 'Gebruiker' },
  { id: 'U4', name: 'Kees Bakker', email: 'k.bakker@example.com', phone: '+31 6 33445566', location: 'Demovloot Motrac – Almere', role: 'Gebruiker' },
  { id: 'U5', name: 'Sanne de Boer', email: 's.boer@example.com', phone: '+31 6 11112222', location: 'Demovloot Motrac – Almere', role: 'Beheerder' },
  { id: 'U13', name: 'Lotte de Ruiter', email: 'lotte.deruiter@motrac.nl', phone: '+31 6 21004567', location: 'Demovloot Motrac – Venlo', role: 'Vlootbeheerder' },
  { id: 'U6', name: 'Ruben Smit', email: 'r.smit@example.com', phone: '+31 6 22223333', location: 'Demovloot Motrac – Venlo', role: 'Gebruiker' },
  { id: 'U7', name: 'Hanna Mulder', email: 'h.mulder@example.com', phone: '+31 6 33334444', location: 'Demovloot Motrac – Zwijndrecht', role: 'Gebruiker' },
  { id: 'U8', name: 'Peter Groen', email: 'p.groen@example.com', phone: '+31 6 44445555', location: 'Demovloot Motrac – Venlo', role: 'Gebruiker' },
  { id: 'U9', name: 'Laura Kok', email: 'l.kok@example.com', phone: '+31 6 55556666', location: 'Demovloot Motrac – Almere', role: 'Gebruiker' },
  { id: 'U10', name: 'William de Vries', email: 'w.vries@example.com', phone: '+31 6 66667777', location: 'Demovloot Motrac – Zwijndrecht', role: 'Gebruiker' },
  { id: 'U11', name: 'Noa Willems', email: 'n.willems@example.com', phone: '+31 6 77778888', location: 'Demovloot Motrac – Almere', role: 'Gebruiker' },
  { id: 'U12', name: 'Anja van Dijk', email: 'a.vandijk@vandijklogistics.nl', phone: '+31 6 88889999', location: 'Van Dijk Logistics – Rotterdam', role: 'Klant' }
];

function findDefaultFleetName(fleetId) {
  return DEFAULT_CUSTOMER_FLEETS.find(fleet => fleet.id === fleetId)?.name || '—';
}

function pickString(...candidates) {
  for (const candidate of candidates) {
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }
  return null;
}

function normaliseContract(contractLike = {}, fallbackModel = '—') {
  if (!contractLike) {
    return {
      nummer: '—',
      start: null,
      eind: null,
      uren: null,
      type: '—',
      model: fallbackModel ?? '—'
    };
  }

  return {
    nummer: contractLike.nummer ?? contractLike.contractNumber ?? contractLike.contract_number ?? '—',
    start: contractLike.start ?? contractLike.startDatum ?? contractLike.start_date ?? null,
    eind: contractLike.eind ?? contractLike.eindDatum ?? contractLike.end_date ?? null,
    uren: contractLike.uren ?? contractLike.hoursPerYear ?? contractLike.hours_per_year ?? null,
    type: contractLike.type ?? contractLike.contractType ?? contractLike.contract_type ?? '—',
    model: contractLike.model ?? fallbackModel ?? '—'
  };
}

function normaliseFleetActivity(activity = []) {
  return Array.isArray(activity)
    ? activity.map(entry => ({ ...entry }))
    : [];
}

function normaliseFleetCustomer(item = {}) {
  const rawCustomer =
    item.customer ||
    item.owner ||
    item.customerOwner ||
    item.customer_owner ||
    item.customerInfo ||
    null;

  let name = null;
  let subLocation = null;

  if (rawCustomer && typeof rawCustomer === 'object' && !Array.isArray(rawCustomer)) {
    name = pickString(
      rawCustomer.name,
      rawCustomer.customer,
      rawCustomer.customerName,
      rawCustomer.owner,
      rawCustomer.fleet
    );
    subLocation = pickString(
      rawCustomer.subLocation,
      rawCustomer.sub_location,
      rawCustomer.branch,
      rawCustomer.branchName,
      rawCustomer.branch_name,
      rawCustomer.location,
      rawCustomer.site
    );
  } else if (typeof rawCustomer === 'string') {
    name = pickString(rawCustomer);
  }

  name =
    pickString(
      name,
      item.customerName,
      item.customer_name,
      item.customer,
      item.ownerName,
      item.owner_name,
      item.fleetCustomer,
      item.fleet_customer
    ) || null;

  subLocation =
    pickString(
      subLocation,
      item.customerSubLocation,
      item.customer_sub_location,
      item.subLocation,
      item.sub_location,
      item.branch,
      item.branchName,
      item.branch_name
    ) || null;

  if (!name) {
    return null;
  }

  if (subLocation && subLocation.toLowerCase() === name.toLowerCase()) {
    subLocation = null;
  }

  return {
    name,
    subLocation
  };
}

function normaliseFleetItem(item = {}) {
  const fleetId = item.fleetId || item.customerFleetId || item.customer_fleet_id || null;
  const activity = normaliseFleetActivity(item.activity);
  const hoursValue =
    item.hours ??
    item.hoursReading ??
    item.hours_reading ??
    item.urenstand ??
    item.odo ??
    null;
  const hoursDateValue =
    item.hoursDate ??
    item.hours_date ??
    item.hoursReadingDate ??
    item.urenstandDatum ??
    item.urenstand_datum ??
    item.odoDate ??
    item.odo_date ??
    null;

  const customer = normaliseFleetCustomer(item);
  const ownershipLabel = customer
    ? customer.subLocation
      ? `${customer.name} – ${customer.subLocation}`
      : customer.name
    : null;

  return {
    ...item,
    fleetId,
    fleetName:
      item.fleetName ||
      item.customerFleetName ||
      item.customer_fleet_name ||
      (fleetId ? findDefaultFleetName(fleetId) : '—') ||
      '—',
    customer,
    ownershipLabel,
    location: item.location || item.location_name || '—',
    modelType: item.modelType || item.model_type || '—',
    hours: hoursValue,
    hoursDate: hoursDateValue,
    odo: hoursValue,
    odoDate: hoursDateValue,
    activity,
    openActivityCount: activity.filter(entry => entry?.status === 'Open').length,
    contract: normaliseContract(item.contract, item.model),
    active: typeof item.active === 'boolean' ? item.active : true
  };
}

export let LOCATIONS = [...DEFAULT_LOCATIONS];
export let FLEET = DEFAULT_FLEET.map(item => normaliseFleetItem(item));
export let USERS = [...DEFAULT_USERS];

let fleetIndex = new Map();
let fleetGroups = new Map();

function rebuildFleetIndex() {
  const nextIndex = new Map();
  const nextGroups = new Map();

  FLEET.forEach(item => {
    nextIndex.set(item.id, item);
    if (item.fleetId) {
      if (!nextGroups.has(item.fleetId)) {
        nextGroups.set(item.fleetId, []);
      }
      nextGroups.get(item.fleetId).push(item);
    }
  });

  fleetIndex = nextIndex;
  fleetGroups = nextGroups;
}

rebuildFleetIndex();

export function setLocations(locations = []) {
  const cleaned = Array.isArray(locations) ? locations.filter(Boolean) : [];
  const unique = Array.from(new Set(cleaned));
  if (!unique.includes('Alle locaties')) {
    unique.unshift('Alle locaties');
  }
  LOCATIONS = unique;
}

export function setFleet(fleet = []) {
  if (!Array.isArray(fleet)) {
    return;
  }

  FLEET = fleet.map(item => normaliseFleetItem(item));
  rebuildFleetIndex();
}

export function setUsers(users = []) {
  if (Array.isArray(users)) {
    USERS = users;
  }
}

export function resetToDefaults() {
  LOCATIONS = [...DEFAULT_LOCATIONS];
  FLEET = DEFAULT_FLEET.map(item => normaliseFleetItem(item));
  USERS = [...DEFAULT_USERS];
  rebuildFleetIndex();
}

export function getFleetById(id) {
  if (!id) return null;
  return fleetIndex.get(id) || null;
}

export function getFleetGroupByFleetId(fleetId) {
  if (!fleetId) return [];
  const group = fleetGroups.get(fleetId);
  return group ? [...group] : [];
}

export function getFleetRepresentativeByFleetId(fleetId) {
  if (!fleetId) return null;
  const group = fleetGroups.get(fleetId);
  return group && group.length ? group[0] : null;
}
