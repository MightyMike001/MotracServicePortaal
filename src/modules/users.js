import { FLEET, USERS } from '../data.js';
import { state } from '../state.js';
import { $ } from '../utils.js';
import { showToast } from './ui/toast.js';
import { canManageUsers, canApproveAccountRequests } from './access.js';

const ROLE_OPTIONS = ['Beheerder', 'Gebruiker', 'Vlootbeheerder', 'Klant'];

const dateFormatter = new Intl.DateTimeFormat('nl-NL', {
  dateStyle: 'medium',
  timeStyle: 'short'
});

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return '—';
  return dateFormatter.format(date);
}

function getFleetSummaries() {
  const map = new Map();
  FLEET.forEach(item => {
    if (!item?.fleetId) return;
    if (!map.has(item.fleetId)) {
      map.set(item.fleetId, {
        id: item.fleetId,
        name: item.fleetName || '—',
        locations: new Set()
      });
    }
    if (item.location) {
      map.get(item.fleetId).locations.add(item.location);
    }
  });

  return Array.from(map.values())
    .map(entry => ({
      id: entry.id,
      name: entry.name,
      locations: Array.from(entry.locations)
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'nl-NL'));
}

function renderHistory(historyEl, resolvedRequests = []) {
  if (!historyEl) return;
  historyEl.innerHTML = resolvedRequests
    .map(request => {
      const statusLabel =
        request.status === 'approved'
          ? `Toegekend als ${request.assignedRole || 'onbekend'}`
          : 'Afgewezen';
      const fleetLabel =
        request.assignedFleetName || request.organisation || (request.assignedFleetId ? '—' : 'Geen specifieke vloot');
      const passwordInfo = request.passwordSetAt ? ` • Wachtwoord sinds ${formatDateTime(request.passwordSetAt)}` : '';
      return `
        <div class="flex items-start justify-between gap-3 border border-gray-200 rounded-lg px-3 py-2">
          <div>
            <p class="font-medium text-gray-800">${request.name}</p>
            <p class="text-xs text-gray-500">${statusLabel} • ${formatDateTime(request.completedAt)}${passwordInfo}</p>
          </div>
          <span class="text-xs text-gray-500">${fleetLabel}</span>
        </div>`;
    })
    .join('');
}

function renderPendingRequests(listEl, pendingRequests, fleetSummaries) {
  if (!listEl) return;

  const fleetOptions = [
    '<option value="">Geen specifieke vloot</option>',
    ...fleetSummaries.map(
      fleet =>
        `<option value="${fleet.id}">${fleet.name}${fleet.locations.length ? ` • ${fleet.locations.join(', ')}` : ''}</option>`
    )
  ];

  listEl.innerHTML = pendingRequests
    .map(request => {
      const hasRequestedRole = ROLE_OPTIONS.includes(request.requestedRole);
      const defaultRole = hasRequestedRole ? request.requestedRole : 'Gebruiker';
      const requestedInfo = hasRequestedRole
        ? `Voorkeursrol: ${request.requestedRole}`
        : 'Nog geen rol toegewezen';
      const note = request.requestNotes ? `<p class="text-xs text-gray-500">${request.requestNotes}</p>` : '';
      const contactDetails = [request.email, request.phone].filter(Boolean).join(' • ');
      const loginStatusLabel = request.loginEnabled ? 'Inloggen geactiveerd' : 'Inloggen geblokkeerd';
      const passwordLabel = request.passwordSetAt
        ? `Wachtwoord ingesteld op ${formatDateTime(request.passwordSetAt)}`
        : 'Wachtwoord nog niet ingesteld';

      return `
        <article class="border border-gray-200 rounded-lg p-4 space-y-3" data-request data-id="${request.id}">
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <p class="font-semibold text-gray-800">${request.name}</p>
              <p class="text-sm text-gray-500">${contactDetails || 'Geen contactgegevens'}</p>
              ${note}
            </div>
            <div class="text-sm text-gray-600 sm:text-right">
              <p class="text-xs uppercase text-gray-500 tracking-wide">Organisatie</p>
              <p>${request.organisation || 'Onbekend'}</p>
            </div>
          </div>
          <div class="grid sm:grid-cols-2 gap-3 text-sm text-gray-700">
            <div>
              <p class="text-xs uppercase text-gray-500 tracking-wide">Aangevraagd op</p>
              <p>${formatDateTime(request.submittedAt)}</p>
            </div>
            <div>
              <p class="text-xs uppercase text-gray-500 tracking-wide">Rolstatus</p>
              <p>${requestedInfo}</p>
            </div>
            <div>
              <p class="text-xs uppercase text-gray-500 tracking-wide">Toegang</p>
              <p>${loginStatusLabel}</p>
            </div>
            <div>
              <p class="text-xs uppercase text-gray-500 tracking-wide">Wachtwoord</p>
              <p>${passwordLabel}</p>
            </div>
          </div>
          <div class="grid sm:grid-cols-2 gap-3">
            <label class="text-xs uppercase text-gray-500 tracking-wide flex flex-col gap-2">
              Toekenning
              <select class="border rounded-lg px-3 py-2 text-sm" data-request-role>
                ${ROLE_OPTIONS.map(role => `<option value="${role}" ${role === defaultRole ? 'selected' : ''}>${role}</option>`).join('')}
              </select>
            </label>
            <label class="text-xs uppercase text-gray-500 tracking-wide flex flex-col gap-2">
              Toegewezen vloot
              <select class="border rounded-lg px-3 py-2 text-sm" data-request-fleet>
                ${fleetOptions.join('')}
              </select>
            </label>
          </div>
          <div class="flex justify-end gap-2">
            <button class="px-3 py-2 border rounded-lg text-sm" data-request-action="reject" data-id="${request.id}">Weigeren</button>
            <button class="px-3 py-2 bg-motrac-red text-white rounded-lg text-sm" data-request-action="approve" data-id="${request.id}">Toekennen</button>
          </div>
        </article>`;
    })
    .join('');
}

function ensureSearchControls() {
  let input = $('#usersSearch');
  if (!input) {
    const tab = $('#tab-users');
    const header = tab?.querySelector(':scope > div.flex');
    if (!tab || !header) {
      return null;
    }

    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl shadow-soft p-4';
    card.innerHTML = `
      <label for="usersSearch" class="block text-sm text-gray-600">Zoek gebruiker…</label>
      <div class="mt-1 flex gap-2">
        <input id="usersSearch" type="search" class="flex-1 border rounded-lg px-3 py-2" placeholder="Naam, e-mail of telefoon" />
        <button id="usersSearchBtn" class="px-4 py-2 bg-gray-900 text-white rounded-lg">Zoeken</button>
        <button id="usersSearchReset" class="px-4 py-2 border rounded-lg">Reset</button>
      </div>
    `;
    header.insertAdjacentElement('afterend', card);
    input = card.querySelector('#usersSearch');
    const searchBtn = card.querySelector('#usersSearchBtn');
    const resetBtn = card.querySelector('#usersSearchReset');

    const applySearch = () => {
      state.usersSearchQuery = input.value.trim().toLowerCase();
      state.usersPage = 1;
      renderUsers();
    };

    input.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        applySearch();
      }
    });
    searchBtn.addEventListener('click', event => {
      event.preventDefault();
      applySearch();
    });
    resetBtn.addEventListener('click', event => {
      event.preventDefault();
      input.value = '';
      state.usersSearchQuery = '';
      state.usersPage = 1;
      renderUsers();
    });
  }

  input.value = state.usersSearchQuery || '';
  return input;
}

