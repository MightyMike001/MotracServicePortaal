const DEFAULT_LOGIN = {
  email: 'test@motrac.nl',
  password: 'test',
  name: 'Testbeheerder',
  role: 'Beheerder'
};

const DEFAULT_LOCATIONS = [
  'Alle locaties',
  'Demovloot Motrac – Almere',
  'Demovloot Motrac – Venlo',
  'Demovloot Motrac – Zwijndrecht',
  'Van Dijk Logistics – Rotterdam'
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
    fleetId: 'CF-DEMO',
    fleetName: 'Motrac Demovloot',
    active: true,
    contract: {
      nummer: 'CTR-2023-ALM-001',
      start: '2023-01-01',
      eind: '2026-12-31',
      uren: 800,
      type: 'Full Service',
      model: 'Linde E16'
    },
    activity: [
      { id: 'M-1001', type: 'Onderhoud', desc: 'Periodieke servicebeurt', status: 'Afgerond', date: '2025-06-20' },
      { id: 'M-1010', type: 'Storing', desc: 'Mast-sensor foutcode', status: 'Open', date: '2025-10-01' }
    ]
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
    fleetId: 'CF-DEMO',
    fleetName: 'Motrac Demovloot',
    active: true,
    contract: {
      nummer: 'CTR-2022-ZWD-019',
      start: '2022-05-15',
      eind: '2025-11-30',
      uren: 1200,
      type: 'PM + Correctief',
      model: 'Linde H25'
    },
    activity: []
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
    fleetId: 'CF-VANDIJK',
    fleetName: 'Van Dijk Logistics',
    active: true,
    contract: {
      nummer: 'CTR-2024-VNL-003',
      start: '2024-02-01',
      eind: '2027-01-31',
      uren: 900,
      type: 'Full Service',
      model: 'Linde E20'
    },
    activity: [
      { id: 'M-1020', type: 'Schade', desc: 'Vork beschadigd', status: 'Open', date: '2025-10-03' }
    ]
  }
];

const DEFAULT_USERS = [
  { id: 'U1', name: 'Test User 2', email: 'test2@example.com', phone: '+31 6 12345678', location: 'Demovloot Motrac – Almere', role: 'Beheerder' },
  { id: 'U2', name: 'Jan Jansen', email: 'jan.jansen@example.com', phone: '+31 6 98765432', location: 'Demovloot Motrac – Venlo', role: 'Gebruiker' },
  { id: 'U3', name: 'Eva Visser', email: 'eva.visser@example.com', phone: '+31 6 45678901', location: 'Demovloot Motrac – Zwijndrecht', role: 'Gebruiker' },
  { id: 'U4', name: 'Kees Bakker', email: 'k.bakker@example.com', phone: '+31 6 33445566', location: 'Demovloot Motrac – Almere', role: 'Gebruiker' },
  { id: 'U5', name: 'Sanne de Boer', email: 's.boer@example.com', phone: '+31 6 11112222', location: 'Demovloot Motrac – Almere', role: 'Beheerder' },
  { id: 'U6', name: 'Ruben Smit', email: 'r.smit@example.com', phone: '+31 6 22223333', location: 'Demovloot Motrac – Venlo', role: 'Gebruiker' },
  { id: 'U7', name: 'Hanna Mulder', email: 'h.mulder@example.com', phone: '+31 6 33334444', location: 'Demovloot Motrac – Zwijndrecht', role: 'Gebruiker' },
  { id: 'U8', name: 'Peter Groen', email: 'p.groen@example.com', phone: '+31 6 44445555', location: 'Demovloot Motrac – Venlo', role: 'Gebruiker' },
  { id: 'U9', name: 'Laura Kok', email: 'l.kok@example.com', phone: '+31 6 55556666', location: 'Demovloot Motrac – Almere', role: 'Gebruiker' },
  { id: 'U10', name: 'William de Vries', email: 'w.vries@example.com', phone: '+31 6 66667777', location: 'Demovloot Motrac – Zwijndrecht', role: 'Gebruiker' },
  { id: 'U11', name: 'Noa Willems', email: 'n.willems@example.com', phone: '+31 6 77778888', location: 'Demovloot Motrac – Almere', role: 'Gebruiker' },
  { id: 'U12', name: 'Anja van Dijk', email: 'a.vandijk@vandijklogistics.nl', phone: '+31 6 88889999', location: 'Van Dijk Logistics – Rotterdam', role: 'Klant' }
];

const DEFAULT_ACCOUNT_REQUESTS = [
  {
    id: 'REQ-1001',
    name: 'Sanne Willems',
    organisation: 'Willems Logistiek',
    email: 'sanne.willems@example.com',
    phone: '+31 6 23456789',
    requestedRole: 'Gebruiker',
    requestNotes: 'Wil toegang tot onderhoudsrapportages.',
    status: 'pending',
    submittedAt: '2025-09-28T08:30:00Z',
    updatedAt: '2025-09-28T08:30:00Z'
  },
  {
    id: 'REQ-1000',
    name: 'Erik de Groot',
    organisation: 'Motrac NL',
    email: 'erik.degroot@motrac.nl',
    phone: '+31 6 11223344',
    requestedRole: 'Vlootbeheerder',
    requestNotes: 'Account nodig voor vlootbeheer.',
    status: 'approved',
    submittedAt: '2025-09-18T13:20:00Z',
    updatedAt: '2025-09-21T10:05:00Z'
  },
  {
    id: 'REQ-0999',
    name: 'Lotte van Rijn',
    organisation: 'Van Dijk Logistics',
    email: 'lotte.vanrijn@vandijklogistics.nl',
    phone: '+31 6 55667788',
    requestedRole: 'Klant',
    requestNotes: 'Alleen inzicht in eigen vloot noodzakelijk.',
    status: 'rejected',
    submittedAt: '2025-09-12T11:05:00Z',
    updatedAt: '2025-09-15T15:45:00Z'
  }
];

