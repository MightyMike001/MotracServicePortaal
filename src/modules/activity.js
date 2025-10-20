import { FLEET, getFleetById } from '../data.js';
import { state } from '../state.js';
import { $, fmtDate, renderStatusBadge, getToneForActivityStatus } from '../utils.js';
import { filterFleetByAccess, canViewFleetAsset } from './access.js';
import { renderFleet } from './fleet.js';
import { syncFiltersToUrl } from './filterSync.js';
import { showToast } from './ui/toast.js';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Alle statussen' },
  { value: 'Open', label: 'Open' },
  { value: 'In behandeling', label: 'In behandeling' },
  { value: 'Afgerond', label: 'Afgerond' },
  { value: 'Geannuleerd', label: 'Geannuleerd' }
];

let activeDetail = null;
let ticketComposerInitialised = false;
let pendingTicketAttachments = [];

const STATUS_PROGRESS = {
  Open: 35,
  'In behandeling': 65,
  Afgerond: 100,
  Geannuleerd: 0
};

const PREVIEW_LIST_ID = 'ticketAttachmentPreview';

/**
 * Ensures the status select element exists and wires the change event.
 */
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
    syncFiltersToUrl();
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

/**
 * Lazily enhances the ticket creation modal with attachment previews.
 */
function ensureTicketComposer() {
  if (ticketComposerInitialised) {
    return;
  }

  const fileInput = $('#ticketPhotos');
  if (!fileInput) {
    return;
  }

  const previewList = ensureAttachmentPreviewContainer(fileInput);
  fileInput.addEventListener('change', async event => {
    const files = Array.from(event.target.files || []);
    await updatePendingAttachments(files);
    renderAttachmentPreview(previewList);
  });

  previewList.addEventListener('click', event => {
    const removeButton = event.target.closest('[data-remove-attachment]');
    if (!removeButton) return;
    event.preventDefault();
    removeAttachment(removeButton.dataset.removeAttachment);
    renderAttachmentPreview(previewList);
  });

  renderAttachmentPreview(previewList);

  ticketComposerInitialised = true;
}

/**
 * Ensures the preview container exists next to the file input.
 */
function ensureAttachmentPreviewContainer(fileInput) {
  let list = document.getElementById(PREVIEW_LIST_ID);
  if (list) {
    return list;
  }

  list = document.createElement('div');
  list.id = PREVIEW_LIST_ID;
  list.className = 'mt-3 grid gap-2 sm:grid-cols-2';
  list.setAttribute('aria-live', 'polite');
  list.setAttribute('aria-label', 'Geselecteerde bijlagen');

  const helper = document.createElement('p');
  helper.className = 'text-xs text-gray-500';
  helper.textContent = 'Bijlagen worden opgeslagen bij de melding en verschijnen hieronder.';

  const wrapper = document.createElement('div');
  wrapper.className = 'sm:col-span-2 flex flex-col gap-2';
  wrapper.appendChild(helper);
  wrapper.appendChild(list);

  fileInput.closest('[data-ticket-photos-container]')?.appendChild(wrapper);
  return list;
}

/**
 * Builds a list of attachment objects based on the current selection.
 */
async function updatePendingAttachments(files) {
  if (!files.length) {
    pendingTicketAttachments = [];
    return;
  }

  const mapped = await Promise.all(
    files.map(async file => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size ?? 0,
      previewUrl: await readFileAsDataUrl(file),
      isImage: Boolean(file.type && file.type.startsWith('image/'))
    }))
  );

  pendingTicketAttachments = mapped;
}

/**
 * Reads a File object as a data URL.
 */
function readFileAsDataUrl(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result));
    reader.addEventListener('error', () => resolve(null));
    reader.readAsDataURL(file);
  });
}

/**
 * Renders the pending attachments within the preview list.
 */
function renderAttachmentPreview(list) {
  if (!list) return;

  if (!pendingTicketAttachments.length) {
    list.innerHTML = '<p class="text-xs text-gray-500">Geen bijlagen geselecteerd.</p>';
    return;
  }

  list.innerHTML = pendingTicketAttachments
    .map(
      item => `
        <article class="border rounded-lg p-3 flex items-start gap-3 bg-gray-50">
          ${renderAttachmentPreviewVisual(item)}
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate" title="${item.name}">${item.name}</p>
            <p class="text-xs text-gray-500">${formatAttachmentSize(item.size)}</p>
          </div>
          <button class="text-xs text-gray-500 hover:text-red-600" data-remove-attachment="${item.id}" aria-label="Bijlage verwijderen">✕</button>
        </article>`
    )
    .join('');
}

/**
 * Returns a readable representation of the file size.
 */
function formatAttachmentSize(size) {
  if (!size) return '0 B';
  const kb = size / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }
  return `${(kb / 1024).toFixed(1)} MB`;
}

/**
 * Renders a thumbnail or fallback icon for the attachment preview.
 */
