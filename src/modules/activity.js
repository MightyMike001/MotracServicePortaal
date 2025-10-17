import { FLEET } from '../data.js';
import { state } from '../state.js';
import { $, fmtDate } from '../utils.js';
import { filterFleetByAccess } from './access.js';
import { renderFleet } from './fleet.js';
import { showToast } from './ui/toast.js';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Alle statussen' },
  { value: 'Open', label: 'Open' },
  { value: 'In behandeling', label: 'In behandeling' },
  { value: 'Afgerond', label: 'Afgerond' },
  { value: 'Geannuleerd', label: 'Geannuleerd' }
];

let activeDetail = null;

function ensureStatusFilter() {
  let statusFilter = $('#activityStatusFilter');
  if (statusFilter) {
    return statusFilter;
  }

  const filtersWrapper = $('#tab-activiteit .bg-white');
  if (!filtersWrapper) {
    return null;
  }

  const container = document.createElement('div');
  container.className = 'flex-1';
  container.innerHTML = `
    <label class="block text-sm text-gray-600">Status</label>
    <select id="activityStatusFilter" class="mt-1 w-full sm:w-60 border rounded-lg px-3 py-2"></select>
  `;
  filtersWrapper.appendChild(container);
  statusFilter = container.querySelector('select');
  statusFilter.addEventListener('change', event => {
    state.activityFilter.status = event.target.value;
    renderActivity();
  });

  return statusFilter;
}

function populateStatusFilter() {
  const statusFilter = ensureStatusFilter();
  if (!statusFilter) return;
  statusFilter.innerHTML = STATUS_OPTIONS.map(
    option => `<option value="${option.value}">${option.label}</option>`
  ).join('');
  statusFilter.value = state.activityFilter.status || 'all';
}

function matchesStatusFilter(activity) {
  const desired = state.activityFilter.status || 'all';
  if (desired === 'all') return true;
  return (activity.status || '').toLowerCase() === desired.toLowerCase();
}