const fmtDate = value => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? '—' : date.toLocaleDateString('nl-NL');
};

const formatNumber = value => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toLocaleString('nl-NL');
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return numeric.toLocaleString('nl-NL');
    }
  }
  return '—';
};

const formatHours = (value, date) => {
  const label = formatNumber(value);
  const formattedDate = fmtDate(date);
  return formattedDate === '—' ? label : `${label} <span class="text-xs text-gray-500">(${formattedDate})</span>`;
};

const qs = (selector, scope = document) => scope.querySelector(selector);
const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

const closeAllMenus = () => {
  qsa('.kebab-menu').forEach(menu => menu.classList.add('hidden'));
};

const toggleHidden = (el, force) => {
  if (!el) return;
  el.classList.toggle('hidden', force);
};

const generateId = prefix => `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

function createDataModel() {
  const locations = [...DEFAULT_LOCATIONS];
  const fleet = DEFAULT_FLEET.map(item => ({
    ...item,
    activity: Array.isArray(item.activity) ? item.activity.map(entry => ({ ...entry })) : [],
    openActivityCount: Array.isArray(item.activity)
      ? item.activity.filter(entry => entry?.status === 'Open').length
      : 0
  }));
  const users = DEFAULT_USERS.map(user => ({ ...user }));
  const accountRequests = DEFAULT_ACCOUNT_REQUESTS.map(request => ({ ...request }));

  return {
    locations,
    fleet,
    users,
    accountRequests
  };
}

export function createApp() {
  const data = createDataModel();
  const state = {
    session: null,
    activeTab: 'vloot',
    detailTab: 'info',
    fleetFilter: { location: 'Alle locaties', query: '' },
    selectedTruckId: null,
    usersPage: 1,
    usersPageSize: 10
  };

  const elements = {
    loginPage: qs('#loginPage'),
    appShell: qs('#app'),
    loginForm: qs('#loginForm'),
    loginEmail: qs('#loginEmail'),
    loginPassword: qs('#loginPassword'),
    loginStatus: qs('#loginStatus'),
    loginError: qs('#loginError'),
    loginSubmit: qs('#loginSubmit'),
    loginSubmitDefault: qs('#loginSubmitDefault'),
    loginSubmitLoading: qs('#loginSubmitLoading'),
    userName: qs('#currentUserName'),
    userMenu: qs('#userMenu'),
    userMenuName: qs('#userMenuName'),
    userMenuEmail: qs('#userMenuEmail'),
    environmentNotice: qs('#environmentNotice'),
    environmentName: qs('#environmentName'),
    environmentBadge: qs('#environmentBadge'),
    environmentSummary: qs('#environmentSummary'),
    tabsContainer: qs('#mainTabs'),
    tabPanels: {
      vloot: qs('#tab-vloot'),
      activiteit: qs('#tab-activiteit'),
      users: qs('#tab-users')
    },
    detailSection: qs('#truckDetail'),
    fleetTableBody: qs('#fleetTbody'),
    activityList: qs('#activityList'),
    activityEmpty: qs('#activityEmpty'),
    accountRequestsCard: qs('#accountRequestsCard'),
    accountRequestsEmpty: qs('#accountRequestsEmpty'),
    accountRequestsList: qs('#accountRequestsList'),
    accountRequestsHistoryWrapper: qs('#accountRequestsHistoryWrapper'),
    accountRequestsHistory: qs('#accountRequestsHistory'),
    accountRequestsSummary: qs('#accountRequestsSummary'),
    usersTableBody: qs('#usersTbody'),
    usersPageInfo: qs('#usersPageInfo'),
    toast: qs('#toast'),
    locationFilter: qs('#locationFilter'),
    searchInput: qs('#searchInput'),
    activityLocationFilter: qs('#activityLocationFilter'),
    activitySearchInput: qs('#activitySearchInput'),
    userLocationSelect: qs('#userLocation'),
    ticketTruck: qs('#ticketTruck'),
    detailTitle: qs('#detailTitle'),
    detailContent: qs('#detailContent'),
    modalTicket: qs('#modalTicket'),
    modalOdo: qs('#modalOdo'),
    modalRef: qs('#modalRef'),
    modalInactive: qs('#modalInactive'),
    modalUser: qs('#modalUser'),
    modalAccountRequest: qs('#modalAccountRequest'),
    odoCurrent: qs('#odoCurrent'),
    odoInput: qs('#odoNew'),
    refCurrent: qs('#refCurrent'),
    refInput: qs('#refNew'),
    inactiveDate: qs('#inactiveDate'),
    inactiveReason: qs('#inactiveReason'),
    ticketType: qs('#ticketType'),
    ticketDesc: qs('#ticketDesc'),
    ticketOrder: qs('#ticketOrder'),
    ticketPhotos: qs('#ticketPhotos')
  };

  const setLoginFormDisabled = disabled => {
    [elements.loginEmail, elements.loginPassword, elements.loginSubmit].forEach(control => {
      if (control) {
        control.disabled = disabled;
      }
    });
    toggleHidden(elements.loginSubmitDefault, disabled);
    toggleHidden(elements.loginSubmitLoading, !disabled);
  };

  const setLoginStatus = message => {
    if (!elements.loginStatus) return;
    elements.loginStatus.textContent = message;
    toggleHidden(elements.loginStatus, !message);
  };

  const setLoginError = message => {
    if (!elements.loginError) return;
    elements.loginError.textContent = message;
    toggleHidden(elements.loginError, !message);
  };

  const showToast = message => {
    if (!elements.toast) return;
    elements.toast.textContent = message;
    elements.toast.classList.remove('hidden');
    setTimeout(() => {
      elements.toast.classList.add('hidden');
    }, 2200);
  };

  const showLogin = () => {
    toggleHidden(elements.loginPage, false);
    toggleHidden(elements.appShell, true);
    setLoginError('');
    setLoginStatus('');
    setLoginFormDisabled(false);
    if (elements.loginEmail) {
      elements.loginEmail.value = DEFAULT_LOGIN.email;
      elements.loginEmail.focus();
    }
    if (elements.loginPassword) {
      elements.loginPassword.value = DEFAULT_LOGIN.password;
    }
    state.session = null;
    state.selectedTruckId = null;
    state.activeTab = 'vloot';
    state.detailTab = 'info';
  };

  const showApp = () => {
    toggleHidden(elements.loginPage, true);
    toggleHidden(elements.appShell, false);
  };

  const updateUserBadge = () => {
    const name = state.session?.user?.name || 'Niet ingelogd';
    const email = state.session?.user?.email || '';
    if (elements.userName) {
      elements.userName.textContent = name;
    }
    if (elements.userMenuName) {
      elements.userMenuName.textContent = name;
    }
    if (elements.userMenuEmail) {
      elements.userMenuEmail.textContent = email;
    }
  };

  const ensureLocationOptions = () => {
    const accessibleLocations = new Set();
    data.fleet.filter(truck => truck.active !== false).forEach(truck => {
      if (truck.location) {
        accessibleLocations.add(truck.location);
      }
    });
    const locations = [
      'Alle locaties',
      ...Array.from(accessibleLocations).sort()
    ];
    if (elements.locationFilter) {
      elements.locationFilter.innerHTML = locations
        .map(location => `<option${location === state.fleetFilter.location ? ' selected' : ''}>${location}</option>`)
        .join('');
      if (!locations.includes(state.fleetFilter.location)) {
        state.fleetFilter.location = locations[0] || 'Alle locaties';
        elements.locationFilter.value = state.fleetFilter.location;
      }
    }
    if (elements.activityLocationFilter) {
      elements.activityLocationFilter.innerHTML = locations.map(location => `<option>${location}</option>`).join('');
      elements.activityLocationFilter.value = locations[0] || 'Alle locaties';
    }
    if (elements.userLocationSelect) {
      elements.userLocationSelect.innerHTML = locations
        .filter(location => location !== 'Alle locaties')
        .map(location => `<option>${location}</option>`)
        .join('');
    }
    if (elements.ticketTruck) {
      elements.ticketTruck.innerHTML = data.fleet
        .filter(truck => truck.active !== false)
        .map(truck => `<option value="${truck.id}">${truck.id} — ${truck.location || 'Onbekende locatie'}</option>`)
        .join('');
    }
  };

  const applyEnvironment = () => {
    const role = state.session?.user?.role || 'pending';
    if (!elements.environmentNotice) return;
    const summaries = {
      Beheerder: 'Volledige toegang tot vloot, activiteiten en gebruikersbeheer.',
      Vlootbeheerder: 'Inzicht in toegewezen vloot en activiteiten, beperkt gebruikersbeheer.',
      Gebruiker: 'Overzicht van eigen vloot en het indienen van servicemeldingen.',
      Klant: 'Alleen inzicht in toegewezen vloot en meldingen.',
      pending: 'Log in om de juiste omgeving te laden.'
    };
    const summary = summaries[role] || summaries.pending;
    if (elements.environmentName) {
      elements.environmentName.textContent = role;
    }
    if (elements.environmentBadge) {
      elements.environmentBadge.textContent = role;
    }
    if (elements.environmentSummary) {
      elements.environmentSummary.textContent = summary;
    }
    const allowedTabs = role === 'Beheerder'
      ? ['vloot', 'activiteit', 'users']
      : role === 'Vlootbeheerder'
      ? ['vloot', 'activiteit']
      : ['vloot'];
    qsa('#mainTabs button').forEach(button => {
      const tab = button.dataset.tab;
      const allowed = allowedTabs.includes(tab);
      button.disabled = !allowed;
      button.classList.toggle('opacity-40', !allowed);
    });
    if (!allowedTabs.includes(state.activeTab)) {
      state.activeTab = allowedTabs[0] || 'vloot';
    }
    renderTabs();
  };

  const filteredFleet = () => {
    const query = state.fleetFilter.query.trim().toLowerCase();
    return data.fleet
      .filter(truck => truck.active !== false)
      .filter(truck => state.fleetFilter.location === 'Alle locaties' || truck.location === state.fleetFilter.location)
      .filter(truck => {
        if (!query) return true;
        return [truck.id, truck.ref, truck.model, truck.modelType, truck.contract?.nummer, truck.location]
          .map(value => (value == null ? '' : String(value)))
          .some(value => value.toLowerCase().includes(query));
      });
  };

  const renderFleet = () => {
    if (!elements.fleetTableBody) return;
    const rows = filteredFleet().map(truck => {
      const openCount = Array.isArray(truck.activity)
        ? truck.activity.filter(entry => entry?.status === 'Open').length
        : 0;
      return `
        <tr class="border-b hover:bg-gray-50">
          <td class="py-3 px-3" data-label="Serienummer / Referentie">
            <button class="text-left text-gray-900 hover:underline" data-open-detail="${truck.id}">
              <div class="font-medium">${truck.id}</div>
              <div class="text-xs text-gray-500">${truck.ref}</div>
              <div class="text-xs text-gray-400">${truck.fleetName || '—'}</div>
            </button>
          </td>
          <td class="py-3 px-3" data-label="Modeltype">${truck.modelType || '—'}</td>
          <td class="py-3 px-3" data-label="Model">${truck.model}</td>
          <td class="py-3 px-3" data-label="BMWT‑status">${truck.bmwStatus}</td>
          <td class="py-3 px-3" data-label="BMWT‑vervaldatum">${fmtDate(truck.bmwExpiry)}</td>
          <td class="py-3 px-3" data-label="Locatie">${truck.location || '—'}</td>
          <td class="py-3 px-3" data-label="Urenstand (datum)">${formatHours(truck.hours, truck.hoursDate)}</td>
          <td class="py-3 px-3" data-label="Contractnummer">${truck.contract?.nummer || '—'}</td>
          <td class="py-3 px-3" data-label="Contract startdatum">${fmtDate(truck.contract?.start)}</td>
          <td class="py-3 px-3" data-label="Contract einddatum">${fmtDate(truck.contract?.eind)}</td>
          <td class="py-3 px-3" data-label="Openstaande meldingen">
            <button class="inline-flex items-center justify-center w-7 h-7 bg-red-100 text-motrac-red rounded-full font-semibold" data-open-detail="${truck.id}">${openCount}</button>
          </td>
          <td class="py-3 px-3 sm:text-right" data-label="Acties">
            <div class="relative inline-block kebab">
              <button class="px-2 py-1 border rounded-lg">⋮</button>
              <div class="kebab-menu hidden absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow-soft z-10">
                <button class="w-full text-left px-4 py-2 hover:bg-gray-50" data-action="newTicket" data-id="${truck.id}">Melding aanmaken</button>
                <button class="w-full text-left px-4 py-2 hover:bg-gray-50" data-action="updateOdo" data-id="${truck.id}">Urenstand doorgeven</button>
                <button class="w-full text-left px-4 py-2 hover:bg-gray-50" data-action="editRef" data-id="${truck.id}">Uw referentie wijzigen</button>
                <button class="w-full text-left px-4 py-2 hover:bg-gray-50" data-action="showContract" data-id="${truck.id}">Contract inzien</button>
                <button class="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600" data-action="inactive" data-id="${truck.id}">Verwijderen uit lijst</button>
              </div>
            </div>
          </td>
        </tr>`;
    }).join('');
    elements.fleetTableBody.innerHTML = rows || '<tr><td colspan="12" class="py-6 px-3 text-center text-gray-500">Geen resultaten</td></tr>';
  };

  const renderActivity = () => {
    if (!elements.activityList || !elements.activityEmpty) return;
    const locationFilter = elements.activityLocationFilter?.value || 'Alle locaties';
    const query = elements.activitySearchInput?.value.trim().toLowerCase() || '';
    const items = [];
    data.fleet.forEach(truck => {
      if (truck.active === false) return;
      const matchesLocation = locationFilter === 'Alle locaties' || truck.location === locationFilter;
      if (!matchesLocation) return;
      (truck.activity || []).forEach(entry => {
        if (entry?.status !== 'Open') return;
        const haystack = [truck.id, truck.ref, entry.id, entry.desc]
          .map(value => (value == null ? '' : String(value).toLowerCase()));
        const matchesQuery = !query || haystack.some(value => value.includes(query));
        if (matchesQuery) {
          items.push({ truck, entry });
        }
      });
    });
    if (!items.length) {
      elements.activityList.innerHTML = '';
      toggleHidden(elements.activityEmpty, false);
      return;
    }
    toggleHidden(elements.activityEmpty, true);
    elements.activityList.innerHTML = items
      .map(({ truck, entry }) => `
        <article class="bg-white rounded-xl shadow-soft p-4 space-y-2">
          <header class="flex items-center justify-between text-sm">
            <span class="font-semibold text-motrac-red">${entry.type}</span>
            <span class="text-gray-500">${fmtDate(entry.date)}</span>
          </header>
          <div class="text-sm text-gray-600">${entry.desc}</div>
          <dl class="grid grid-cols-2 gap-2 text-xs text-gray-500">
            <div>
              <dt class="uppercase tracking-wide">Truck</dt>
              <dd class="text-gray-900">${truck.id}</dd>
            </div>
            <div>
              <dt class="uppercase tracking-wide">Locatie</dt>
              <dd class="text-gray-900">${truck.location || '—'}</dd>
            </div>
          </dl>
          <footer>
            <button class="text-sm text-motrac-red hover:underline" data-open-detail="${truck.id}">Open detail</button>
          </footer>
        </article>`)
      .join('');
  };

  const renderAccountRequests = () => {
    if (!elements.accountRequestsCard) return;
    const pending = data.accountRequests.filter(request => request.status === 'pending');
    const history = data.accountRequests.filter(request => request.status !== 'pending');
    if (elements.accountRequestsSummary) {
      elements.accountRequestsSummary.textContent = pending.length
        ? `${pending.length} open aanvragen`
        : 'Geen open aanvragen.';
    }
    if (pending.length) {
      elements.accountRequestsList.innerHTML = pending
        .map(request => `
          <div class="border rounded-lg p-4 flex flex-col gap-2 text-sm" data-request-id="${request.id}">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-semibold">${request.name}</p>
                <p class="text-xs text-gray-500">${request.organisation}</p>
              </div>
              <span class="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">Nieuw</span>
            </div>
            <p class="text-sm text-gray-600">${request.requestNotes || '—'}</p>
            <div class="grid grid-cols-2 gap-2 text-xs text-gray-500">
              <span>${request.email}</span>
              <span>${request.phone || '—'}</span>
            </div>
            <div class="flex gap-2">
              <button class="flex-1 border rounded-lg px-3 py-2" data-request-action="reject" data-request-id="${request.id}">Afwijzen</button>
              <button class="flex-1 bg-motrac-red text-white rounded-lg px-3 py-2" data-request-action="approve" data-request-id="${request.id}">Goedkeuren</button>
            </div>
          </div>`)
        .join('');
    } else {
      elements.accountRequestsList.innerHTML = '';
    }
    toggleHidden(elements.accountRequestsEmpty, Boolean(pending.length));
    if (history.length) {
      elements.accountRequestsHistory.innerHTML = history
        .map(request => `
          <div class="border rounded-lg px-3 py-2 flex items-center justify-between text-sm">
            <div>
              <p class="font-medium">${request.name}</p>
              <p class="text-xs text-gray-500">${request.organisation}</p>
            </div>
            <span class="text-xs text-gray-500">${request.status}</span>
          </div>`)
        .join('');
      toggleHidden(elements.accountRequestsHistoryWrapper, false);
    } else {
      elements.accountRequestsHistory.innerHTML = '';
      toggleHidden(elements.accountRequestsHistoryWrapper, true);
    }
  };

  const renderUsers = () => {
    if (!elements.usersTableBody) return;
    const pageSize = state.usersPageSize;
    const start = (state.usersPage - 1) * pageSize;
    const slice = data.users.slice(start, start + pageSize);
    const rows = slice
      .map(user => `
        <tr class="border-b">
          <td class="py-3 px-3" data-label="Gebruiker">
            <div class="font-medium">${user.name}</div>
            <div class="text-xs text-gray-500">${user.email}</div>
          </td>
          <td class="py-3 px-3" data-label="Locatie">${user.location || '—'}</td>
          <td class="py-3 px-3" data-label="Email">${user.email}</td>
          <td class="py-3 px-3" data-label="Portaalrechten">${user.role}</td>
          <td class="py-3 px-3 text-right" data-label="Acties">
            <div class="relative inline-block kebab">
              <button class="px-2 py-1 border rounded-lg">⋮</button>
              <div class="kebab-menu hidden absolute right-0 mt-2 w-44 bg-white border rounded-lg shadow-soft z-10">
                <button class="w-full text-left px-4 py-2 hover:bg-gray-50" data-user-action="edit" data-user-id="${user.id}">Bewerken</button>
                <button class="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600" data-user-action="delete" data-user-id="${user.id}">Verwijderen</button>
              </div>
            </div>
          </td>
        </tr>`)
      .join('');
    elements.usersTableBody.innerHTML = rows || '<tr><td colspan="5" class="py-6 px-3 text-center text-gray-500">Geen gebruikers gevonden</td></tr>';
    const totalPages = Math.max(1, Math.ceil(data.users.length / pageSize));
    if (elements.usersPageInfo) {
      elements.usersPageInfo.textContent = `Pagina ${state.usersPage} van ${totalPages}`;
    }
  };

  const renderDetail = () => {
    if (!elements.detailSection) return;
    if (!state.selectedTruckId) {
      toggleHidden(elements.detailSection, true);
      return;
    }
    const truck = data.fleet.find(item => item.id === state.selectedTruckId);
    if (!truck) {
      toggleHidden(elements.detailSection, true);
      return;
    }
    toggleHidden(elements.detailSection, false);
    if (elements.detailTitle) {
      elements.detailTitle.textContent = `${truck.model} – ${truck.id}`;
    }
    const subtabButtons = qsa('#truckDetail [data-subtab]');
    subtabButtons.forEach(button => {
      const isActive = button.dataset.subtab === state.detailTab;
      button.classList.toggle('tab-active', isActive);
    });
    let content = '';
    if (state.detailTab === 'info') {
      content = `
        <div class="grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <p class="text-xs text-gray-500">Serienummer</p>
            <p class="font-medium">${truck.id}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Locatie</p>
            <p class="font-medium">${truck.location || '—'}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Modeltype</p>
            <p class="font-medium">${truck.modelType || '—'}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Urenstand</p>
            <p class="font-medium">${formatNumber(truck.hours)} (${fmtDate(truck.hoursDate)})</p>
          </div>
        </div>`;
    } else if (state.detailTab === 'act') {
      const items = (truck.activity || []).map(entry => `
        <div class="border rounded-lg p-3 text-sm">
          <div class="flex items-center justify-between">
            <span class="font-semibold text-motrac-red">${entry.type}</span>
            <span class="text-xs text-gray-500">${fmtDate(entry.date)}</span>
          </div>
          <p class="mt-2">${entry.desc}</p>
          <p class="text-xs text-gray-500 mt-2">Status: ${entry.status}</p>
        </div>`).join('');
      content = items || '<p class="text-sm text-gray-500">Geen activiteiten.</p>';
    } else if (state.detailTab === 'ctr') {
      content = `
        <div class="grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <p class="text-xs text-gray-500">Contractnummer</p>
            <p class="font-medium">${truck.contract?.nummer || '—'}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Type</p>
            <p class="font-medium">${truck.contract?.type || '—'}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Startdatum</p>
            <p class="font-medium">${fmtDate(truck.contract?.start)}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Einddatum</p>
            <p class="font-medium">${fmtDate(truck.contract?.eind)}</p>
          </div>
        </div>`;
    }
    if (elements.detailContent) {
      elements.detailContent.innerHTML = content;
    }
  };

  const renderTabs = () => {
    const buttons = qsa('#mainTabs button');
    buttons.forEach(button => {
      const isActive = button.dataset.tab === state.activeTab;
      button.classList.toggle('tab-active', isActive);
    });
    Object.entries(elements.tabPanels).forEach(([tab, panel]) => {
      toggleHidden(panel, tab !== state.activeTab);
    });
    toggleHidden(elements.detailSection, state.activeTab !== 'vloot' || !state.selectedTruckId);
  };

  const refreshAll = () => {
    ensureLocationOptions();
    renderTabs();
    renderFleet();
    renderActivity();
    renderUsers();
    renderAccountRequests();
    renderDetail();
    updateUserBadge();
    applyEnvironment();
  };

  const openModal = selector => {
    const modal = qs(selector);
    if (modal) {
      modal.classList.add('show');
    }
  };

  const closeModals = () => {
    qsa('.modal').forEach(modal => modal.classList.remove('show'));
  };

  const findTruck = id => data.fleet.find(truck => truck.id === id);

  const approveAccountRequest = id => {
    const request = data.accountRequests.find(item => item.id === id);
    if (!request) return;
    request.status = 'approved';
    request.updatedAt = new Date().toISOString();
    showToast('Aanvraag goedgekeurd.');
    renderAccountRequests();
  };

  const rejectAccountRequest = id => {
    const request = data.accountRequests.find(item => item.id === id);
    if (!request) return;
    request.status = 'rejected';
    request.updatedAt = new Date().toISOString();
    showToast('Aanvraag afgewezen.');
    renderAccountRequests();
  };

  const handleLoginSubmit = event => {
    event.preventDefault();
    const email = elements.loginEmail?.value.trim();
    const password = elements.loginPassword?.value || '';
    if (!email || !password) {
      setLoginError('Vul zowel e-mailadres als wachtwoord in.');
      return;
    }
    setLoginError('');
    setLoginStatus('Bezig met inloggen…');
    setLoginFormDisabled(true);
    setTimeout(() => {
      if (email.toLowerCase() === DEFAULT_LOGIN.email && password === DEFAULT_LOGIN.password) {
        state.session = {
          user: {
            email: DEFAULT_LOGIN.email,
            name: DEFAULT_LOGIN.name,
            role: DEFAULT_LOGIN.role
          }
        };
        showApp();
        setLoginStatus('');
        setLoginFormDisabled(false);
        if (elements.loginPassword) {
          elements.loginPassword.value = '';
        }
        refreshAll();
      } else {
        setLoginStatus('');
        setLoginFormDisabled(false);
        setLoginError('Onjuiste inloggegevens. Controleer e-mailadres en wachtwoord.');
      }
    }, 400);
  };

  const handleSignOut = () => {
    showToast('Uitgelogd');
    elements.userMenu?.classList.add('hidden');
    showLogin();
  };

  const handleNewTicket = truckId => {
    const truck = findTruck(truckId);
    if (!truck) return;
    if (elements.ticketTruck) {
      elements.ticketTruck.value = truck.id;
    }
    openModal('#modalTicket');
  };

  const handleCreateTicket = () => {
    const id = elements.ticketTruck?.value;
    const type = elements.ticketType?.value || 'Storing';
    const desc = elements.ticketDesc?.value.trim();
    if (!id || !desc) {
      showToast('Vul minimaal truck en omschrijving in.');
      return;
    }
    const truck = findTruck(id);
    if (!truck) {
      showToast('Onbekende truck geselecteerd.');
      return;
    }
    truck.activity = truck.activity || [];
    truck.activity.unshift({
      id: generateId('M'),
      type,
      desc,
      status: 'Open',
      date: new Date().toISOString()
    });
    showToast('Servicemelding aangemaakt.');
    closeModals();
    elements.ticketOrder && (elements.ticketOrder.value = '');
    elements.ticketDesc && (elements.ticketDesc.value = '');
    elements.ticketPhotos && (elements.ticketPhotos.value = '');
    state.activeTab = 'activiteit';
    renderTabs();
    renderFleet();
    renderActivity();
  };

  const handleUpdateOdo = truckId => {
    const truck = findTruck(truckId);
    if (!truck) return;
    if (elements.odoCurrent) {
      elements.odoCurrent.textContent = `${formatNumber(truck.hours)} (${fmtDate(truck.hoursDate)})`;
    }
    if (elements.odoInput) {
      elements.odoInput.value = '';
      elements.odoInput.dataset.truckId = truck.id;
    }
    openModal('#modalOdo');
  };

  const handleSaveOdo = () => {
    if (!elements.odoInput) return;
    const truckId = elements.odoInput.dataset.truckId;
    const value = Number(elements.odoInput.value);
    if (!truckId || Number.isNaN(value) || value < 0) {
      showToast('Voer een geldige urenstand in.');
      return;
    }
    const truck = findTruck(truckId);
    if (!truck) return;
    if (typeof truck.hours === 'number' && value < truck.hours) {
      showToast('Nieuwe urenstand moet ≥ huidige zijn.');
      return;
    }
    truck.hours = value;
    truck.hoursDate = new Date().toISOString();
    showToast('Urenstand bijgewerkt.');
    closeModals();
    renderFleet();
    renderDetail();
  };

  const handleEditRef = truckId => {
    const truck = findTruck(truckId);
    if (!truck) return;
    if (elements.refCurrent) {
      elements.refCurrent.textContent = truck.ref || '—';
    }
    if (elements.refInput) {
      elements.refInput.value = truck.ref || '';
      elements.refInput.dataset.truckId = truck.id;
    }
    openModal('#modalRef');
  };

  const handleSaveRef = () => {
    if (!elements.refInput) return;
    const truckId = elements.refInput.dataset.truckId;
    const value = elements.refInput.value.trim();
    if (!value) {
      showToast('Referentie mag niet leeg zijn.');
      return;
    }
    const truck = findTruck(truckId);
    if (!truck) return;
    truck.ref = value;
    showToast('Referentie bijgewerkt.');
    closeModals();
    renderFleet();
    renderDetail();
  };

  const handleDeactivate = truckId => {
    const truck = findTruck(truckId);
    if (!truck) return;
    if (elements.inactiveDate) {
      elements.inactiveDate.valueAsDate = new Date();
      elements.inactiveDate.dataset.truckId = truck.id;
    }
    if (elements.inactiveReason) {
      elements.inactiveReason.value = '';
      elements.inactiveReason.dataset.truckId = truck.id;
    }
    openModal('#modalInactive');
  };

  const handleConfirmDeactivate = () => {
    const truckId = elements.inactiveDate?.dataset.truckId;
    const reason = elements.inactiveReason?.value.trim();
    if (!truckId || !reason) {
      showToast('Datum en reden zijn verplicht.');
      return;
    }
    const truck = findTruck(truckId);
    if (!truck) return;
    truck.active = false;
    closeModals();
    showToast('Truck gemarkeerd als inactief.');
    if (state.selectedTruckId === truck.id) {
      state.selectedTruckId = null;
    }
    renderFleet();
    renderActivity();
    renderDetail();
    ensureLocationOptions();
  };

  const handleShowContract = truckId => {
    const truck = findTruck(truckId);
    if (!truck) return;
    const contractBody = qs('#contractBody');
    if (contractBody) {
      const contract = truck.contract || {};
      contractBody.innerHTML = `
        <div>
          <p class="text-xs text-gray-500">Contractnummer</p>
          <p class="font-medium">${contract.nummer || '—'}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500">Startdatum</p>
          <p class="font-medium">${fmtDate(contract.start)}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500">Einddatum</p>
          <p class="font-medium">${fmtDate(contract.eind)}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500">Type</p>
          <p class="font-medium">${contract.type || '—'}</p>
        </div>`;
    }
    openModal('#modalContract');
  };

  const handleOpenDetail = truckId => {
    state.selectedTruckId = truckId;
    state.detailTab = 'info';
    state.activeTab = 'vloot';
    renderTabs();
    renderDetail();
  };

  const handleUserModal = (mode, userId) => {
    const title = qs('#userModalTitle');
    const name = qs('#userName');
    const email = qs('#userEmail');
    const phone = qs('#userPhone');
    const location = elements.userLocationSelect;
    const role = qs('#userRole');
    if (!title || !name || !email || !phone || !location || !role) return;
    if (mode === 'edit') {
      const user = data.users.find(item => item.id === userId);
      if (!user) return;
      title.textContent = 'Gebruiker bewerken';
      name.value = user.name;
      email.value = user.email;
      phone.value = user.phone || '';
      location.value = user.location || '';
      role.value = user.role || 'Gebruiker';
      location.dataset.userId = user.id;
    } else {
      title.textContent = 'Gebruiker toevoegen';
      name.value = '';
      email.value = '';
      phone.value = '';
      location.value = location.options[0]?.value || '';
      role.value = 'Gebruiker';
      location.dataset.userId = '';
    }
    openModal('#modalUser');
  };

  const handleSaveUser = () => {
    const name = qs('#userName');
    const email = qs('#userEmail');
    const phone = qs('#userPhone');
    const location = elements.userLocationSelect;
    const role = qs('#userRole');
    if (!name || !email || !phone || !location || !role) return;
    const trimmedName = name.value.trim();
    const trimmedEmail = email.value.trim();
    if (!trimmedName || !trimmedEmail) {
      showToast('Naam en e-mail zijn verplicht.');
      return;
    }
    const userId = location.dataset.userId;
    if (userId) {
      const user = data.users.find(item => item.id === userId);
      if (user) {
        Object.assign(user, {
          name: trimmedName,
          email: trimmedEmail,
          phone: phone.value.trim(),
          location: location.value,
          role: role.value
        });
        showToast('Gebruiker bijgewerkt.');
      }
    } else {
      data.users.push({
        id: generateId('U'),
        name: trimmedName,
        email: trimmedEmail,
        phone: phone.value.trim(),
        location: location.value,
        role: role.value
      });
      showToast('Gebruiker toegevoegd.');
    }
    closeModals();
    renderUsers();
  };

  const handleDeleteUser = userId => {
    const index = data.users.findIndex(user => user.id === userId);
    if (index === -1) return;
    data.users.splice(index, 1);
    showToast('Gebruiker verwijderd.');
    const totalPages = Math.max(1, Math.ceil(data.users.length / state.usersPageSize));
    if (state.usersPage > totalPages) {
      state.usersPage = totalPages;
    }
    renderUsers();
  };

  const handleAccountRequestSubmit = event => {
    event.preventDefault();
    const name = qs('#requestName')?.value.trim();
    const organisation = qs('#requestOrganisation')?.value.trim();
    const email = qs('#requestEmail')?.value.trim();
    const phone = qs('#requestPhone')?.value.trim();
    const notes = qs('#requestNotes')?.value.trim();
    if (!name || !organisation || !email) {
      showToast('Naam, organisatie en e-mail zijn verplicht.');
      return;
    }
    data.accountRequests.unshift({
      id: generateId('REQ'),
      name,
      organisation,
      email,
      phone,
      requestNotes: notes,
      requestedRole: null,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    closeModals();
    showToast('Aanvraag verstuurd.');
    renderAccountRequests();
    event.target.reset();
  };

  const handleTabClick = tab => {
    if (!tab) return;
    state.activeTab = tab;
    renderTabs();
  };

  const handleDetailSubtab = subtab => {
    state.detailTab = subtab;
    renderDetail();
  };

  const attachEvents = () => {
    elements.loginForm?.addEventListener('submit', handleLoginSubmit);
    qs('#logoutBtn')?.addEventListener('click', handleSignOut);
    qs('#cancelUserMenu')?.addEventListener('click', () => {
      elements.userMenu?.classList.add('hidden');
    });
    qs('#openAccountRequest')?.addEventListener('click', () => {
      qs('#accountRequestForm')?.reset();
      openModal('#modalAccountRequest');
    });
    qs('#accountRequestForm')?.addEventListener('submit', handleAccountRequestSubmit);
    elements.locationFilter?.addEventListener('change', event => {
      state.fleetFilter.location = event.target.value;
      renderFleet();
      renderActivity();
    });
    qs('#searchBtn')?.addEventListener('click', () => {
      state.fleetFilter.query = elements.searchInput?.value || '';
      renderFleet();
    });
    elements.searchInput?.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        state.fleetFilter.query = elements.searchInput.value;
        renderFleet();
      }
    });
    qs('#activitySearchBtn')?.addEventListener('click', () => renderActivity());
    elements.activitySearchInput?.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        renderActivity();
      }
    });
    elements.activityLocationFilter?.addEventListener('change', () => renderActivity());
    qs('#btnNewTicket')?.addEventListener('click', () => openModal('#modalTicket'));
    qs('#btnNewTicketMobile')?.addEventListener('click', () => {
      openModal('#modalTicket');
      qs('#mainNav')?.classList.add('hidden');
      qs('#mobileMenuToggle')?.setAttribute('aria-expanded', 'false');
    });
    qs('#ticketCreate')?.addEventListener('click', handleCreateTicket);
    qs('#odoSave')?.addEventListener('click', handleSaveOdo);
    qs('#refSave')?.addEventListener('click', handleSaveRef);
    qs('#inactiveConfirm')?.addEventListener('click', handleConfirmDeactivate);
    qs('#userSave')?.addEventListener('click', handleSaveUser);
    qs('#usersPrev')?.addEventListener('click', () => {
      if (state.usersPage > 1) {
        state.usersPage -= 1;
        renderUsers();
      }
    });
    qs('#usersNext')?.addEventListener('click', () => {
      const totalPages = Math.max(1, Math.ceil(data.users.length / state.usersPageSize));
      if (state.usersPage < totalPages) {
        state.usersPage += 1;
        renderUsers();
      }
    });
    qs('#usersPageSize')?.addEventListener('change', event => {
      state.usersPageSize = Number(event.target.value) || 10;
      state.usersPage = 1;
      renderUsers();
    });
    qs('#btnAddUser')?.addEventListener('click', () => handleUserModal('create'));
    qs('#backToFleet')?.addEventListener('click', () => {
      state.selectedTruckId = null;
      renderDetail();
    });
    document.addEventListener('click', event => {
      const tabButton = event.target.closest('#mainTabs button');
      if (tabButton && !tabButton.disabled) {
        handleTabClick(tabButton.dataset.tab);
      }
      const detailSubtab = event.target.closest('#truckDetail [data-subtab]');
      if (detailSubtab) {
        handleDetailSubtab(detailSubtab.dataset.subtab);
      }
      const openDetail = event.target.closest('[data-open-detail]');
      if (openDetail) {
        handleOpenDetail(openDetail.dataset.openDetail);
      }
      const kebabButton = event.target.closest('.kebab > button');
      if (kebabButton) {
        const menu = kebabButton.parentElement.querySelector('.kebab-menu');
        const willShow = menu?.classList.contains('hidden');
        closeAllMenus();
        if (menu && willShow) {
          menu.classList.remove('hidden');
        }
        return;
      }
      if (!event.target.closest('.kebab-menu')) {
        closeAllMenus();
      }
      const actionButton = event.target.closest('[data-action]');
      if (actionButton) {
        const { action, id } = actionButton.dataset;
        if (id) {
          if (action === 'newTicket') {
            handleNewTicket(id);
          } else if (action === 'updateOdo') {
            handleUpdateOdo(id);
          } else if (action === 'editRef') {
            handleEditRef(id);
          } else if (action === 'inactive') {
            handleDeactivate(id);
          } else if (action === 'showContract') {
            handleShowContract(id);
          }
        } else if (state.selectedTruckId) {
          if (action === 'newTicketFromDetail') {
            handleNewTicket(state.selectedTruckId);
          } else if (action === 'updateOdoFromDetail') {
            handleUpdateOdo(state.selectedTruckId);
          } else if (action === 'editRefFromDetail') {
            handleEditRef(state.selectedTruckId);
          }
        }
      }
      const userAction = event.target.closest('[data-user-action]');
      if (userAction) {
        const { userAction: type, userId } = userAction.dataset;
        if (type === 'edit') {
          handleUserModal('edit', userId);
        } else if (type === 'delete') {
          handleDeleteUser(userId);
        }
      }
      const requestAction = event.target.closest('[data-request-action]');
      if (requestAction) {
        const { requestAction: type, requestId } = requestAction.dataset;
        if (type === 'approve') {
          approveAccountRequest(requestId);
        } else if (type === 'reject') {
          rejectAccountRequest(requestId);
        }
      }
      if (event.target.matches('#userBtn')) {
        elements.userMenu?.classList.toggle('hidden');
      } else if (!event.target.closest('#userMenu')) {
        elements.userMenu?.classList.add('hidden');
      }
      if (event.target.matches('[data-close]')) {
        closeModals();
      }
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        closeModals();
        elements.userMenu?.classList.add('hidden');
      }
    });
    const mobileToggle = qs('#mobileMenuToggle');
    const mainNav = qs('#mainNav');
    mobileToggle?.addEventListener('click', () => {
      const hidden = mainNav?.classList.toggle('hidden');
      mobileToggle.setAttribute('aria-expanded', hidden ? 'false' : 'true');
    });
    document.addEventListener('click', event => {
      if (!event.target.closest('#mainNav') && !event.target.closest('#mobileMenuToggle')) {
        if (window.matchMedia('(max-width: 639px)').matches) {
          mainNav?.classList.add('hidden');
          mobileToggle?.setAttribute('aria-expanded', 'false');
        }
      }
    });
  };

  return {
    start() {
      showLogin();
      attachEvents();
      ensureLocationOptions();
      renderFleet();
      renderActivity();
      renderUsers();
      renderAccountRequests();
    }
  };
}
