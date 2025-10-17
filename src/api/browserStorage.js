import { LOCATIONS, FLEET, USERS } from '../data.js';

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
    accountRequests: DEFAULT_ACCOUNT_REQUESTS.map(cloneAccountRequest)
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

  return memoryStore;
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
        : DEFAULT_ACCOUNT_REQUESTS.map(cloneAccountRequest)
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
        accountRequests: memoryStore.accountRequests
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

function generateRequestId() {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `REQ-${random}`;
}

function resolveFleetName(fleetId) {
  if (!fleetId) return null;
  const fleet = FLEET.find(item => item.fleetId === fleetId);
  return fleet?.fleetName ?? null;
}

function matchesTestCredentials(value) {
  if (!value) return false;
  const lowered = value.toLowerCase();
  return TEST_CREDENTIALS.aliases.some(alias => alias.toLowerCase() === lowered);
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
    const session = createSession();
    ensureStore().session = session;
    persistStore();
    emitAuthEvent('SIGNED_IN', cloneSession(session));
    return { session: cloneSession(session), user: cloneSession(session)?.user ?? null };
  }

  const error = new Error('Invalid login credentials');
  error.status = 400;
  throw error;
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