function filterUsers() {
  const query = (state.usersSearchQuery || '').trim().toLowerCase();
  if (!query) {
    return USERS;
  }
  return USERS.filter(user => {
    return [user.name, user.email, user.phone, user.role]
      .filter(Boolean)
      .some(value => String(value).toLowerCase().includes(query));
  });
}

function setPageInfo(pageInfoEl, currentPage, totalPages, totalItems, pageItems) {
  if (!pageInfoEl) return;
  if (!totalItems) {
    pageInfoEl.textContent = 'Geen gebruikers gevonden';
    return;
  }
  const start = (currentPage - 1) * state.usersPageSize + 1;
  const end = start + pageItems.length - 1;
  pageInfoEl.textContent = `Pagina ${currentPage} van ${totalPages} • ${start}–${end} van ${totalItems} gebruikers`;
}

function setFieldError(input, message) {
  if (!input) return;
  let feedback = input.parentElement.querySelector('.input-error');
  if (!feedback) {
    feedback = document.createElement('p');
    feedback.className = 'input-error text-xs text-red-600 mt-1';
    input.parentElement.appendChild(feedback);
  }
  input.classList.toggle('border-red-500', Boolean(message));
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
  feedback.textContent = message || '';
  feedback.classList.toggle('hidden', !message);
}

