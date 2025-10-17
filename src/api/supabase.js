import { LOCATIONS, FLEET, USERS } from '../data.js';

const TEST_CREDENTIALS = {
  password: 'test',
  aliases: ['test', 'test@example.com', 'test@motrac.nl', 'test@test.nl']
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

let currentSession = null;
const authListeners = new Set();

function cloneLocations() {
  return [...LOCATIONS];
}

function cloneFleetItem(item) {
  return {
    ...item,
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

function cloneAccountRequest(request) {
  return { ...request };
}

const accountRequests = [
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

function resolveFleetName(fleetId) {
  if (!fleetId) return null;
  const fleet = FLEET.find(item => item.fleetId === fleetId);
  return fleet?.fleetName ?? null;
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

function generateRequestId() {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `REQ-${random}`;
}

function findAccountRequest(id) {
  return accountRequests.find(request => request.id === id) || null;
}

export async function getCurrentSession() {
  return { session: currentSession };
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

function createSession() {
  const now = new Date().toISOString();
  TEST_PROFILE.last_sign_in_at = now;
  return {
    access_token: 'local-session-token',
    token_type: 'bearer',
    expires_in: 60 * 60 * 4,
    user: {
      id: TEST_PROFILE.auth_user_id,
      email: TEST_PROFILE.email,
      user_metadata: {
        full_name: TEST_PROFILE.display_name
      }
    },
    created_at: now
  };
}

function matchesTestCredentials(value) {
  if (!value) return false;
  const lowered = value.toLowerCase();
  return TEST_CREDENTIALS.aliases.some(alias => alias.toLowerCase() === lowered);
}

export async function signInWithPassword({ email, password }) {
  if (matchesTestCredentials(email) && password === TEST_CREDENTIALS.password) {
    currentSession = createSession();
    emitAuthEvent('SIGNED_IN', currentSession);
    return { session: currentSession, user: currentSession.user };
  }

  const error = new Error('Invalid login credentials');
  error.status = 400;
  throw error;
}

export async function signOut() {
  if (currentSession) {
    currentSession = null;
    emitAuthEvent('SIGNED_OUT', null);
  }
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
  return accountRequests.map(cloneAccountRequest);
}

export async function fetchProfileByAuthUserId(authUserId) {
  if (!authUserId) return null;
  if (authUserId === TEST_PROFILE.auth_user_id) {
    return { ...TEST_PROFILE };
  }
  return null;
}

export async function touchProfileSignIn() {
  TEST_PROFILE.last_sign_in_at = new Date().toISOString();
}

export async function fetchFleetMemberships(profileId) {
  if (!profileId) return [];
  if (profileId === TEST_PROFILE.id) {
    return [];
  }
  return [];
}

function upsertAccountRequest(request) {
  const existingIndex = accountRequests.findIndex(item => item.id === request.id);
  if (existingIndex === -1) {
    accountRequests.unshift(request);
  } else {
    accountRequests[existingIndex] = request;
  }
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
  const existing = findAccountRequest(id);
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
  const existing = findAccountRequest(id);
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
