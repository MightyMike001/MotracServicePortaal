import {
  LOCATIONS,
  FLEET,
  USERS,
  getFleetRepresentativeByFleetId,
  setLocations,
  setFleet,
  getFleetById
} from '../data.js';

const STORAGE_KEY = 'motrac-service-portal';

const TEST_CREDENTIALS = {
  password: 'test',
  aliases: [
    'test',
    'test@example.com',
    'test@motrac.nl',
    'test@test.nl',
    'gebruiker@motrac.nl',
    'vloot@motrac.nl',
    'klant@motrac.nl'
  ]
};

const TEST_PROFILE = {
  id: 'profile-test',
  auth_user_id: 'auth-user-test',
  display_name: 'Testbeheerder',
  email: 'test@motrac.nl',
  phone: '+31 6 12345678',
  role: 'Beheerder',
  default_location_id: null,
  default_location_name: 'Alle locaties',
  last_sign_in_at: null
};

const PERSONA_PROFILES = new Map(
  [
    {
      id: 'profile-test',
      auth_user_id: 'auth-user-test',
      display_name: 'Testbeheerder',
      email: 'test@motrac.nl',
      phone: '+31 6 12345678',
      role: 'Beheerder',
      default_location_id: null,
      default_location_name: 'Alle locaties'
    },
    {
      id: 'profile-employee',
      auth_user_id: 'auth-user-employee',
      display_name: 'Interne gebruiker',
      email: 'gebruiker@motrac.nl',
      phone: '+31 6 87654321',
      role: 'Gebruiker',
      default_location_id: null,
      default_location_name: 'Alle locaties'
    },
    {
      id: 'profile-fleet',
      auth_user_id: 'auth-user-fleet',
      display_name: 'Vlootbeheer',
      email: 'vloot@motrac.nl',
      phone: '+31 6 99887766',
      role: 'Vlootbeheerder',
      default_location_id: null,
      default_location_name: 'Demovloot Motrac – Almere'
    },
    {
      id: 'profile-customer',
      auth_user_id: 'auth-user-customer',
      display_name: 'Van Dijk Logistics',
      email: 'klant@motrac.nl',
      phone: '+31 6 33445566',
      role: 'Klant',
      default_location_id: null,
      default_location_name: 'Van Dijk Logistics – Rotterdam'
    }
  ].map(profile => [profile.email.toLowerCase(), Object.freeze(profile)])
);

const DEFAULT_ACCOUNT_REQUESTS = [
  {
    id: 'REQ-1001',
    name: 'Sanne Willems',
    organisation: 'Willems Logistiek',
    email: 'sanne.willems@example.com',
    phone: '+31 6 23456789',
    requestNotes: 'Wil toegang tot onderhoudsrapportages.',
    requestedRole: 'Gebruiker',
    status: 'pending',
    loginEnabled: true,
    passwordSetAt: null,
    authUserId: null,
    assignedRole: null,
    assignedFleetId: null,
    assignedFleetName: null,
    assignedByProfileId: null,
    completedAt: null,
    submittedAt: '2025-09-28T08:30:00Z',
    updatedAt: '2025-09-28T08:30:00Z'
  },
  {
    id: 'REQ-1000',
    name: 'Erik de Groot',
    organisation: 'Motrac NL',
    email: 'erik.degroot@motrac.nl',
    phone: '+31 6 11223344',
    requestNotes: 'Account nodig voor vlootbeheer.',
    requestedRole: 'Vlootbeheerder',
    status: 'approved',
    loginEnabled: true,
    passwordSetAt: '2025-09-20T09:15:00Z',
    authUserId: 'auth-user-erik',
    assignedRole: 'Vlootbeheerder',
    assignedFleetId: 'CF-DEMO',
    assignedFleetName: 'Motrac Demovloot',
    assignedByProfileId: TEST_PROFILE.id,
    completedAt: '2025-09-21T10:05:00Z',
    submittedAt: '2025-09-18T13:20:00Z',
    updatedAt: '2025-09-21T10:05:00Z'
  },
  {
    id: 'REQ-0999',
    name: 'Lotte van Rijn',
    organisation: 'Van Dijk Logistics',
    email: 'lotte.vanrijn@vandijklogistics.nl',
    phone: '+31 6 55667788',
    requestNotes: 'Alleen inzicht in eigen vloot noodzakelijk.',
    requestedRole: 'Klant',
    status: 'rejected',
    loginEnabled: false,
    passwordSetAt: null,
    authUserId: null,
    assignedRole: null,
    assignedFleetId: null,
    assignedFleetName: null,
    assignedByProfileId: TEST_PROFILE.id,
    completedAt: '2025-09-15T15:45:00Z',
    submittedAt: '2025-09-12T11:05:00Z',
    updatedAt: '2025-09-15T15:45:00Z'
  }
];

