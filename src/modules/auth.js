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
  signInWithPersona,
  signOut as storageSignOut,
  touchProfileSignIn
} from '../api/browserStorage.js';
import { setFleet, setLocations, setUsers, resetToDefaults } from '../data.js';
import { state } from '../state.js';
import { $ } from '../utils.js';
import { populateLocationFilters, renderFleet, setFleetLoading } from './fleet.js';
import { renderActivity } from './activity.js';
import { renderUsers } from './users.js';
import { applyEnvironmentForRole } from './tabs.js';
import { setMainTab } from './navigation.js';
import { showToast } from './ui/toast.js';
import { showGlobalLoading, hideGlobalLoading } from './ui/loading.js';
import { resolveEnvironment } from '../environment.js';
import { TAB_LABELS } from './tabConfig.js';
import { applyFiltersFromUrl } from './filterSync.js';

const DEFAULT_LOGIN_EMAIL = 'test@motrac.nl';
const DEFAULT_LOGIN_PASSWORD = 'test';
const LOCATION_STORAGE_KEY = 'motrac:lastLocation';
const USER_STATUS_CLASSES = {
  active: 'user-status-indicator--active',
  pending: 'user-status-indicator--pending',
  signedOut: 'user-status-indicator--signed-out'
};

const USER_STATUS_CLASS_LIST = Object.values(USER_STATUS_CLASSES);

/**
 * Hard-coded personas that simulate the available roles within the prototype.
 */
const TEST_ACCOUNTS = [
  {
    email: 'test@motrac.nl',
    role: 'Beheerder',
    displayName: 'Testbeheerder',
    fleetIds: null,
    defaultLocation: 'Alle locaties'
  },
  {
    email: 'gebruiker@motrac.nl',
    role: 'Gebruiker',
    displayName: 'Interne gebruiker',
    fleetIds: null,
    defaultLocation: 'Alle locaties'
  },
  {
    email: 'vloot@motrac.nl',
    role: 'Vlootbeheerder',
    displayName: 'Vlootbeheer',
    fleetIds: ['CF-DEMO'],
    defaultLocation: 'Demovloot Motrac – Almere'
  },
  {
    email: 'klant@motrac.nl',
    role: 'Klant',
    displayName: 'Van Dijk Logistics',
    fleetIds: ['CF-VANDIJK'],
    defaultLocation: 'Van Dijk Logistics – Rotterdam'
  }
];

const ACCOUNT_LOOKUP = new Map(
  TEST_ACCOUNTS.map(account => [normaliseEmail(account.email), account])
);

/**
 * Normalises e-mail input to ensure case-insensitive matching.
 */
function normaliseEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

/**
 * Looks up the configured prototype account for the supplied email address.
 */
function findAccountByEmail(email) {
  const normalised = normaliseEmail(email);
  return ACCOUNT_LOOKUP.get(normalised) || null;
}

/**
 * Updates the UI status label under the login form.
 */
function setLoginStatus(message = '') {
  const statusEl = $('#loginStatus');
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.classList.toggle('hidden', !message);
  if (message) {
    statusEl.setAttribute('role', 'status');
    statusEl.setAttribute('aria-live', 'polite');
  } else {
    statusEl.removeAttribute('role');
    statusEl.removeAttribute('aria-live');
  }
}

/**
 * Shows an inline validation message below the login form.
 */
function setLoginError(message = '') {
  const errorEl = $('#loginError');
  if (!errorEl) return;
  errorEl.textContent = message;
  errorEl.classList.toggle('hidden', !message);
}

/**
 * Enables or disables the login form controls during async work.
 */
function setLoginFormDisabled(disabled) {
  const controls = ['#loginEmail', '#loginPassword', '#loginSubmit'].map(selector => $(selector));
  controls.forEach(control => {
    if (control) {
      control.disabled = disabled;
    }
  });

  document.querySelectorAll('[data-persona-login]').forEach(button => {
    button.disabled = disabled;
    if (disabled) {
      button.setAttribute('aria-disabled', 'true');
    } else {
      button.removeAttribute('aria-disabled');
    }
  });

  const loginForm = $('#loginForm');
  if (loginForm) {
    loginForm.setAttribute('aria-busy', disabled ? 'true' : 'false');
  }

  const defaultLabel = $('#loginSubmitDefault');
  const loadingLabel = $('#loginSubmitLoading');
  if (defaultLabel && loadingLabel) {
    defaultLabel.classList.toggle('hidden', disabled);
    loadingLabel.classList.toggle('hidden', !disabled);
  }
}

/**
 * Resets the app state and shows the login screen.
 */
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
  if (!emailInput) {
    const firstPersonaButton = document.querySelector('[data-persona-login]');
    firstPersonaButton?.focus?.();
  }
}

/**
 * Reveals the application shell after a successful login.
 */