function validateUserForm() {
  const nameInput = $('#userName');
  const emailInput = $('#userEmail');
  const locationSelect = $('#userLocation');
  const roleSelect = $('#userRole');

  let valid = true;
  if (!nameInput?.value.trim()) {
    setFieldError(nameInput, 'Naam is verplicht.');
    valid = false;
  } else {
    setFieldError(nameInput, '');
  }

  const emailValue = emailInput?.value.trim();
  if (!emailValue) {
    setFieldError(emailInput, 'E-mailadres is verplicht.');
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
    setFieldError(emailInput, 'Voer een geldig e-mailadres in.');
    valid = false;
  } else {
    setFieldError(emailInput, '');
  }

  if (!locationSelect?.value) {
    setFieldError(locationSelect, 'Selecteer een locatie.');
    valid = false;
  } else {
    setFieldError(locationSelect, '');
  }

  if (!roleSelect?.value) {
    setFieldError(roleSelect, 'Kies een rol.');
    valid = false;
  } else {
    setFieldError(roleSelect, '');
  }

  return valid;
}

function ensureResetPasswordButton(user) {
  return `
    <button class="w-full text-left px-4 py-2 hover:bg-gray-50" data-user-action="reset" data-id="${user.id}">Reset wachtwoord</button>
  `;
}

function renderUsersTableRows(users) {
  return users
    .map(user => `
    <tr class="border-b hover:bg-gray-50">
      <td class="py-3 px-3" data-label="Gebruiker">
        <div class="font-medium">${user.name}</div>
        <div class="text-xs text-gray-500">${user.phone || 'Geen telefoon'}</div>
      </td>
      <td class="py-3 px-3" data-label="Locatie">${user.location}</td>
      <td class="py-3 px-3" data-label="Email">${user.email}</td>
      <td class="py-3 px-3" data-label="Portaalrechten">${user.role}</td>
      <td class="py-3 px-3 sm:text-right" data-label="Acties">
        <div class="relative inline-block kebab">
          <button class="px-2 py-1 border rounded-lg">⋮</button>
          <div class="kebab-menu hidden absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-soft z-10">
            <button class="w-full text-left px-4 py-2 hover:bg-gray-50" data-user-action="edit" data-id="${user.id}">Bewerken</button>
            ${ensureResetPasswordButton(user)}
            <button class="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600" data-user-action="delete" data-id="${user.id}">Verwijderen</button>
          </div>
        </div>
      </td>
    </tr>`)
    .join('');
}

/**
 * Render the account requests block when the active user may manage accounts.
 */