const authListeners = new Set();
let storeLoaded = false;
let memoryStore = null;

function createDefaultStore() {
  return {
    session: null,
    profile: { ...TEST_PROFILE },
    accountRequests: DEFAULT_ACCOUNT_REQUESTS.map(cloneAccountRequest),
    customers: buildDefaultCustomers()
  };
}

function ensureStore() {
  if (!storeLoaded) {
    loadStoreFromSessionStorage();
    storeLoaded = true;
  }

  if (!memoryStore) {
    memoryStore = createDefaultStore();
  }

  if (!Array.isArray(memoryStore.customers)) {
    memoryStore.customers = buildDefaultCustomers();
  }

  return memoryStore;
}

export function resetLocalStore() {
  storeLoaded = false;
  memoryStore = null;
}

function loadStoreFromSessionStorage() {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    memoryStore = createDefaultStore();
    return;
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      memoryStore = createDefaultStore();
      persistStore();
      return;
    }

    const parsed = JSON.parse(raw);
    memoryStore = {
      session: parsed.session ?? null,
      profile: { ...TEST_PROFILE, ...(parsed.profile || {}) },
      accountRequests: Array.isArray(parsed.accountRequests)
        ? parsed.accountRequests.map(cloneAccountRequest)
        : DEFAULT_ACCOUNT_REQUESTS.map(cloneAccountRequest),
      customers: Array.isArray(parsed.customers)
        ? parsed.customers.map(cloneCustomer)
        : buildDefaultCustomers()
    };
  } catch (error) {
    console.warn('Kon opgeslagen browserdata niet lezen, start met standaardwaarden.', error);
    memoryStore = createDefaultStore();
    persistStore();
  }
}

function persistStore() {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return;
  }

  try {
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        session: memoryStore.session,
        profile: memoryStore.profile,
        accountRequests: memoryStore.accountRequests,
        customers: cloneCustomers(memoryStore.customers || [])
      })
    );
  } catch (error) {
    console.warn('Kon browserdata niet opslaan.', error);
  }
}

function cloneAccountRequest(request) {
  return { ...request };
}

function cloneSession(session) {
  if (!session) return null;
  return {
    ...session,
    user: session.user
      ? {
          ...session.user,
          user_metadata: { ...(session.user.user_metadata || {}) }
        }
      : null
  };
}

function cloneProfile(profile) {
  return profile ? { ...profile } : null;
}

function cloneLocations() {
  return [...LOCATIONS];
}

function cloneFleetItem(item) {
  return {
    ...item,
    customer: item.customer ? { ...item.customer } : null,
    activity: Array.isArray(item.activity) ? item.activity.map(entry => ({ ...entry })) : [],
    contract: item.contract ? { ...item.contract } : null
  };
}

function cloneFleet() {
  return FLEET.map(cloneFleetItem);
}

function cloneUsers() {
  return USERS.map(user => ({ ...user }));
}

function cloneCustomerLocation(location) {
  if (!location) return null;
  return { ...location };
}

function cloneCustomer(customer) {
  if (!customer) return null;
  return {
    ...customer,
    fleetIds: Array.isArray(customer.fleetIds) ? [...customer.fleetIds] : [],
    userIds: Array.isArray(customer.userIds) ? [...customer.userIds] : [],
    locations: Array.isArray(customer.locations) ? customer.locations.map(cloneCustomerLocation) : []
  };
}

function cloneCustomers(customers = []) {
  return customers.map(cloneCustomer);
}

function generateRequestId() {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `REQ-${random}`;
}

const DEFAULT_CUSTOMER_TIMESTAMP = '2025-01-01T00:00:00.000Z';

