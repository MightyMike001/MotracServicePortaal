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
    maintenanceHistory: [
      {
        id: 'MH-2025-09',
        type: 'BMWT-keuring',
        status: 'Afgerond',
        description: 'Jaarlijkse BMWT-keuring uitgevoerd zonder bijzonderheden.',
        date: '2025-09-15',
        technician: 'L. de Bruin',
        hours: '1.523 uur'
      },
      {
        id: 'MH-2025-06',
        type: 'Periodiek onderhoud',
        status: 'Afgerond',
        description: 'Uitgebreide inspectie en smering van mast en kettingen.',
        date: '2025-06-20',
        technician: 'P. van Dijk',
        hours: '1.480 uur'
      },
      {
        id: 'MH-2025-10',
        type: 'Storing',
        status: 'In behandeling',
        description: 'Diagnose op mast-sensor foutcode, vervolgbezoek ingepland.',
        date: '2025-10-02',
        technician: 'Serviceteam Noord'
      }
    ],
    bmwt: {
      status: 'Goedgekeurd',
      expiry: '2026-03-15',
      lastInspection: '2025-03-14',
      inspector: 'DEKRA Inspecties',
      remarks: 'Volgende preventieve check ingepland voor Q1 2026.',
      certificateUrl: '#',
      certificateName: 'BMWT-certificaat E16 2025.pdf'
    },
    documents: [
      {
        id: 'DOC-E16-001',
        name: 'Gebruikershandleiding Linde E16.pdf',
        type: 'Handleiding',
        updatedAt: '2024-11-02',
        size: '1,2 MB',
        url: '#'
      },
      {
        id: 'DOC-E16-002',
        name: 'Onderhoudsrapport juni 2025.pdf',
        type: 'Onderhoudsrapport',
        updatedAt: '2025-06-21',
        size: '860 kB',
        url: '#'
      },
      {
        id: 'DOC-E16-003',
        name: 'BMWT-certificaat 2025.pdf',
        type: 'Certificaat',
        updatedAt: '2025-03-14',
        size: '540 kB',
        url: '#'
      }
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
    maintenanceHistory: [
      {
        id: 'MH-2025-08',
        type: 'Veiligheidsinspectie',
        status: 'Afgerond',
        description: 'Veiligheidscontrole uitgevoerd, geen gebreken gevonden.',
        date: '2025-08-05',
        technician: 'S. Reinders',
        hours: '3.360 uur'
      },
      {
        id: 'MH-2025-05',
        type: 'Periodiek onderhoud',
        status: 'Afgerond',
        description: 'Vervanging filters en controle remsysteem.',
        date: '2025-05-18',
        technician: 'M. Koster',
        hours: '3.210 uur'
      }
    ],
    bmwt: {
      status: 'Goedgekeurd',
      expiry: '2025-12-01',
      lastInspection: '2024-12-12',
      inspector: 'TÜV Nederland',
      remarks: 'Let op slijtage van banden bij volgende inspectie.',
      certificateUrl: '#',
      certificateName: 'BMWT-certificaat H25 2024.pdf'
    },
    documents: [
      {
        id: 'DOC-H25-001',
        name: 'Handleiding Linde H25.pdf',
        type: 'Handleiding',
        updatedAt: '2024-04-03',
        size: '1,8 MB',
        url: '#'
      },
      {
        id: 'DOC-H25-002',
        name: 'Onderhoudsoverzicht 2025.pdf',
        type: 'Onderhoudsrapport',
        updatedAt: '2025-05-18',
        size: '910 kB',
        url: '#'
      }
    ],
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
    maintenanceHistory: [
      {
        id: 'MH-2025-07',
        type: 'Correctief onderhoud',
        status: 'Afgerond',
        description: 'Vervanging hydraulische slang mastcircuit.',
        date: '2025-07-09',
        technician: 'G. Hermans',
        hours: '720 uur'
      },
      {
        id: 'MH-2025-09',
        type: 'BMWT-keuring',
        status: 'Afkeur',
        description: 'Keuring afgekeurd wegens beschadigde vork, herkeuring vereist.',
        date: '2025-09-01',
        technician: 'Inspectie Rotterdam'
      },
      {
        id: 'MH-2025-10',
        type: 'Schade-opvolging',
        status: 'Open',
        description: 'Herstel van beschadigde vork gepland, onderdelen besteld.',
        date: '2025-10-05',
        technician: 'Serviceteam Zuid'
      }
    ],
    bmwt: {
      status: 'Afkeur',
      expiry: '2025-09-01',
      lastInspection: '2025-09-01',
      inspector: 'BMWT Inspecties Rotterdam',
      remarks: 'Herkeuring vereist na vervanging vork.',
      certificateUrl: '#',
      certificateName: 'BMWT-rapport E20 2025.pdf'
    },
    documents: [
      {
        id: 'DOC-E20-001',
        name: 'Gebruikershandleiding Linde E20.pdf',
        type: 'Handleiding',
        updatedAt: '2024-07-15',
        size: '1,5 MB',
        url: '#'
      },
      {
        id: 'DOC-E20-002',
        name: 'Schaderapport september 2025.pdf',
        type: 'Schaderapport',
        updatedAt: '2025-09-03',
        size: '640 kB',
        url: '#'
      },
      {
        id: 'DOC-E20-003',
        name: 'Onderhoudsplan 2025-2026.pdf',
        type: 'Onderhoudsplan',
        updatedAt: '2025-05-01',
        size: '780 kB',
        url: '#'
      }
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
  if (!Array.isArray(activity)) {
    return [];
  }

  return activity.map(entry => {
    const cloned = { ...entry };
    const status = typeof cloned.status === 'string' && cloned.status.trim() ? cloned.status.trim() : 'Onbekend';
    const baseDate =
      cloned.updatedAt || cloned.completedAt || cloned.date || cloned.createdAt || new Date().toISOString();
    const baseAuthor = cloned.updatedBy || cloned.createdBy || 'Motrac Service';

    const historySource = Array.isArray(cloned.statusHistory) ? cloned.statusHistory : [];
    const history = historySource
      .map(item => ({
        id: item.id || `status-${Math.random().toString(36).slice(2)}`,
        status: item.status || status,
        date: item.date || item.changedAt || baseDate,
        author: item.author || item.changedBy || baseAuthor
      }))
      .filter(item => item.status && item.date);

    if (!history.length) {
      history.push({
        id: `status-${Math.random().toString(36).slice(2)}`,
        status,
        date: baseDate,
        author: baseAuthor
      });
    } else {
      const hasCurrentStatus = history.some(
        item => item.status && item.status.toLowerCase() === status.toLowerCase()
      );
      if (!hasCurrentStatus) {
        history.push({
          id: `status-${Math.random().toString(36).slice(2)}`,
          status,
          date: baseDate,
          author: baseAuthor
        });
      }
    }

    history.sort((a, b) => {
      const aTime = new Date(a.date).valueOf();
      const bTime = new Date(b.date).valueOf();
      if (Number.isNaN(aTime) || Number.isNaN(bTime)) {
        return 0;
      }
      return aTime - bTime;
    });

    cloned.statusHistory = history;
    return cloned;
  });
}

function normaliseMaintenanceHistory(history = [], fallbackActivity = []) {
  const source = Array.isArray(history) && history.length ? history : fallbackActivity;

  return (Array.isArray(source) ? source : [])
    .map((entry, index) => {
      const id = entry?.id || entry?.code || `maintenance-${index}`;
      const type = pickString(entry?.type, entry?.title, entry?.category, 'Onderhoud');
      const status = pickString(entry?.status, entry?.state, 'Onbekend');
      const description = pickString(entry?.description, entry?.desc, entry?.summary, entry?.notes, entry?.detail, '—');
      const date = entry?.date || entry?.performedAt || entry?.performed_at || entry?.updatedAt || entry?.updated_at || entry?.completedAt || entry?.completed_at || null;
      const technician = pickString(entry?.technician, entry?.engineer, entry?.performedBy, entry?.performed_by, entry?.owner, entry?.assignedTo, entry?.assigned_to);
      const hours = pickString(
        entry?.hours,
        entry?.hoursReading,
        entry?.hours_reading,
        entry?.urenstand,
        entry?.urenstand_datum ? `${entry.urenstand} (${entry.urenstand_datum})` : null,
        entry?.meterReading,
        entry?.meter_reading
      );

      return {
        id,
        type,
        status,
        description,
        date,
        technician: technician || null,
        hours: hours || null
      };
    })
    .filter(item => item.type || item.description || item.date)
    .sort((a, b) => {
      const aTime = new Date(a.date ?? 0).valueOf();
      const bTime = new Date(b.date ?? 0).valueOf();
      return Number.isNaN(bTime - aTime) ? 0 : bTime - aTime;
    });
}

function normaliseBmwDetails(rawDetails = null, { status: fallbackStatus, expiry: fallbackExpiry } = {}) {
  const source = rawDetails && typeof rawDetails === 'object' ? rawDetails : {};

  return {
    status: pickString(source.status, source.bmwStatus, fallbackStatus, '—'),
    expiry: source.expiry || source.expirationDate || source.expiration_date || fallbackExpiry || null,
    lastInspection:
      source.lastInspection ||
      source.last_inspection ||
      source.lastCheck ||
      source.last_check ||
      source.inspectionDate ||
      source.inspection_date ||
      null,
    inspector: pickString(source.inspector, source.inspectionCompany, source.inspection_company, source.partner, null),
    remarks: pickString(source.remarks, source.notes, source.comment, null),
    certificateUrl: source.certificateUrl || source.certificate_url || source.certificate || null,
    certificateName: pickString(source.certificateName, source.certificate_name, source.certificateTitle, null)
  };
}

function normaliseDocumentList(documents = []) {
  if (!Array.isArray(documents)) {
    return [];
  }

  return documents
    .map((doc, index) => {
      const name = pickString(doc?.name, doc?.title, doc?.filename, doc?.file_name);
      if (!name) {
        return null;
      }

      return {
        id: doc?.id || doc?.documentId || doc?.document_id || `doc-${index}`,
        name,
        type: pickString(doc?.type, doc?.category, doc?.documentType, doc?.document_type, 'Document'),
        updatedAt:
          doc?.updatedAt ||
          doc?.updated_at ||
          doc?.modifiedAt ||
          doc?.modified_at ||
          doc?.date ||
          null,
        size: pickString(doc?.size, doc?.fileSize, doc?.file_size, doc?.filesize, null),
        url: doc?.url || doc?.href || doc?.link || '#'
      };
    })
    .filter(Boolean);
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
  const maintenanceHistory = normaliseMaintenanceHistory(
    item.maintenanceHistory || item.maintenance_history || item.history,
    activity
  );
  const bmwt = normaliseBmwDetails(
    item.bmwt || item.bmwInspection || item.bmw_inspection || item.bmwData || item.bmw_data,
    { status: item.bmwStatus, expiry: item.bmwExpiry }
  );
  const documents = normaliseDocumentList(item.documents || item.files || item.attachments);
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
    maintenanceHistory,
    bmwt,
    documents,
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
