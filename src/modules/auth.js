import {
  fetchFleet,
  fetchLocations,
  fetchUsers,
  fetchProfileByAuthUserId,
  fetchFleetMemberships,
  fetchAccountRequests,
  getCurrentSession,
  onAuthStateChange,
  signInWithPassword,
  signOut as supabaseSignOut,
  touchProfileSignIn
} from '../api/supabase.js';
import { setFleet, setLocations, setUsers, resetToDefaults } from '../data.js';
import { state } from '../state.js';
import { $, showToast } from '../utils.js';
import { populateLocationFilters, renderFleet } from './fleet.js';
import { renderActivity } from './activity.js';
import { renderUsers } from './users.js';
import { applyEnvironmentForRole } from './tabs.js';
import { setMainTab } from './navigation.js';

const DEFAULT_LOGIN_EMAIL = 'test@motrac.nl';
const DEFAULT_LOGIN_PASSWORD = 'test';

function setLoginStatus(message = '') {
  const statusEl = $('#loginStatus');
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.classList.toggle('hidden', !message);
}

function setLoginError(message = '') {
  const errorEl = $('#loginError');
  if (!errorEl) return;
  errorEl.textContent = message;
  errorEl.classList.toggle('hidden', !message);
}

function setLoginFormDisabled(disabled) {
  const controls = ['#loginEmail', '#loginPassword', '#loginSubmit'].map(selector => $(selector));
  controls.forEach(control => {
    if (control) {
      control.disabled = disabled;
    }
  });

  const defaultLabel = $('#loginSubmitDefault');
  const loadingLabel = $('#loginSubmitLoading');
  if (defaultLabel && loadingLabel) {
    defaultLabel.classList.toggle('hidden', disabled);
    loadingLabel.classList.toggle('hidden', !disabled);
  }
}

export function showLoginPage() {
  $('#loginPage')?.classList.remove('hidden');
  $('#app')?.classList.add('hidden');
  setLoginStatus('');
  setLoginError('');
  setLoginFormDisabled(false);
  const emailInput = $('#loginEmail');
  if (emailInput) {
    emailInput.value = DEFAULT_LOGIN_EMAIL;
    emailInput.focus();
  }
  const passwordInput = $('#loginPassword');
  if (passwordInput) {
    passwordInput.value = DEFAULT_LOGIN_PASSWORD;
  }
}

export function showAppShell() {
  $('#app')?.classList.remove('hidden');
  $('#loginPage')?.classList.add('hidden');
}

export async function handleLoginSubmit(event) {
  event.preventDefault();

  const email = $('#loginEmail')?.value.trim();
  const password = $('#loginPassword')?.value;

  if (!email || !password) {
    setLoginError('Vul zowel e-mailadres als wachtwoord in.');
    return;
  }

  setLoginError('');
  setLoginStatus('Bezig met inloggen…');
  setLoginFormDisabled(true);

  try {
    const result = await signInWithPassword({ email, password });
    const session = result?.session ?? result?.data?.session ?? null;

    if (session) {
      await handleAuthenticatedSession(session, { forceReload: true });
    }
  } catch (error) {
    console.error('Inloggen mislukt', error);
    const message =
      error?.message === 'Invalid login credentials'
        ? 'Onjuiste inloggegevens. Controleer e-mailadres en wachtwoord.'
        : 'Inloggen mislukt. Probeer het opnieuw.';
    setLoginError(message);
    setLoginStatus('');
    setLoginFormDisabled(false);
  }
}

export async function handleAuthenticatedSession(session, { forceReload = false } = {}) {
  const currentToken = state.session?.access_token ?? null;
  const nextToken = session?.access_token ?? null;

  if ((!forceReload || state.hasLoadedInitialData) && currentToken === nextToken) {
    return;
  }

  state.session = session;

  if (!session) {
    state.profile = null;
    state.hasLoadedInitialData = false;
    state.accessibleFleetIds = null;
    resetToDefaults();
    state.fleetFilter.location = 'Alle locaties';
    state.fleetFilter.query = '';
    state.selectedTruckId = null;
    state.usersPage = 1;
    state.usersPageSize = 10;
    state.editUserId = null;
    state.allowedTabs = [];
    state.activeEnvironmentKey = 'pending';
    state.activeTab = null;
    setMainTab(null);
    $('#currentUserName').textContent = 'Niet ingelogd';
    const userMenuName = $('#userMenuName');
    if (userMenuName) {
      userMenuName.textContent = 'Niet ingelogd';
    }
    const userMenuEmail = $('#userMenuEmail');
    if (userMenuEmail) {
      userMenuEmail.textContent = '';
    }
    showLoginPage();
    return;
  }

  setLoginStatus('Gegevens worden geladen…');

  let profile = state.profile;
  const shouldFetchProfile = forceReload || !profile || profile?.auth_user_id !== session.user.id;

  if (shouldFetchProfile) {
    try {
      profile = await fetchProfileByAuthUserId(session.user.id);
    } catch (error) {
      console.error('Kon profielgegevens niet laden', error);
    }
  }

  state.profile = profile ?? null;

  const displayName =
    profile?.display_name || session.user.user_metadata?.full_name || session.user.email || 'Ingelogde gebruiker';
  $('#currentUserName').textContent = displayName;
  const userMenuName = $('#userMenuName');
  if (userMenuName) {
    userMenuName.textContent = displayName;
  }
  const userMenuEmail = $('#userMenuEmail');
  if (userMenuEmail) {
    userMenuEmail.textContent = profile?.email || session.user.email || '';
  }

  if (forceReload) {
    try {
      await touchProfileSignIn();
    } catch (rpcError) {
      console.warn('Kon laatste inlogmoment niet bijwerken', rpcError);
    }
  }

  const shouldReloadData = forceReload || !state.hasLoadedInitialData;
  if (shouldReloadData) {
    try {
      await loadInitialData(profile);
    } catch (error) {
      console.error('Kon data niet laden', error);
      setLoginError('Er ging iets mis bij het laden van de gegevens. Probeer het later opnieuw.');
      setLoginStatus('');
      setLoginFormDisabled(false);
      return;
    }
  }

  populateLocationFilters();
  renderFleet();
  renderActivity();
  renderUsers();
  state.activeTab = 'vloot';
  applyEnvironmentForRole(profile?.role);

  showAppShell();
  setLoginStatus('');
  setLoginError('');
  setLoginFormDisabled(false);
  const passwordInput = $('#loginPassword');
  if (passwordInput) {
    passwordInput.value = '';
  }
}