export function renderAccountRequests() {
  const card = $('#accountRequestsCard');
  if (!card) return;

  const requests = Array.isArray(state.accountRequests) ? state.accountRequests : [];
  const canManageRequests = canApproveAccountRequests();
  card.classList.toggle('hidden', !canManageRequests);
  if (!canManageRequests) return;

  const pending = requests.filter(request => request.status === 'pending');
  const resolved = requests.filter(request => request.status !== 'pending');

  const summaryEl = $('#accountRequestsSummary');
  if (summaryEl) {
    summaryEl.textContent = pending.length
      ? `${pending.length} aanvraag${pending.length > 1 ? 'en' : ''} wachten op toewijzing. Aanvragers kunnen al inloggen maar zien nog geen inhoud.`
      : 'Geen open aanvragen.';
  }

  const emptyEl = $('#accountRequestsEmpty');
  if (emptyEl) {
    emptyEl.classList.toggle('hidden', pending.length > 0);
  }

  const fleetSummaries = getFleetSummaries();
  renderPendingRequests($('#accountRequestsList'), pending, fleetSummaries);

  const historyWrapper = $('#accountRequestsHistoryWrapper');
  if (historyWrapper) {
    historyWrapper.classList.toggle('hidden', resolved.length === 0);
  }
  renderHistory($('#accountRequestsHistory'), resolved);
}

/**
 * Renders the paginated user overview including filters.
 */
export function renderUsers() {
  const pageSizeInput = $('#usersPageSize');
  const tableBody = $('#usersTbody');
  const pageInfo = $('#usersPageInfo');
  const prevButton = $('#usersPrev');
  const nextButton = $('#usersNext');
  const addUserButton = $('#btnAddUser');

  if (!tableBody || !pageInfo || !prevButton || !nextButton) {
    return;
  }

  const mayManageUsers = canManageUsers();
  if (addUserButton) {
    addUserButton.classList.toggle('hidden', !mayManageUsers);
    addUserButton.disabled = !mayManageUsers;
  }

  if (!mayManageUsers) {
    tableBody.innerHTML =
      '<tr><td colspan="5" class="py-6 px-3 text-center text-gray-500">U heeft geen toegang tot gebruikersbeheer.</td></tr>';
    pageInfo.textContent = 'Beperkte rol – gebruikersbeheer is niet beschikbaar.';
    prevButton.disabled = true;
    nextButton.disabled = true;
    renderAccountRequests();
    return;
  }

  ensureSearchControls();

  const parsedPageSize = parseInt(pageSizeInput?.value, 10);
  if (Number.isInteger(parsedPageSize) && parsedPageSize > 0) {
    state.usersPageSize = parsedPageSize;
  } else if (pageSizeInput && state.usersPageSize > 0) {
    pageSizeInput.value = String(state.usersPageSize);
  }

  const filtered = filterUsers();
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / state.usersPageSize));
  if (state.usersPage > totalPages) {
    state.usersPage = totalPages;
  }

  const start = (state.usersPage - 1) * state.usersPageSize;
  const pageItems = filtered.slice(start, start + state.usersPageSize);

  tableBody.innerHTML = pageItems.length ? renderUsersTableRows(pageItems) : '';

  if (!pageItems.length) {
    tableBody.innerHTML =
      '<tr><td colspan="5" class="py-6 px-3 text-center text-gray-500">Geen gebruikers gevonden</td></tr>';
  }

  setPageInfo(pageInfo, state.usersPage, totalPages, totalItems, pageItems);
  prevButton.disabled = state.usersPage <= 1;
  nextButton.disabled = state.usersPage >= totalPages;

  renderAccountRequests();
}

/**
 * Handles the user form submission (add or edit).
 */
export function saveUser() {
  if (!canManageUsers()) {
    showToast('U heeft geen rechten om gebruikers te beheren.', { variant: 'error' });
    return false;
  }

  if (!validateUserForm()) {
    return false;
  }

  const name = $('#userName').value.trim();
  const email = $('#userEmail').value.trim();
  const phone = $('#userPhone').value.trim();
  const location = $('#userLocation').value;
  const role = $('#userRole').value;

  if (state.editUserId) {
    const user = USERS.find(item => item.id === state.editUserId);
    Object.assign(user, { name, email, phone, location, role });
    showToast('Gebruiker bijgewerkt.', { variant: 'success' });
  } else {
    USERS.unshift({ id: `U${Math.floor(Math.random() * 100000)}`, name, email, phone, location, role });
    state.usersPage = 1;
    showToast('Gebruiker toegevoegd.', { variant: 'success' });
  }

  state.editUserId = null;
  renderUsers();
  return true;
}
