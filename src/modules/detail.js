import { getFleetById } from '../data.js';
import { state } from '../state.js';
import {
  $,
  fmtDate,
  formatCustomerOwnership,
  formatHoursHtml,
  renderStatusBadge,
  getToneForBmwStatus,
  getToneForActivityStatus,
  openModal
} from '../utils.js';
import { canViewFleetAsset } from './access.js';

const DETAIL_MODAL_SELECTOR = '#vehicleDetailModal';

let modalInitialised = false;

function ensureModalListeners() {
  if (modalInitialised) return;
  const modal = $(DETAIL_MODAL_SELECTOR);
  if (!modal) return;

  modal.addEventListener('close', () => {
    if (state.selectedTruckId) {
      state.selectedTruckId = null;
    }
  });

  modalInitialised = true;
}

function renderHeader(truck) {
  const titleEl = $('#vehicleDetailTitle');
  if (titleEl) {
    titleEl.textContent = truck.id;
  }

  const subtitleEl = $('#vehicleDetailSubtitle');
  if (subtitleEl) {
    subtitleEl.textContent = truck.ref || '—';
  }

  const metaEl = $('#vehicleDetailMeta');
  if (metaEl) {
    const metaItems = [
      truck.modelType ? `Modeltype: ${truck.modelType}` : null,
      truck.model ? `Model: ${truck.model}` : null,
      truck.location ? `Locatie: ${truck.location}` : null,
      formatCustomerOwnership(truck.customer, truck.fleetName || '—')
    ].filter(Boolean);

    metaEl.innerHTML = metaItems
      .map(item => `
        <span class="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
          ${item}
        </span>
      `)
      .join('');
  }
}

function renderFacts(truck) {
  const factsEl = $('#vehicleDetailFacts');
  if (!factsEl) return;

  const facts = [
    ['Vloot', truck.fleetName || '—'],
    ['Eigenaar', formatCustomerOwnership(truck.customer, truck.fleetName || '—')],
    ['Status', renderStatusBadge(truck.bmwStatus, getToneForBmwStatus(truck.bmwStatus))],
    ['BMWT-vervaldatum', fmtDate(truck.bmwExpiry)],
    ['Urenstand (datum)', formatHoursHtml(truck.hours, truck.hoursDate)],
    ['Contractnummer', truck.contract?.nummer || '—']
  ];

  factsEl.innerHTML = facts
    .map(([label, value]) => `
      <div class="rounded-lg bg-gray-50 p-3">
        <div class="text-xs text-gray-500">${label}</div>
        <div class="font-medium">${value}</div>
      </div>
    `)
    .join('');
}

function renderMaintenance(truck) {
  const container = $('#vehicleDetailMaintenance');
  const counter = $('#vehicleDetailMaintenanceCount');
  if (!container || !counter) return;

  const history = Array.isArray(truck.maintenanceHistory) ? truck.maintenanceHistory : [];
  counter.textContent = history.length
    ? `${history.length} ${history.length === 1 ? 'melding' : 'meldingen'}`
    : 'Geen meldingen';

  if (!history.length) {
    container.innerHTML = '<p class="text-sm text-gray-500">Geen onderhoudshistorie beschikbaar.</p>';
    return;
  }

  container.innerHTML = history
    .map(entry => `
      <article class="rounded-lg border border-gray-200 p-4">
        <div class="flex flex-wrap items-center justify-between gap-3 text-sm">
          <div class="font-semibold text-gray-800">${entry.type}</div>
          <div class="text-xs text-gray-500">${fmtDate(entry.date)}</div>
        </div>
        <div class="mt-2 text-sm text-gray-600">${entry.description || '—'}</div>
        <div class="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
          ${entry.technician ? `<span>Technicus: ${entry.technician}</span>` : ''}
          ${entry.status ? renderStatusBadge(entry.status, getToneForActivityStatus(entry.status)) : ''}
          ${entry.hours ? `<span>Urenstand: ${entry.hours}</span>` : ''}
        </div>
      </article>
    `)
    .join('');
}

function renderBmwt(truck) {
  const container = $('#vehicleDetailBmwt');
  if (!container) return;

  const data = truck.bmwt || {};
  const items = [
    ['Huidige status', renderStatusBadge(data.status || truck.bmwStatus, getToneForBmwStatus(data.status || truck.bmwStatus))],
    ['Vervaldatum', fmtDate(data.expiry || truck.bmwExpiry)],
    ['Laatste keuring', fmtDate(data.lastInspection)],
    ['Inspecteur', data.inspector || 'Onbekend'],
    ['Opmerkingen', data.remarks || 'Geen opmerkingen beschikbaar.']
  ];

  container.innerHTML = items
    .map(([label, value]) => `
      <div class="rounded-lg border border-gray-200 p-3">
        <div class="text-xs text-gray-500">${label}</div>
        <div class="mt-1 text-sm font-medium text-gray-800">${value}</div>
      </div>
    `)
    .join('');

  if (data.certificateUrl) {
    container.innerHTML += `
      <div class="rounded-lg border border-gray-200 p-3 sm:col-span-2">
        <div class="text-xs text-gray-500">Certificaat</div>
        <a href="${data.certificateUrl}" class="mt-1 inline-flex items-center text-sm font-medium text-motrac-red hover:underline">${
          data.certificateName || 'BMWT certificaat'
        }</a>
      </div>
    `;
  }
}

function renderDocuments(truck) {
  const container = $('#vehicleDetailDocuments');
  if (!container) return;

  const documents = Array.isArray(truck.documents) ? truck.documents : [];

  if (!documents.length) {
    container.innerHTML = '<div class="px-4 py-6 text-sm text-gray-500">Geen documenten gevonden voor dit voertuig.</div>';
    return;
  }

  container.innerHTML = documents
    .map(
      doc => `
        <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <div class="text-sm font-medium text-gray-800">${doc.name}</div>
            <div class="text-xs text-gray-500">
              ${doc.type || 'Document'} • ${fmtDate(doc.updatedAt)}${doc.size ? ` • ${doc.size}` : ''}
            </div>
          </div>
          <a
            href="${doc.url || '#'}"
            class="text-sm font-medium text-motrac-red hover:underline"
            target="_blank"
            rel="noreferrer"
          >Download</a>
        </div>
      `
    )
    .join('');
}

function renderDetail(truck) {
  renderHeader(truck);
  renderFacts(truck);
  renderMaintenance(truck);
  renderBmwt(truck);
  renderDocuments(truck);
}

export function openDetail(id) {
  const truck = getFleetById(id);
  if (!truck || !canViewFleetAsset(truck)) return;

  state.selectedTruckId = truck.id;

  ensureModalListeners();
  renderDetail(truck);

  const modal = $(DETAIL_MODAL_SELECTOR);
  if (modal) {
    modal.scrollTop = 0;
    modal.dataset.truckId = truck.id;
  }

  openModal(DETAIL_MODAL_SELECTOR);
}

export function refreshDetail() {
  const modal = $(DETAIL_MODAL_SELECTOR);
  if (!modal || !modal.open) {
    return;
  }

  const truckId = modal.dataset.truckId || state.selectedTruckId;
  if (!truckId) {
    return;
  }

  const truck = getFleetById(truckId);
  if (!truck || !canViewFleetAsset(truck)) {
    return;
  }

  renderDetail(truck);
}