export async function initializeAuth() {
  try {
    const { session } = await getCurrentSession();
    await handleAuthenticatedSession(session, { forceReload: true });
  } catch (error) {
    console.error('Initieel ophalen van sessie mislukt', error);
    showLoginPage();
  }

  const { data: listener, error: listenerError } = onAuthStateChange(async (event, session) => {
    const shouldForceReload = event === 'SIGNED_IN';
    await handleAuthenticatedSession(session, { forceReload: shouldForceReload });
  });

  if (listenerError) {
    console.error('Kon Supabase auth listener niet initialiseren', listenerError);
    return;
  }

  window.addEventListener('beforeunload', () => {
    listener?.subscription?.unsubscribe?.();
  });
}

export async function signOut() {
  try {
    await supabaseSignOut();
    showToast('Uitgelogd');
  } catch (error) {
    console.error('Uitloggen mislukt', error);
    showToast('Uitloggen mislukt. Probeer opnieuw.');
  }
}

async function loadInitialData(profile) {
  const role = profile?.role ?? null;
  const membershipsPromise = profile?.id ? fetchFleetMemberships(profile.id) : Promise.resolve([]);
  const shouldFetchAccountRequests = role === 'Beheerder';
  const accountRequestsPromise = shouldFetchAccountRequests ? fetchAccountRequests() : Promise.resolve([]);
  const [locationsResult, fleetResult, usersResult, membershipsResult, accountRequestsResult] = await Promise.allSettled([
    fetchLocations(),
    fetchFleet(),
    fetchUsers(),
    membershipsPromise,
    accountRequestsPromise
  ]);

  let hadError = false;

  if (locationsResult.status === 'fulfilled') {
    setLocations(locationsResult.value);
  } else {
    console.error('Kon locaties niet laden vanuit Supabase.', locationsResult.reason);
    hadError = true;
  }

  if (fleetResult.status === 'fulfilled') {
    setFleet(fleetResult.value);
  } else {
    console.error('Kon vloot niet laden vanuit Supabase.', fleetResult.reason);
    hadError = true;
  }

  if (usersResult.status === 'fulfilled') {
    setUsers(usersResult.value);
  } else {
    console.error('Kon gebruikers niet laden vanuit Supabase.', usersResult.reason);
    hadError = true;
  }

  const unrestricted = role === 'Beheerder' || role === 'Gebruiker';
  let accessibleFleetIds = unrestricted ? null : new Set();

  if (membershipsResult.status === 'fulfilled') {
    const memberships = membershipsResult.value || [];
    if (!unrestricted) {
      memberships
        .map(item => item?.fleetId)
        .filter(Boolean)
        .forEach(fleetId => accessibleFleetIds.add(fleetId));
    }
  } else {
    console.error('Kon vloottoegang niet laden vanuit Supabase.', membershipsResult.reason);
    hadError = true;
  }

  state.accessibleFleetIds = unrestricted ? null : accessibleFleetIds;

  if (accountRequestsResult.status === 'fulfilled') {
    state.accountRequests = Array.isArray(accountRequestsResult.value) ? accountRequestsResult.value : [];
  } else {
    state.accountRequests = [];
    if (shouldFetchAccountRequests) {
      console.error('Kon accountaanvragen niet laden vanuit Supabase.', accountRequestsResult.reason);
      hadError = true;
    }
  }

  if (hadError) {
    showToast('Live data niet beschikbaar – voorbeelddata worden gebruikt.');
  }

  state.hasLoadedInitialData = true;
}
