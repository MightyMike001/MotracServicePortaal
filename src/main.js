import { FLEET, USERS, setFleet, setLocations, setUsers, resetToDefaults } from './data.js';
import { state } from './state.js';
import { $, $$, fmtDate, showToast, openModal, closeModals, kv, formatOdoLabel } from './utils.js';
import { populateLocationFilters, renderFleet } from './modules/fleet.js';
import { renderActivity } from './modules/activity.js';
import { renderUsers } from './modules/users.js';
import { openDetail, setDetailTab } from './modules/detail.js';
import { canViewFleetAsset } from './modules/access.js';
import { setMainTab } from './modules/navigation.js';
import {
  fetchFleet,
  fetchLocations,
  fetchUsers,
  fetchProfileByAuthUserId,
  fetchFleetMemberships,
  getCurrentSession,
  onAuthStateChange,
  signInWithPassword,
  signOut as supabaseSignOut,
  touchProfileSignIn
} from './api/supabase.js';

function wireEvents() {
  if (state.eventsWired) return;
  state.eventsWired = true;

  function closeKebabMenus(except = null) {
    $$('.kebab-menu').forEach(menu => {
      if (menu !== except) {
        menu.classList.add('hidden');
      }
    });
  }

  $('#userBtn').addEventListener('click', () => $('#userMenu').classList.toggle('hidden'));
  $('#cancelUserMenu').addEventListener('click', () => $('#userMenu').classList.add('hidden'));
  document.addEventListener('click', event => {
    if (!event.target.closest('#userBtn') && !event.target.closest('#userMenu')) {
      $('#userMenu').classList.add('hidden');
    }
  });
  $('#logoutBtn').addEventListener('click', async () => {
    try {
      await supabaseSignOut();
      showToast('Uitgelogd');
    } catch (error) {
      console.error('Uitloggen mislukt', error);
      showToast('Uitloggen mislukt. Probeer opnieuw.');
    }
  });

  const loginForm = $('#loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLoginSubmit);
  }

  $$('#mainTabs button').forEach(button => button.addEventListener('click', () => setMainTab(button.dataset.tab)));

  $('#locationFilter').addEventListener('change', event => {
    state.fleetFilter.location = event.target.value;
    renderFleet();
  });
  const applyFleetSearch = () => {
    state.fleetFilter.query = $('#searchInput').value;
    renderFleet();
  };

  $('#searchBtn').addEventListener('click', applyFleetSearch);
  $('#searchInput').addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      applyFleetSearch();
    }
  });

  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-open-detail]');
    if (trigger) {
      openDetail(trigger.dataset.openDetail);
    }
  });

  document.addEventListener('click', event => {
    const button = event.target.closest('.kebab > button');
    if (button) {
      const menu = button.parentElement.querySelector('.kebab-menu');
      const shouldShow = menu && menu.classList.contains('hidden');
      closeKebabMenus(menu);
      if (menu && shouldShow) {
        menu.classList.remove('hidden');
      }
      return;
    }

    if (!event.target.closest('.kebab-menu')) {
      closeKebabMenus();
    }
  });

  document.addEventListener('click', event => {
    const actionButton = event.target.closest('[data-action]');
    if (!actionButton) return;

    closeKebabMenus();

    const action = actionButton.dataset.action;
    const id = actionButton.dataset.id || state.selectedTruckId;
    const truck = FLEET.find(item => item.id === id);
    if (!truck || !canViewFleetAsset(truck)) return;

    if (action === 'newTicket' || action === 'newTicketFromDetail') {
      $('#ticketTruck').value = truck.id;
      openModal('#modalTicket');
      return;
    }

    if (action === 'updateOdo' || action === 'updateOdoFromDetail') {
      $('#odoCurrent').textContent = formatOdoLabel(truck.odo, truck.odoDate);
      $('#odoNew').value = '';
      $('#odoSave').dataset.id = id;
      openModal('#modalOdo');
      return;
    }

    if (action === 'editRef' || action === 'editRefFromDetail') {
      $('#refCurrent').textContent = truck.ref;
      $('#refNew').value = truck.ref;
      $('#refSave').dataset.id = id;
      openModal('#modalRef');
      return;
    }

    if (action === 'showContract') {
      const contract = truck.contract;
      $('#contractBody').innerHTML = `
        ${kv('Contractnummer', contract.nummer)}
        ${kv('Start datum', fmtDate(contract.start))}
        ${kv('Eind datum', fmtDate(contract.eind))}
        ${kv('Uren per jaar', contract.uren)}
        ${kv('Contract type', contract.type)}
        ${kv('Model', contract.model)}
      `;
      openModal('#modalContract');
      return;
    }

    if (action === 'inactive') {
      $('#inactiveDate').valueAsDate = new Date();
      $('#inactiveConfirm').dataset.id = id;
      openModal('#modalInactive');
    }
  });

  document.querySelectorAll('.modal [data-close]').forEach(button => button.addEventListener('click', closeModals));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeModals();
  });

  $('#btnNewTicket').addEventListener('click', () => openModal('#modalTicket'));
  $('#ticketCreate').addEventListener('click', () => {
    const id = $('#ticketTruck').value;
    const type = $('#ticketType').value;
    const desc = $('#ticketDesc').value.trim();
    if (!id || !desc) {
      showToast('Vul minimaal truck en omschrijving in.');
      return;
    }

    const truck = FLEET.find(item => item.id === id);
    if (!truck || !canViewFleetAsset(truck)) {
      showToast('U heeft geen toegang tot dit object.');
      return;
    }
    truck.activity.push({
      id: `M-${Math.floor(1000 + Math.random() * 9000)}`,
      type,
      desc,
      status: 'Open',
      date: new Date().toISOString()
    });

    closeModals();
    renderFleet();
    renderActivity();
    setMainTab('activiteit');
    showToast('Servicemelding aangemaakt.');

    $('#ticketOrder').value = '';
    $('#ticketDesc').value = '';
    $('#ticketPhotos').value = '';
  });

  $('#odoSave').addEventListener('click', event => {
    const id = event.target.dataset.id;
    const truck = FLEET.find(item => item.id === id);
    if (!truck || !canViewFleetAsset(truck)) {
      showToast('U heeft geen toegang tot dit object.');
      return;
    }
    const value = parseInt($('#odoNew').value, 10);
    const currentOdo = typeof truck.odo === 'number' && Number.isFinite(truck.odo) ? truck.odo : null;
    if (Number.isNaN(value) || value < 0 || (currentOdo !== null && value < currentOdo)) {
      showToast('Nieuwe tellerstand moet ≥ huidige zijn.');
      return;
    }
    truck.odo = value;
    truck.odoDate = new Date().toISOString();
    closeModals();
    renderFleet();
    setDetailTab('info');
    showToast('Tellerstand bijgewerkt.');
  });

  $('#refSave').addEventListener('click', event => {
    const id = event.target.dataset.id;
    const truck = FLEET.find(item => item.id === id);
    if (!truck || !canViewFleetAsset(truck)) {
      showToast('U heeft geen toegang tot dit object.');
      return;
    }
    const value = $('#refNew').value.trim();
    if (!value) {
      showToast('Referentie mag niet leeg zijn.');
      return;
    }
    truck.ref = value;
    closeModals();
    renderFleet();
    setDetailTab('info');
    showToast('Referentie bijgewerkt.');
  });

  $('#inactiveConfirm').addEventListener('click', event => {
    const id = event.target.dataset.id;
    const date = $('#inactiveDate').value;
    const reason = $('#inactiveReason').value.trim();
    if (!date || !reason) {
      showToast('Datum en reden zijn verplicht.');
      return;
    }
    const truck = FLEET.find(item => item.id === id);
    if (!truck || !canViewFleetAsset(truck)) {
      showToast('U heeft geen toegang tot dit object.');
      return;
    }
    truck.active = false;
    closeModals();
    renderFleet();
    renderActivity();
    showToast('Truck gemarkeerd als inactief.');
  });

  $('#activityLocationFilter').addEventListener('change', renderActivity);
  const applyActivitySearch = () => {
    renderActivity();
  };

  $('#activitySearchBtn').addEventListener('click', applyActivitySearch);
  $('#activitySearchInput').addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      applyActivitySearch();
    }
  });

  $('#btnAddUser').addEventListener('click', () => {
    state.editUserId = null;
    $('#userModalTitle').textContent = 'Gebruiker toevoegen';
    $('#userName').value = '';
    $('#userEmail').value = '';
    $('#userPhone').value = '';
    $('#userRole').value = 'Gebruiker';
    openModal('#modalUser');
  });

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-user-action]');
    if (!button) return;

    closeKebabMenus();

    const id = button.dataset.id;
    if (button.dataset.userAction === 'edit') {
      state.editUserId = id;
      const user = USERS.find(item => item.id === id);
      $('#userModalTitle').textContent = 'Gebruiker bewerken';
      $('#userName').value = user.name;
      $('#userEmail').value = user.email;
      $('#userPhone').value = user.phone;
      $('#userLocation').value = user.location;
      $('#userRole').value = user.role;
      openModal('#modalUser');
    } else if (button.dataset.userAction === 'delete') {
      const index = USERS.findIndex(item => item.id === id);
      if (index > -1) {
        USERS.splice(index, 1);
        renderUsers();
        showToast('Gebruiker verwijderd.');
      }
    }
  });

  $('#userSave').addEventListener('click', () => {
    const name = $('#userName').value.trim();
    const email = $('#userEmail').value.trim();
    const phone = $('#userPhone').value.trim();
    const location = $('#userLocation').value;
    const role = $('#userRole').value;

    if (!name || !email) {
      showToast('Naam en e-mail zijn verplicht.');
      return;
    }

    if (state.editUserId) {
      const user = USERS.find(item => item.id === state.editUserId);
      Object.assign(user, { name, email, phone, location, role });
      showToast('Gebruiker bijgewerkt.');
    } else {
      USERS.push({ id: `U${Math.floor(Math.random() * 10000)}`, name, email, phone, location, role });
      showToast('Gebruiker toegevoegd.');
    }

    closeModals();
    renderUsers();
  });

  $('#usersPrev').addEventListener('click', () => {
    if (state.usersPage > 1) {
      state.usersPage -= 1;
      renderUsers();
    }
  });

  $('#usersNext').addEventListener('click', () => {
    state.usersPage += 1;
    renderUsers();
  });

  $('#usersPageSize').addEventListener('change', () => {
    state.usersPage = 1;
    renderUsers();
  });

  $('#backToFleet').addEventListener('click', () => {
    setMainTab('vloot');
  });

  $$('#truckDetail [data-subtab]').forEach(button => button.addEventListener('click', () => setDetailTab(button.dataset.subtab)));
}

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