export function showAppShell() {
  $('#app')?.classList.remove('hidden');
  $('#loginPage')?.classList.add('hidden');
}

/**
 * Handles submission of the login form and validates credentials and role.
 */
export async function handleLoginSubmit(event) {
  event.preventDefault();

  const emailInput = $('#loginEmail');
  const passwordInput = $('#loginPassword');
  const email = emailInput ? emailInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value : '';

  if (!email || !password) {
    setLoginError('Vul zowel e-mailadres als wachtwoord in.');
    return;
  }

  const account = findAccountByEmail(email);
  if (!account) {
    setLoginError('Dit e-mailadres heeft geen toegang tot het portaal.');
    return;
  }

  setLoginError('');
  setLoginStatus('Bezig met inloggen…');
  setLoginFormDisabled(true);

  try {
    const result = await signInWithPassword({ email, password });
    const session = result?.session ?? result?.data?.session ?? null;

    if (!session) {
      throw new Error('SessionMissing');
    }

    await handleAuthenticatedSession(session, { forceReload: true });
  } catch (error) {
    console.error('Inloggen mislukt', error);
    const message =
      error?.message === 'Invalid login credentials'
        ? 'Onjuiste inloggegevens. Controleer e-mailadres en wachtwoord.'
        : 'Inloggen mislukt. Probeer het opnieuw.';
    setLoginError(message);
    showToast(message, { variant: 'error' });
    setLoginStatus('');
    setLoginFormDisabled(false);
  }
}

export async function handlePersonaLogin(event) {
  event?.preventDefault?.();

  const trigger = event?.currentTarget || event?.target?.closest?.('[data-persona-login]');
  const personaEmail = trigger?.dataset?.email || trigger?.dataset?.personaEmail || '';
  if (!personaEmail) {
    return;
  }

  const account = findAccountByEmail(personaEmail);
  if (!account) {
    const message = 'Deze demo-gebruiker is niet beschikbaar.';
    setLoginError(message);
    showToast(message, { variant: 'error' });
    return;
  }

  const emailInput = $('#loginEmail');
  if (emailInput) {
    emailInput.value = account.email;
  }
  const passwordInput = $('#loginPassword');
  if (passwordInput) {
    passwordInput.value = DEFAULT_LOGIN_PASSWORD;
  }

  setLoginError('');
  setLoginStatus(`Inloggen als ${account.displayName || account.email}…`);
  setLoginFormDisabled(true);

  try {
    const result = await signInWithPersona(account.email);
    const session = result?.session ?? result?.data?.session ?? null;

    if (!session) {
      throw new Error('SessionMissing');
    }

    await handleAuthenticatedSession(session, { forceReload: true });
  } catch (error) {
    console.error('Snelle login mislukt', error);
    const message = 'Kon niet inloggen met deze demo-gebruiker.';
    setLoginError(message);
    showToast(message, { variant: 'error' });
    setLoginStatus('');
    setLoginFormDisabled(false);
  }
}

/**
 * Returns the stored location preference from localStorage.
 */
function getStoredLocationPreference() {
  try {
    return localStorage.getItem(LOCATION_STORAGE_KEY);
  } catch (error) {
    console.warn('Kon locatievoorkeur niet lezen.', error);
    return null;
  }
}

/**
 * Stores the preferred location so it can be restored on next login.
 */
function setStoredLocationPreference(location) {
  try {
    if (location) {
      localStorage.setItem(LOCATION_STORAGE_KEY, location);
    } else {
      localStorage.removeItem(LOCATION_STORAGE_KEY);
    }
  } catch (error) {
    console.warn('Kon locatievoorkeur niet opslaan.', error);
  }
}

function updateUserButtonAccessibility(displayName, environment) {
  const userBtn = $('#userBtn');
  if (!userBtn) return;

  const safeName = typeof displayName === 'string' && displayName.trim() ? displayName.trim() : 'Niet ingelogd';
  const environmentLabel = typeof environment?.label === 'string' && environment.label.trim()
    ? environment.label.trim()
    : '';

  const ariaParts = ['Accountmenu', safeName];
  if (environmentLabel) {
    ariaParts.push(environmentLabel);
  }

  userBtn.setAttribute('aria-label', ariaParts.join(', '));
  if (environmentLabel) {
    userBtn.title = `${safeName} • ${environmentLabel}`;
  } else {
    userBtn.title = safeName;
  }
}

function applyUserStatusIndicator(environment, displayName) {
  const indicator = $('#userStatusIndicator');
  if (indicator) {
    indicator.classList.remove(...USER_STATUS_CLASS_LIST);
    let className = USER_STATUS_CLASSES.signedOut;
    if (environment) {
      className = environment.key === 'pending' ? USER_STATUS_CLASSES.pending : USER_STATUS_CLASSES.active;
    }
    indicator.classList.add(className);
    const statusValue = environment?.key || 'signed-out';
    if (indicator.dataset) {
      indicator.dataset.status = statusValue;
    } else {
      indicator.setAttribute?.('data-status', statusValue);
    }
    indicator.title = environment?.label || 'Niet ingelogd';
  }

  updateUserButtonAccessibility(displayName, environment);
}