function ensureDetailOverlay() {
  let overlay = document.querySelector('#activityDetailOverlay');
  if (overlay) return overlay;

  overlay = document.createElement('div');
  overlay.id = 'activityDetailOverlay';
  overlay.className =
    'hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4 py-6';
  overlay.innerHTML = `
    <div class="max-w-3xl w-full bg-white rounded-xl shadow-soft overflow-hidden">
      <div class="flex items-center justify-between px-6 py-4 border-b">
        <h3 id="activityDetailTitle" class="text-lg font-semibold">Melding</h3>
        <button type="button" class="text-gray-500 hover:text-gray-800" data-close-activity aria-label="Sluiten">×</button>
      </div>
      <div id="activityDetailBody" class="px-6 py-4 space-y-4 text-sm text-gray-700"></div>
      <div class="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50">
        <button class="px-4 py-2 rounded-lg border" data-close-activity>Sluiten</button>
        <button class="px-4 py-2 rounded-lg bg-red-600 text-white" data-activity-action="cancel">Annuleer melding</button>
        <button class="px-4 py-2 rounded-lg bg-green-600 text-white" data-activity-action="complete">Markeer als afgerond</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.addEventListener('click', event => {
    if (event.target.dataset?.closeActivity || event.target === overlay) {
      closeActivityDetail();
    }
    const action = event.target.dataset?.activityAction;
    if (!action || !activeDetail) return;
    if (action === 'complete') {
      updateActivityStatus(activeDetail, 'Afgerond');
    }
    if (action === 'cancel') {
      updateActivityStatus(activeDetail, 'Geannuleerd');
    }
  });

  return overlay;
}

function updateActivityStatus(detail, nextStatus) {
  const truck = FLEET.find(item => item.id === detail.truckId);
  if (!truck) return;
  const activity = (truck.activity || []).find(entry => entry.id === detail.activityId);
  if (!activity) return;
  activity.status = nextStatus;
  activity.updatedAt = new Date().toISOString();
  if (nextStatus === 'Afgerond') {
    activity.completedAt = activity.updatedAt;
  }
  truck.openActivityCount = truck.activity.filter(item => item?.status === 'Open').length;
  closeActivityDetail();
  renderFleet();
  renderActivity();
  showToast(`Melding ${activity.id} is bijgewerkt naar ${nextStatus}.`, {
    variant: nextStatus === 'Geannuleerd' ? 'warning' : 'success'
  });
}

function renderDetail(truck, activity) {
  const overlay = ensureDetailOverlay();
  if (!overlay) return;

  overlay.querySelector('#activityDetailTitle').textContent = `${activity.id} • ${truck.id}`;
  overlay.querySelector('#activityDetailBody').innerHTML = `
    <div class="grid sm:grid-cols-2 gap-4">
      <div>
        <p class="text-xs uppercase text-gray-500">Status</p>
        <p class="font-medium">${activity.status}</p>
      </div>
      <div>
        <p class="text-xs uppercase text-gray-500">Type</p>
        <p class="font-medium">${activity.type}</p>
      </div>
      <div>
        <p class="text-xs uppercase text-gray-500">Aangemaakt op</p>
        <p class="font-medium">${fmtDate(activity.date)}</p>
      </div>
      <div>
        <p class="text-xs uppercase text-gray-500">Aangemaakt door</p>
        <p class="font-medium">${activity.createdBy || truck.customer?.name || 'Onbekend'}</p>
      </div>
    </div>
    <div class="border rounded-lg p-4 bg-gray-50">
      <p class="text-xs uppercase text-gray-500">Omschrijving</p>
      <p class="leading-relaxed">${activity.desc}</p>
    </div>
    <div>
      <p class="text-xs uppercase text-gray-500 mb-2">Communicatie</p>
      <ul class="space-y-2 text-sm">
        ${(activity.timeline || [
          { id: 'note-1', date: activity.date, author: 'Motrac Service', message: 'Melding ontvangen en ingepland.' }
        ])
          .map(
            entry => `
              <li class="border rounded-lg px-3 py-2">
                <div class="text-xs text-gray-500">${fmtDate(entry.date)} • ${entry.author || 'Onbekend'}</div>
                <p>${entry.message}</p>
              </li>`
          )
          .join('')}
      </ul>
    </div>
  `;

  overlay.classList.remove('hidden');
  activeDetail = { truckId: truck.id, activityId: activity.id };
}

/**
 * Opens the detail overlay for a selected activity card.
 */
export function openActivityDetail(truckId, activityId) {
  const truck = filterFleetByAccess(FLEET).find(item => item.id === truckId);
  if (!truck) {
    showToast('U heeft geen toegang tot deze melding.', { variant: 'error' });
    return;
  }
  const activity = (truck.activity || []).find(entry => entry.id === activityId);
  if (!activity) {
    showToast('Melding niet gevonden.', { variant: 'error' });
    return;
  }
  renderDetail(truck, activity);
}

/**
 * Closes the activity detail overlay.
 */
export function closeActivityDetail() {
  const overlay = document.querySelector('#activityDetailOverlay');
  if (!overlay) return;
  overlay.classList.add('hidden');
  activeDetail = null;
}

function formatCardFooter(activity) {
  const statusClass =
    activity.status === 'Open'
      ? 'bg-red-50 text-red-700'
      : activity.status === 'Afgerond'
      ? 'bg-green-50 text-green-700'
      : 'bg-amber-50 text-amber-700';
  return `<span class="text-xs px-2 py-1 rounded-full ${statusClass}">${activity.status}</span>`;
}

/**
 * Renders the activity cards using the selected filters.
 */
export function renderActivity() {
  const container = $('#activityList');
  const searchInput = $('#activitySearchInput');
  const locationFilter = $('#activityLocationFilter');
  if (!container || !searchInput || !locationFilter) {
    return;
  }

  populateStatusFilter();

  const query = searchInput.value.trim().toLowerCase();
  const location = locationFilter.value;
  const items = [];

  filterFleetByAccess(FLEET).forEach(truck => {
    if (!truck?.active) return;
    if (location !== 'Alle locaties' && truck.location !== location) return;
    const activities = Array.isArray(truck.activity) ? truck.activity : [];
    activities.forEach(activity => {
      const text = `${activity.id} ${activity.type} ${activity.desc} ${truck.id}`.toLowerCase();
      if (query && !text.includes(query)) return;
      if (!matchesStatusFilter(activity)) return;
      items.push({ truck, activity });
    });
  });

  container.innerHTML = items
    .map(({ truck, activity }) => `
    <article class="bg-white rounded-xl shadow-soft p-4 flex flex-col gap-2 focus-within:ring-2 focus-within:ring-motrac-red" tabindex="0" data-activity-card data-truck-id="${truck.id}" data-activity-id="${activity.id}">
      <div class="text-xs text-gray-500">${fmtDate(activity.date)} • ${activity.type}</div>
      <h4 class="font-semibold">${activity.id} – ${truck.id}</h4>
      <p class="text-sm text-gray-700 truncate-2">${activity.desc}</p>
      <div class="text-xs text-gray-500">Aangemaakt door ${activity.createdBy || truck.customer?.name || 'Onbekend'}</div>
      <div class="mt-2 flex items-center justify-between">
        ${formatCardFooter(activity)}
        <button class="text-sm underline" type="button" data-activity-open="${activity.id}" data-truck-id="${truck.id}">Details</button>
      </div>
    </article>`)
    .join('');

  $('#activityEmpty')?.classList.toggle('hidden', items.length !== 0);
}
