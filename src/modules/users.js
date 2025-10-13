import { FLEET, USERS } from '../data.js';
import { state } from '../state.js';
import { $ } from '../utils.js';

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

export function renderAccountRequests() {
  const card = $('#accountRequestsCard');
  if (!card) return;

  const canManageRequests = state.allowedTabs?.includes('users');
  card.classList.toggle('hidden', !canManageRequests);
  if (!canManageRequests) return;

  const pending = state.accountRequests.filter(request => request.status === 'pending');
  const resolved = state.accountRequests.filter(request => request.status !== 'pending');

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

export function renderUsers() {
  state.usersPageSize = parseInt($('#usersPageSize').value, 10) || state.usersPageSize;
  const totalPages = Math.max(1, Math.ceil(USERS.length / state.usersPageSize));
  if (state.usersPage > totalPages) {
    state.usersPage = totalPages;
  }

  const start = (state.usersPage - 1) * state.usersPageSize;
  const pageItems = USERS.slice(start, start + state.usersPageSize);

  $('#usersTbody').innerHTML = pageItems.map(user => `
    <tr class="border-b hover:bg-gray-50">
      <td class="py-3 px-3" data-label="Gebruiker">
        <div class="font-medium">${user.name}</div>
        <div class="text-xs text-gray-500">${user.phone}</div>
      </td>
      <td class="py-3 px-3" data-label="Locatie">${user.location}</td>
      <td class="py-3 px-3" data-label="Email">${user.email}</td>
      <td class="py-3 px-3" data-label="Portaalrechten">${user.role}</td>
      <td class="py-3 px-3 sm:text-right" data-label="Acties">
        <div class="relative inline-block kebab">
          <button class="px-2 py-1 border rounded-lg">⋮</button>
          <div class="kebab-menu hidden absolute right-0 mt-2 w-44 bg-white border rounded-lg shadow-soft z-10">
            <button class="w-full text-left px-4 py-2 hover:bg-gray-50" data-user-action="edit" data-id="${user.id}">Edit</button>
            <button class="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600" data-user-action="delete" data-id="${user.id}">Delete</button>
          </div>
        </div>
      </td>
    </tr>`).join('');

  $('#usersPageInfo').textContent = `Pagina ${state.usersPage} van ${totalPages}`;
  $('#usersPrev').disabled = state.usersPage <= 1;
  $('#usersNext').disabled = state.usersPage >= totalPages;

  renderAccountRequests();
}