function renderAttachmentPreviewVisual(item) {
  if (item.isImage && item.previewUrl) {
    return `<img src="${item.previewUrl}" alt="Voorvertoning" class="w-12 h-12 rounded object-cover" />`;
  }

  const typeLabel = item.type.includes('/') ? item.type.split('/')[1] : 'FILE';
  return `
    <span class="w-12 h-12 flex items-center justify-center rounded bg-gray-200 text-gray-600 text-xs font-semibold">
      ${typeLabel.toUpperCase()}
    </span>`;
}

/**
 * Removes a specific attachment from the pending list.
 */
function removeAttachment(id) {
  pendingTicketAttachments = pendingTicketAttachments.filter(item => item.id !== id);
}

/**
 * Exposes the pending attachments for ticket creation and clears them.
 */
export function consumeTicketAttachments() {
  const attachments = pendingTicketAttachments.map(item => ({ ...item }));
  pendingTicketAttachments = [];
  const list = document.getElementById(PREVIEW_LIST_ID);
  if (list) {
    renderAttachmentPreview(list);
  }
  const fileInput = $('#ticketPhotos');
  if (fileInput) {
    fileInput.value = '';
  }
  return attachments;
}

/**
 * Allows other modules to trigger the composer setup.
 */
export function initActivityComposer() {
  ensureTicketComposer();
}

/**
 * Clears the pending attachments without returning them.
 */
export function resetTicketAttachments() {
  pendingTicketAttachments = [];
  const list = document.getElementById(PREVIEW_LIST_ID);
  if (list) {
    renderAttachmentPreview(list);
  }
  const fileInput = $('#ticketPhotos');
  if (fileInput) {
    fileInput.value = '';
  }
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
  const truck = getFleetById(detail.truckId);
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
    <div>
      <p class="text-xs uppercase text-gray-500 mb-1">Voortgang</p>
      ${renderProgressBar(activity)}
    </div>
    <div class="border rounded-lg p-4 bg-gray-50">
      <p class="text-xs uppercase text-gray-500">Omschrijving</p>
      <p class="leading-relaxed">${activity.desc}</p>
    </div>
    ${renderAttachmentSection(activity.attachments)}
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
  const truck = getFleetById(truckId);
  if (!truck || !canViewFleetAsset(truck)) {
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
  const statusBadge = renderStatusBadge(activity.status, getToneForActivityStatus(activity.status));
  const attachmentCount = Array.isArray(activity.attachments) ? activity.attachments.length : 0;
  const attachmentBadge =
    attachmentCount > 0
      ? `<span class="ml-2 inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-gray-200 text-gray-700" aria-label="${attachmentCount} bijlage${
          attachmentCount > 1 ? 'n' : ''
        }"><svg viewBox="0 0 20 20" class="w-3 h-3" fill="currentColor"><path d="M8 4a3 3 0 0 1 4.243 0l3.535 3.536a3 3 0 0 1 0 4.242l-5.657 5.657a4 4 0 1 1-5.657-5.657L10.414 6a1 1 0 0 1 1.414 1.414l-5.657 5.657a2 2 0 0 0 2.829 2.829l5.657-5.657a1 1 0 0 0 0-1.414L10.829 5.414A1 1 0 0 0 9.414 6.83l-4.95 4.95a.75.75 0 1 1-1.06-1.06l4.95-4.95A3 3 0 0 1 8 4Z"/></svg>${attachmentCount}</span>`
      : '';
  return `
    <span class="inline-flex items-center">
      ${statusBadge}
      ${attachmentBadge}
    </span>`;
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
  ensureTicketComposer();

  fadeActivityList(container);

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

/**
 * Public helper to refresh the activity overview after updates.
 */
export function refreshMeldingen() {
  renderActivity();
}

/**
 * Adds a short fade animation to smooth the activity list transition.
 */
function fadeActivityList(container) {
  container.style.transition = 'opacity 220ms ease';
  container.style.opacity = '0';
  requestAnimationFrame(() => {
    container.style.opacity = '1';
  });
}

/**
 * Renders a progress bar visual for the supplied activity.
 */
function renderProgressBar(activity) {
  const value = STATUS_PROGRESS[activity.status] ?? 50;
  return `
    <div class="h-2 bg-gray-200 rounded-full overflow-hidden" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${value}">
      <div class="h-full bg-motrac-red transition-all duration-500" style="width: ${value}%"></div>
    </div>`;
}

/**
 * Builds the attachment list for the activity detail panel.
 */
function renderAttachmentSection(attachments = []) {
  if (!Array.isArray(attachments) || attachments.length === 0) {
    return '';
  }

  const listItems = attachments
    .map(
      attachment => `
        <li class="border rounded-lg px-3 py-2 flex items-center gap-3">
          ${renderAttachmentPreviewVisual(attachment)}
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate" title="${attachment.name}">${attachment.name}</p>
            <p class="text-xs text-gray-500">${formatAttachmentSize(attachment.size)}</p>
          </div>
          ${attachment.previewUrl ? `<a class="text-xs underline" href="${attachment.previewUrl}" download="${attachment.name}">Download</a>` : ''}
        </li>`
    )
    .join('');

  return `
    <div>
      <p class="text-xs uppercase text-gray-500 mb-2">Bijlagen</p>
      <ul class="space-y-2">${listItems}</ul>
    </div>`;
}