/**
 * Merges the Supabase profile with the prototype persona information.
 */
function mergeProfileWithAccount(profile, session) {
  const account = findAccountByEmail(profile?.email || session?.user?.email);
  if (!account) {
    return { profile, account: null, fleetAccess: null };
  }

  const mergedProfile = {
    ...(profile || {}),
    email: account.email,
    display_name: account.displayName || profile?.display_name || account.email,
    role: account.role,
    default_location_name: account.defaultLocation || profile?.default_location_name || 'Alle locaties'
  };

  const fleetAccess = Array.isArray(account.fleetIds) ? new Set(account.fleetIds) : null;

  return {
    profile: mergedProfile,
    account,
    fleetAccess
  };
}

/**
 * Ensures the state is reset when there is no active session.
 */
function resetState() {
  state.session = null;
  state.profile = null;
  state.accountContext = null;
  state.hasLoadedInitialData = false;
  state.accessibleFleetIds = null;
  resetToDefaults();
  state.fleetFilter.location = 'Alle locaties';
  state.fleetFilter.query = '';
  state.activityFilter.status = 'all';
  state.selectedTruckId = null;
  state.usersPage = 1;
  state.usersPageSize = 10;
  state.usersSearchQuery = '';
  state.editUserId = null;
  state.allowedTabs = [];
  state.activeEnvironmentKey = 'pending';
  state.activeTab = null;
  setMainTab(null);
  const currentUserName = $('#currentUserName');
  if (currentUserName) {
    currentUserName.textContent = 'Niet ingelogd';
  }
  const userMenuName = $('#userMenuName');
  if (userMenuName) {
    userMenuName.textContent = 'Niet ingelogd';
  }
  const userMenuEmail = $('#userMenuEmail');
  if (userMenuEmail) {
    userMenuEmail.textContent = '';
  }
  applyUserStatusIndicator(null, 'Niet ingelogd');
  showLoginPage();
}

/**
 * Applies persona information and loads data when the session changes.
 */
export async function handleAuthenticatedSession(session, { forceReload = false } = {}) {
  const nextToken = session?.access_token ?? null;
  const sessionUserId =
    typeof session?.user?.id === 'string' ? session.user.id.trim() : '';

  if (!session || !sessionUserId) {
    resetState();
    return;
  }

  const currentToken = state.session?.access_token ?? null;

  if ((!forceReload || state.hasLoadedInitialData) && currentToken === nextToken) {
    return;
  }

  state.session = session;

  setLoginStatus('Gegevens worden geladen…');

  let profile = state.profile;
  const shouldFetchProfile =
    forceReload || !profile || profile?.auth_user_id !== sessionUserId;

  if (shouldFetchProfile) {
    try {
      profile = await fetchProfileByAuthUserId(sessionUserId);
    } catch (error) {
      console.error('Kon profielgegevens niet laden', error);
    }
  }

  const { profile: mergedProfile, account, fleetAccess } = mergeProfileWithAccount(profile, session);
  if (!account) {
    setLoginError('Uw account is niet geconfigureerd voor dit prototype.');
    showToast('Account niet herkend. Neem contact op met Motrac.', { variant: 'error' });
    try {
      await storageSignOut();
    } catch (signOutError) {
      console.warn('Kon sessie niet sluiten voor onbekend account.', signOutError);
    }
    resetState();
    return;
  }

  state.profile = mergedProfile ?? null;
  state.accountContext = account;
  state.accessibleFleetIds = fleetAccess;

  const displayName =
    mergedProfile?.display_name || session.user.user_metadata?.full_name || session.user.email || 'Ingelogde gebruiker';
  const currentUserName = $('#currentUserName');
  if (currentUserName) {
    currentUserName.textContent = displayName;
  }
  const userMenuName = $('#userMenuName');
  if (userMenuName) {
    userMenuName.textContent = displayName;
  }
  const userMenuEmail = $('#userMenuEmail');
  if (userMenuEmail) {
    userMenuEmail.textContent = mergedProfile?.email || session.user.email || '';
  }

  if (forceReload) {
    try {
      await touchProfileSignIn();
    } catch (rpcError) {
      console.warn('Kon laatste inlogmoment niet bijwerken', rpcError);
    }
  }

  const shouldReloadData = forceReload || !state.hasLoadedInitialData;
  let initialDataLoaded = true;
  let displayedGlobalLoader = false;
  if (shouldReloadData) {
    setFleetLoading(true);
    showGlobalLoading('Data wordt geladen…');
    displayedGlobalLoader = true;
    try {
      await loadInitialData(mergedProfile, fleetAccess);
    } catch (error) {
      console.error('Kon data niet laden', error);
      setLoginError('Er ging iets mis bij het laden van de gegevens. Probeer het later opnieuw.');
      setLoginStatus('');
      setLoginFormDisabled(false);
      initialDataLoaded = false;
    } finally {
      setFleetLoading(false);
      if (displayedGlobalLoader) {
        hideGlobalLoading();
        displayedGlobalLoader = false;
      }
    }

    if (!initialDataLoaded) {
      return;
    }
  }

  const storedLocation = getStoredLocationPreference();
  if (storedLocation) {
    state.fleetFilter.location = storedLocation;
  } else if (account?.defaultLocation) {
    state.fleetFilter.location = account.defaultLocation;
  }

  if (!state.activeTab) {
    state.activeTab = 'vloot';
  }

  const environment = resolveEnvironment(mergedProfile?.role);

  applyEnvironmentForRole(mergedProfile?.role);
  applyUserStatusIndicator(environment, displayName);
  const allowedTabs = Array.isArray(state.allowedTabs) ? state.allowedTabs : [];
  if (forceReload) {
    const readableTabs = allowedTabs.length
      ? allowedTabs.map(tab => TAB_LABELS[tab] || tab).join(', ')
      : 'geen modules';
    showToast(`Ingelogd als ${environment.label}. Beschikbare onderdelen: ${readableTabs}.`);
  }

  if (allowedTabs.includes('vloot')) {
    populateLocationFilters();
  }

  applyFiltersFromUrl();

  if (allowedTabs.includes('vloot')) {
    renderFleet();
  }
  if (allowedTabs.includes('activiteit')) {
    renderActivity();
  }
  if (allowedTabs.includes('users')) {
    renderUsers();
  }

  showAppShell();
  setLoginStatus('');
  setLoginError('');
  setLoginFormDisabled(false);
  const passwordInput = $('#loginPassword');
  if (passwordInput) {
    passwordInput.value = '';
  }
}