function normaliseRole(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function slugify(value) {
  if (typeof value !== 'string') return '';
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function deriveSubLocation(displayName, customerName) {
  if (typeof displayName !== 'string' || !displayName.trim()) {
    return null;
  }
  if (typeof customerName === 'string' && displayName.startsWith(`${customerName} – `)) {
    return displayName.slice(customerName.length + 3);
  }
  const parts = displayName.split(' – ');
  if (parts.length > 1) {
    return parts.slice(1).join(' – ');
  }
  return displayName;
}

function generateCustomerId(customers, name) {
  const existing = new Set(customers.map(customer => customer.id));
  const baseSlug = slugify(name).toUpperCase();
  let candidate = baseSlug ? `CUS-${baseSlug}` : null;
  let counter = 2;
  while (!candidate || existing.has(candidate)) {
    const suffix = counter > 2 ? `-${counter}` : '';
    candidate = baseSlug ? `CUS-${baseSlug}${suffix}` : null;
    counter += 1;
    if (!candidate || existing.has(candidate)) {
      candidate = `CUS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    }
    if (!existing.has(candidate)) {
      break;
    }
  }
  return candidate;
}

function isFleetIdUsed(fleetId) {
  if (!fleetId) return false;
  const representative = getFleetRepresentativeByFleetId(fleetId);
  return Boolean(representative);
}

function generateFleetId(customers) {
  const known = new Set();
  customers.forEach(customer => {
    if (Array.isArray(customer.fleetIds)) {
      customer.fleetIds.forEach(id => known.add(id));
    }
    if (customer.primaryFleetId) {
      known.add(customer.primaryFleetId);
    }
  });

  let candidate = null;
  do {
    candidate = `CF-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  } while (known.has(candidate) || isFleetIdUsed(candidate));

  return candidate;
}

function generateLocationId(customer, displayName) {
  const existingLocations = Array.isArray(customer?.locations)
    ? customer.locations
    : customer?.locations instanceof Map
    ? Array.from(customer.locations.values())
    : [];
  const existing = new Set(existingLocations.map(location => location.id));
  const slug = slugify(displayName).toUpperCase();
  let candidate = slug ? `LOC-${slug}` : null;
  let counter = 2;
  while (!candidate || existing.has(candidate)) {
    const suffix = counter > 2 ? `-${counter}` : '';
    candidate = slug ? `LOC-${slug}${suffix}` : null;
    counter += 1;
    if (!candidate || existing.has(candidate)) {
      candidate = `LOC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    }
    if (!existing.has(candidate)) {
      break;
    }
  }
  return candidate;
}

function buildDefaultCustomers() {
  const customersByName = new Map();

  const ensureCustomer = (name, fleetId) => {
    if (typeof name !== 'string' || !name.trim()) {
      return null;
    }
    const trimmedName = name.trim();
    const key = trimmedName.toLowerCase();
    if (!customersByName.has(key)) {
      const id = generateCustomerId(Array.from(customersByName.values()), trimmedName);
      customersByName.set(key, {
        id,
        name: trimmedName,
        createdAt: DEFAULT_CUSTOMER_TIMESTAMP,
        updatedAt: DEFAULT_CUSTOMER_TIMESTAMP,
        createdByRole: 'system',
        primaryFleetId: fleetId || null,
        fleetIds: new Set(fleetId ? [fleetId] : []),
        userIds: new Set(),
        locations: new Map()
      });
    }

    const customer = customersByName.get(key);
    if (fleetId) {
      customer.fleetIds.add(fleetId);
      if (!customer.primaryFleetId) {
        customer.primaryFleetId = fleetId;
      }
    }
    return customer;
  };

  FLEET.forEach(truck => {
    const customerName = truck?.customer?.name;
    const fleetId = truck?.fleetId || null;
    const customer = ensureCustomer(customerName, fleetId);
    if (!customer) return;

    const locationDisplay = typeof truck.location === 'string' ? truck.location : null;
    if (!locationDisplay) return;
    const locationKey = locationDisplay.toLowerCase();
    if (customer.locations.has(locationKey)) {
      return;
    }

    const subLocation = truck?.customer?.subLocation || deriveSubLocation(locationDisplay, customer.name);
    customer.locations.set(locationKey, {
      id: generateLocationId(customer, locationDisplay),
      name: subLocation || locationDisplay,
      displayName: locationDisplay,
      createdAt: DEFAULT_CUSTOMER_TIMESTAMP,
      createdByRole: 'system',
      updatedAt: DEFAULT_CUSTOMER_TIMESTAMP
    });
  });

  USERS.forEach(user => {
    if ((user.role || '').toLowerCase() !== 'klant') {
      return;
    }
    const userLocation = typeof user.location === 'string' ? user.location.trim().toLowerCase() : '';
    if (!userLocation) return;
    for (const customer of customersByName.values()) {
      if (customer.locations.has(userLocation)) {
        customer.userIds.add(user.id);
        user.customerId = customer.id;
        if (!customer.primaryFleetId) {
          const [firstFleet] = customer.fleetIds.values();
          customer.primaryFleetId = firstFleet || generateFleetId(Array.from(customersByName.values()).map(entry => ({
            id: entry.id,
            primaryFleetId: entry.primaryFleetId,
            fleetIds: Array.from(entry.fleetIds)
          })));
        }
        break;
      }
    }
  });

  return Array.from(customersByName.values()).map(customer => ({
    id: customer.id,
    name: customer.name,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
    createdByRole: customer.createdByRole,
    primaryFleetId: customer.primaryFleetId,
    fleetIds: Array.from(customer.fleetIds),
    userIds: Array.from(customer.userIds),
    locations: Array.from(customer.locations.values())
  }));
}

function findCustomerById(customers, customerId) {
  if (!customerId) return null;
  return customers.find(customer => customer.id === customerId) || null;
}

function findCustomerByName(customers, name) {
  if (typeof name !== 'string') return null;
  const normalised = name.trim().toLowerCase();
  if (!normalised) return null;
  return customers.find(customer => customer.name?.toLowerCase() === normalised) || null;
}

function findCustomerLocation(customers, locationId) {
  for (const customer of customers) {
    const location = (customer.locations || []).find(entry => entry.id === locationId);
    if (location) {
      return { customer, location };
    }
  }
  return null;
}

function ensureCustomerFleetId(store, customer) {
  if (!customer) return null;
  if (!Array.isArray(customer.fleetIds)) {
    customer.fleetIds = [];
  }
  if (customer.primaryFleetId) {
    if (!customer.fleetIds.includes(customer.primaryFleetId)) {
      customer.fleetIds.push(customer.primaryFleetId);
    }
    return customer.primaryFleetId;
  }

  const fleetId = generateFleetId(store.customers || []);
  customer.primaryFleetId = fleetId;
  if (!customer.fleetIds.includes(fleetId)) {
    customer.fleetIds.push(fleetId);
  }
  return fleetId;
}

function buildLocationDisplayName(customer, locationName) {
  const trimmed = typeof locationName === 'string' ? locationName.trim() : '';
  if (!trimmed) {
    return null;
  }
  if (trimmed.toLowerCase().startsWith(`${customer.name.toLowerCase()} –`)) {
    return trimmed;
  }
  return `${customer.name} – ${trimmed}`;
}

function isMachineIdUsed(id) {
  if (!id) return false;
  return Boolean(getFleetById(id));
}

function generateMachineId(customer) {
  const prefix = slugify(customer.name || '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 3)
    .toUpperCase() || 'MC';
  let candidate = null;
  do {
    candidate = `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  } while (isMachineIdUsed(candidate));
  return candidate;
}

function linkCustomerUserInternal(store, customer, userId) {
  const user = USERS.find(entry => entry.id === userId);
  if (!user) {
    throw new Error('Gebruiker niet gevonden.');
  }

  if (!Array.isArray(customer.userIds)) {
    customer.userIds = [];
  }
  if (!customer.userIds.includes(userId)) {
    customer.userIds.push(userId);
  }

  user.role = 'Klant';
  user.customerId = customer.id;
  customer.updatedAt = new Date().toISOString();

  return { customer, user };
}

function resolveFleetName(fleetId) {
  if (!fleetId) return null;
  const fleet = getFleetRepresentativeByFleetId(fleetId);
  return fleet?.fleetName ?? null;
}

function normaliseEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function resolvePersonaProfile(email) {
  const normalised = normaliseEmail(email);
  if (!normalised) return null;
  return PERSONA_PROFILES.get(normalised) || null;
}

function matchesTestCredentials(value) {
  const normalised = normaliseEmail(value);
  if (!normalised) return false;
  return TEST_CREDENTIALS.aliases.some(alias => normaliseEmail(alias) === normalised);
}

function applyPersonaToStore(email) {
  const store = ensureStore();
  const persona = resolvePersonaProfile(email);

  if (persona) {
    store.profile = {
      ...TEST_PROFILE,
      ...persona,
      email: persona.email,
      display_name: persona.display_name || persona.displayName || persona.email,
      default_location_id: persona.default_location_id ?? null,
      default_location_name:
        persona.default_location_name || persona.defaultLocation || TEST_PROFILE.default_location_name,
      last_sign_in_at: null
    };
  } else if (!store.profile) {
    store.profile = { ...TEST_PROFILE };
  }

  return store;
}

function emitAuthEvent(event, session) {
  authListeners.forEach(listener => {
    try {
      listener(event, session);
    } catch (error) {
      console.error('Auth listener error', error);
    }
  });
}

function createSession() {
  const now = new Date().toISOString();
  const profile = ensureStore().profile;
  profile.last_sign_in_at = now;
  const session = {
    access_token: 'local-session-token',
    token_type: 'bearer',
    expires_in: 60 * 60 * 4,
    user: {
      id: profile.auth_user_id,
      email: profile.email,
      user_metadata: {
        full_name: profile.display_name
      }
    },
    created_at: now
  };
  return session;
}

export async function getCurrentSession() {
  const { session } = ensureStore();
  return { session: cloneSession(session) };
}

export function onAuthStateChange(callback) {
  if (typeof callback !== 'function') {
    return { data: null, error: new Error('Callback moet een functie zijn.') };
  }

  authListeners.add(callback);

  return {
    data: {
      subscription: {
        unsubscribe() {
          authListeners.delete(callback);
        }
      }
    },
    error: null
  };
}

export async function signInWithPassword({ email, password }) {
  if (matchesTestCredentials(email) && password === TEST_CREDENTIALS.password) {
    const store = applyPersonaToStore(email);
    const session = createSession();
    store.session = session;
    persistStore();
    emitAuthEvent('SIGNED_IN', cloneSession(session));
    return { session: cloneSession(session), user: cloneSession(session)?.user ?? null };
  }

  const error = new Error('Invalid login credentials');
  error.status = 400;
  throw error;
}

export async function signInWithPersona(email) {
  const persona = resolvePersonaProfile(email);
  if (!persona) {
    const error = new Error('Persona not configured');
    error.status = 404;
    throw error;
  }

  const store = applyPersonaToStore(persona.email);

  const session = createSession();
  store.session = session;
  persistStore();
  emitAuthEvent('SIGNED_IN', cloneSession(session));

  return { session: cloneSession(session), user: cloneSession(session)?.user ?? null };
}

export async function signOut() {
  const store = ensureStore();
  store.session = null;
  persistStore();
  emitAuthEvent('SIGNED_OUT', null);
}

export async function fetchLocations() {
  return cloneLocations();
}

export async function fetchFleet() {
  return cloneFleet();
}

export async function fetchUsers() {
  return cloneUsers();
}

export async function fetchAccountRequests() {
  const store = ensureStore();
  return store.accountRequests.map(cloneAccountRequest);
}

export async function fetchProfileByAuthUserId(authUserId) {
  const store = ensureStore();
  if (!authUserId) return null;
  if (authUserId === store.profile.auth_user_id) {
    return cloneProfile(store.profile);
  }
  return null;
}

export async function touchProfileSignIn() {
  const store = ensureStore();
  store.profile.last_sign_in_at = new Date().toISOString();
  persistStore();
}

export async function fetchFleetMemberships(profileId) {
  if (!profileId) return [];
  return [];
}

function upsertAccountRequest(request) {
  const store = ensureStore();
  const existingIndex = store.accountRequests.findIndex(item => item.id === request.id);
  if (existingIndex === -1) {
    store.accountRequests.unshift(request);
  } else {
    store.accountRequests[existingIndex] = request;
  }
  persistStore();
  return cloneAccountRequest(request);
}

export async function createAccountRequest({ name, organisation, email, phone, requestNotes }) {
  const now = new Date().toISOString();
  const newRequest = {
    id: generateRequestId(),
    name: name || '—',
    organisation: organisation || '—',
    email: email || '',
    phone: phone || '',
    requestNotes: requestNotes || '',
    requestedRole: null,
    status: 'pending',
    loginEnabled: true,
    passwordSetAt: null,
    authUserId: null,
    assignedRole: null,
    assignedFleetId: null,
    assignedFleetName: null,
    assignedByProfileId: null,
    completedAt: null,
    submittedAt: now,
    updatedAt: now
  };

  return upsertAccountRequest(newRequest);
}

export async function approveAccountRequest({ id, assignedRole, assignedFleetId, assignedByProfileId }) {
  const store = ensureStore();
  const existing = store.accountRequests.find(request => request.id === id);
  if (!existing) {
    throw new Error('Accountaanvraag niet gevonden.');
  }

  const now = new Date().toISOString();
  existing.status = 'approved';
  existing.assignedRole = assignedRole || 'Gebruiker';
  existing.assignedFleetId = assignedFleetId || null;
  existing.assignedFleetName = resolveFleetName(existing.assignedFleetId);
  existing.assignedByProfileId = assignedByProfileId || null;
  existing.loginEnabled = true;
  existing.completedAt = now;
  existing.updatedAt = now;

  return upsertAccountRequest(existing);
}

export async function rejectAccountRequest({ id, assignedByProfileId }) {
  const store = ensureStore();
  const existing = store.accountRequests.find(request => request.id === id);
  if (!existing) {
    throw new Error('Accountaanvraag niet gevonden.');
  }

  const now = new Date().toISOString();
  existing.status = 'rejected';
  existing.assignedRole = null;
  existing.assignedFleetId = null;
  existing.assignedFleetName = null;
  existing.assignedByProfileId = assignedByProfileId || null;
  existing.loginEnabled = false;
  existing.completedAt = now;
  existing.updatedAt = now;

  return upsertAccountRequest(existing);
}

export async function fetchCustomers() {
  const store = ensureStore();
  return cloneCustomers(store.customers || []);
}

export async function createCustomer({ name, actorRole, linkedUserId, createdByProfileId } = {}) {
  if (normaliseRole(actorRole) !== 'beheerder') {
    throw new Error('Alleen beheerders kunnen klanten aanmaken.');
  }

  const trimmedName = typeof name === 'string' ? name.trim() : '';
  if (!trimmedName) {
    throw new Error('Klantnaam is verplicht.');
  }

  const store = ensureStore();
  if (!Array.isArray(store.customers)) {
    store.customers = buildDefaultCustomers();
  }

  if (findCustomerByName(store.customers, trimmedName)) {
    throw new Error('Klant bestaat al.');
  }

  const customerId = generateCustomerId(store.customers, trimmedName);
  const fleetId = generateFleetId(store.customers);
  const now = new Date().toISOString();
  const newCustomer = {
    id: customerId,
    name: trimmedName,
    createdAt: now,
    updatedAt: now,
    createdByRole: 'Beheerder',
    createdByProfileId: createdByProfileId ?? null,
    primaryFleetId: fleetId,
    fleetIds: [fleetId],
    userIds: [],
    locations: []
  };

  store.customers.push(newCustomer);

  if (linkedUserId) {
    linkCustomerUserInternal(store, newCustomer, linkedUserId);
  }

  persistStore();

  return cloneCustomer(newCustomer);
}

export async function linkCustomerUser({ customerId, userId, actorRole } = {}) {
  if (normaliseRole(actorRole) !== 'beheerder') {
    throw new Error('Alleen beheerders kunnen klantgebruikers koppelen.');
  }

  if (!customerId || !userId) {
    throw new Error('Klant en gebruiker zijn verplicht.');
  }

  const store = ensureStore();
  if (!Array.isArray(store.customers)) {
    store.customers = buildDefaultCustomers();
  }

  const customer = findCustomerById(store.customers, customerId);
  if (!customer) {
    throw new Error('Klant niet gevonden.');
  }

  const { user } = linkCustomerUserInternal(store, customer, userId);
  persistStore();

  return { customer: cloneCustomer(customer), user: { ...user } };
}

export async function createCustomerLocation({
  customerId,
  name,
  actorRole,
  actorCustomerId
} = {}) {
  if (!customerId) {
    throw new Error('Klant is verplicht.');
  }

  const role = normaliseRole(actorRole);
  if (role !== 'beheerder' && role !== 'klant') {
    throw new Error('Onbekende actorrol voor locatiebeheer.');
  }

  const store = ensureStore();
  if (!Array.isArray(store.customers)) {
    store.customers = buildDefaultCustomers();
  }

  const customer = findCustomerById(store.customers, customerId);
  if (!customer) {
    throw new Error('Klant niet gevonden.');
  }

  if (role === 'klant' && actorCustomerId && actorCustomerId !== customer.id) {
    throw new Error('Klant kan alleen eigen locaties beheren.');
  }

  const displayName = buildLocationDisplayName(customer, name);
  if (!displayName) {
    throw new Error('Locatienaam is verplicht.');
  }

  const existingLocation = (customer.locations || []).find(
    entry => entry.displayName?.toLowerCase() === displayName.toLowerCase()
  );
  if (existingLocation) {
    throw new Error('Locatie bestaat al voor deze klant.');
  }

  const now = new Date().toISOString();
  const shortName = deriveSubLocation(displayName, customer.name) || displayName;
  const location = {
    id: generateLocationId(customer, displayName),
    name: shortName,
    displayName,
    createdAt: now,
    updatedAt: now,
    createdByRole: role === 'beheerder' ? 'Beheerder' : 'Klant'
  };

  if (!Array.isArray(customer.locations)) {
    customer.locations = [];
  }
  customer.locations.push(location);
  customer.updatedAt = now;

  setLocations([...LOCATIONS, displayName]);
  persistStore();

  return cloneCustomerLocation(location);
}

export async function addMachineToCustomerLocation({
  customerId,
  locationId,
  machine = {},
  actorRole,
  actorCustomerId
} = {}) {
  if (!customerId || !locationId) {
    throw new Error('Klant en locatie zijn verplicht.');
  }

  const role = normaliseRole(actorRole);
  if (role !== 'beheerder' && role !== 'klant') {
    throw new Error('Onbekende actorrol voor machinebeheer.');
  }

  const store = ensureStore();
  if (!Array.isArray(store.customers)) {
    store.customers = buildDefaultCustomers();
  }

  const context = findCustomerLocation(store.customers, locationId);
  if (!context || context.customer.id !== customerId) {
    throw new Error('Locatie hoort niet bij de geselecteerde klant.');
  }

  const { customer, location } = context;
  if (role === 'klant' && actorCustomerId && actorCustomerId !== customer.id) {
    throw new Error('Klant kan alleen machines voor eigen locaties beheren.');
  }

  const model = typeof machine.model === 'string' && machine.model.trim() ? machine.model.trim() : null;
  if (!model) {
    throw new Error('Model is verplicht voor een machine.');
  }

  let machineId = typeof machine.id === 'string' ? machine.id.trim() : '';
  if (machineId) {
    if (isMachineIdUsed(machineId)) {
      throw new Error('Machine-ID is al in gebruik.');
    }
  } else {
    machineId = generateMachineId(customer);
  }

  const fleetId = ensureCustomerFleetId(store, customer);
  const now = new Date().toISOString();
  const hoursDate = machine.hoursDate || now.slice(0, 10);
  const reference = machine.reference || machine.ref || `${model} ${location.name}`;
  const fleetName = customer.name;

  const rawMachine = {
    id: machineId,
    ref: reference,
    model,
    modelType: machine.modelType || 'Onbekend',
    bmwStatus: machine.bmwStatus || 'Goedgekeurd',
    bmwExpiry: machine.bmwExpiry || null,
    hours: typeof machine.hours === 'number' ? machine.hours : 0,
    hoursDate,
    location: location.displayName,
    customer: {
      name: customer.name,
      subLocation: location.name
    },
    fleetId,
    fleetName,
    activity: [],
    maintenanceHistory: [],
    bmwt: machine.bmwt || { status: 'Goedgekeurd', expiry: null },
    documents: [],
    contract:
      machine.contract ||
      {
        nummer: '—',
        start: null,
        eind: null,
        uren: null,
        type: '—',
        model
      },
    active: machine.active ?? true
  };

  setFleet([...FLEET, rawMachine]);
  const created = getFleetById(machineId);
  customer.updatedAt = now;
  persistStore();

  return cloneFleetItem(created);
}