function showLoginPage() {
  $('#loginPage')?.classList.remove('hidden');
  $('#app')?.classList.add('hidden');
  setLoginStatus('');
  setLoginError('');
  setLoginFormDisabled(false);
  const emailInput = $('#loginEmail');
  if (emailInput) {
    emailInput.focus();
  }
  const passwordInput = $('#loginPassword');
  if (passwordInput) {
    passwordInput.value = '';
  }
}

function showAppShell() {
  $('#app')?.classList.remove('hidden');
  $('#loginPage')?.classList.add('hidden');
}

async function handleLoginSubmit(event) {
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
    await signInWithPassword({ email, password });
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

async function handleAuthenticatedSession(session, { forceReload = false } = {}) {
  const currentToken = state.session?.access_token ?? null;
  const nextToken = session?.access_token ?? null;

  if (!forceReload && currentToken === nextToken) {
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
    $('#currentUserName').textContent = 'Niet ingelogd';
    $('#userMenuName')?.textContent = 'Niet ingelogd';
    $('#userMenuEmail')?.textContent = '';
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
  $('#userMenuName')?.textContent = displayName;
  $('#userMenuEmail')?.textContent = profile?.email || session.user.email || '';

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
  setMainTab('vloot');

  showAppShell();
  setLoginStatus('');
  setLoginError('');
  setLoginFormDisabled(false);
  const passwordInput = $('#loginPassword');
  if (passwordInput) {
    passwordInput.value = '';
  }
}

async function initializeAuth() {
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

async function loadInitialData(profile) {
  const membershipsPromise = profile?.id ? fetchFleetMemberships(profile.id) : Promise.resolve([]);
  const [locationsResult, fleetResult, usersResult, membershipsResult] = await Promise.allSettled([
    fetchLocations(),
    fetchFleet(),
    fetchUsers(),
    membershipsPromise
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

  const role = profile?.role ?? null;
  const unrestricted = !role || role === 'Beheerder' || role === 'Gebruiker';
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

  if (hadError) {
    showToast('Live data niet beschikbaar – voorbeelddata worden gebruikt.');
  }

  state.hasLoadedInitialData = true;
}

document.addEventListener('DOMContentLoaded', async () => {
  wireEvents();
  await initializeAuth();
});