/**
 * Initialises authentication listeners on application start.
 */
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
    console.error('Kon lokale auth-listener niet initialiseren', listenerError);
    return;
  }

  window.addEventListener('beforeunload', () => {
    listener?.subscription?.unsubscribe?.();
  });
}

/**
 * Signs the user out and resets the local state.
 */
export async function signOut() {
  try {
    await storageSignOut();
    showToast('Uitgelogd');
  } catch (error) {
    console.error('Uitloggen mislukt', error);
    showToast('Uitloggen mislukt. Probeer opnieuw.', { variant: 'error' });
  } finally {
    resetState();
  }
}

/**
 * Persists initial datasets for the active persona and resolves fleet access.
 */
async function loadInitialData(profile, fleetAccess) {
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
    console.error('Kon locaties niet laden vanuit browseropslag.', locationsResult.reason);
    hadError = true;
  }

  if (fleetResult.status === 'fulfilled') {
    setFleet(fleetResult.value);
  } else {
    console.error('Kon vloot niet laden vanuit browseropslag.', fleetResult.reason);
    hadError = true;
  }

  if (usersResult.status === 'fulfilled') {
    setUsers(usersResult.value);
  } else {
    console.error('Kon gebruikers niet laden vanuit browseropslag.', usersResult.reason);
    hadError = true;
  }

  const unrestricted = role === 'Beheerder' || role === 'Gebruiker';
  let accessibleFleetIds = unrestricted ? null : new Set();

  if (fleetAccess instanceof Set) {
    accessibleFleetIds = fleetAccess;
  }

  if (membershipsResult.status === 'fulfilled') {
    const memberships = membershipsResult.value || [];
    if (!unrestricted && accessibleFleetIds instanceof Set) {
      memberships
        .map(item => item?.fleetId)
        .filter(Boolean)
        .forEach(fleetId => accessibleFleetIds.add(fleetId));
    }
  } else {
    console.error('Kon vloottoegang niet laden vanuit browseropslag.', membershipsResult.reason);
    hadError = true;
  }

  state.accessibleFleetIds = unrestricted ? null : accessibleFleetIds;

  if (accountRequestsResult.status === 'fulfilled') {
    state.accountRequests = Array.isArray(accountRequestsResult.value) ? accountRequestsResult.value : [];
  } else {
    state.accountRequests = [];
    if (shouldFetchAccountRequests) {
      console.error('Kon accountaanvragen niet laden vanuit browseropslag.', accountRequestsResult.reason);
      hadError = true;
    }
  }

  if (hadError) {
    showToast('Live data niet beschikbaar – voorbeelddata worden gebruikt.', { variant: 'warning' });
  }

  setStoredLocationPreference(state.fleetFilter.location);
  state.hasLoadedInitialData = true;
}
