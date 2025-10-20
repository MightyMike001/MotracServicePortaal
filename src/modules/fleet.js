import { LOCATIONS, FLEET, getFleetById } from '../data.js';
import { state } from '../state.js';
import { $, fmtDate, formatCustomerOwnership } from '../utils.js';
import { filterFleetByAccess, ensureAccessibleLocation } from './access.js';
import { showToast } from './ui/toast.js';

const LOCATION_STORAGE_KEY = 'motrac:lastLocation';

const BMW_STATUS_OPTIONS = ['Goedgekeurd', 'Afkeur', 'In behandeling'];

let bmwModalState = { truckId: null };

/**
 * Stores the location filter preference so it persists across sessions.
 */
function persistLocationPreference(value) {
  try {
    if (value) {
      localStorage.setItem(LOCATION_STORAGE_KEY, value);
    } else {
      localStorage.removeItem(LOCATION_STORAGE_KEY);
    }
  } catch (error) {
    console.warn('Kon locatievoorkeur niet opslaan.', error);
  }
}

/**
 * Reads the cached location preference from localStorage.
 */
function getLocationPreference() {
  try {
    return localStorage.getItem(LOCATION_STORAGE_KEY);
  } catch (error) {
    console.warn('Kon locatievoorkeur niet laden.', error);
    return null;
  }
}

/**
 * Returns the unique location names that exist within the accessible fleet set.
 */
function getAccessibleLocations(accessibleFleet) {
  return new Set(
    accessibleFleet
      .map(truck => truck?.location)
      .filter(location => typeof location === 'string' && location.trim() !== '')
  );
}

/**
 * Builds the dropdown options for the location filter based on access rules.
 */
function getLocationOptions(accessibleFleet) {
  const baseLocations = Array.isArray(LOCATIONS) && LOCATIONS.length ? LOCATIONS : ['Alle locaties'];
  const accessibleSet = getAccessibleLocations(accessibleFleet);

  const allowed = baseLocations.filter(location => {
    if (location === 'Alle locaties') return true;
    if (!accessibleSet.size) return true;
    return accessibleSet.has(location);
  });

  return allowed.length ? allowed : baseLocations;
}

/**
 * Ensures the stored location filter is valid for the current role.
 */
function resolveFilterLocation(allowedLocations) {
  const stored = getLocationPreference();
  const desired = stored || state.fleetFilter.location;
  const resolved = ensureAccessibleLocation(desired, allowedLocations);
  state.fleetFilter.location = resolved;
  persistLocationPreference(resolved);
  return resolved;
}

/**
 * Populates a select element with the provided options.
 */
function renderSelectOptions(select, options, selectedValue) {
  if (!select) return;
  const previousValue = select.value;
  const markup = options.map(location => `<option value="${location}">${location}</option>`).join('');
  if (select.dataset.renderHash !== markup) {
    select.innerHTML = markup;
    select.dataset.renderHash = markup;
  }
  if (selectedValue != null) {
    select.value = selectedValue;
  } else if (select.dataset.renderHash === markup && previousValue) {
    const hasPrevious = Array.from(select.options).some(option => option.value === previousValue);
    if (hasPrevious) {
      select.value = previousValue;
    }
  }
}

/**
 * Populates the ticket creation dropdown with trucks the user may select.
 */
function renderTicketOptions(select, accessibleFleet) {
  if (!select) return;
  const activeFleet = accessibleFleet.filter(truck => truck?.active);
  const previousValue = select.value;
  const markup = activeFleet
    .map(truck => `<option value="${truck.id}">${truck.id} — ${truck.location || 'Onbekende locatie'}</option>`)
    .join('');
  if (select.dataset.renderHash !== markup) {
    select.innerHTML = markup;
    select.dataset.renderHash = markup;
    if (previousValue) {
      const hasPrevious = Array.from(select.options).some(option => option.value === previousValue);
      if (hasPrevious) {
        select.value = previousValue;
      }
    }
  }
}

/**
 * Finds a truck by id in the global fleet dataset.
 */
function findTruckById(truckId) {
  return getFleetById(truckId);
}

/**
 * Ensures the BMWT status modal exists and wires events once.
 */
function ensureBmwModal() {
  let modal = document.getElementById('fleetBmwModal');
  if (modal) {
    return modal;
  }

  modal = document.createElement('div');
  modal.id = 'fleetBmwModal';
  modal.className = 'modal fixed inset-0 bg-black/40 items-center justify-center p-4';
  modal.innerHTML = `
    <div class="bg-white w-full max-w-md rounded-xl shadow-soft p-6 space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">BMWT-status bijwerken</h3>
        <button type="button" data-close aria-label="Sluiten" class="text-gray-500">✕</button>
      </div>
      <form class="space-y-4">
        <div>
          <label class="text-sm text-gray-600" for="bmwStatusSelect">Status</label>
          <select id="bmwStatusSelect" class="mt-1 w-full border rounded-lg px-3 py-2">
            ${BMW_STATUS_OPTIONS.map(status => `<option value="${status}">${status}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="text-sm text-gray-600" for="bmwExpiryInput">Vervaldatum</label>
          <input id="bmwExpiryInput" type="date" class="mt-1 w-full border rounded-lg px-3 py-2" />
        </div>
        <div class="flex justify-end gap-2">
          <button type="button" data-close class="px-4 py-2 border rounded-lg">Annuleren</button>
          <button type="submit" class="px-4 py-2 bg-motrac-red text-white rounded-lg">Opslaan</button>
        </div>
      </form>
    </div>`;

  document.body.appendChild(modal);

  const close = () => closeBmwModal();
  modal.addEventListener('click', event => {
    if (event.target === modal || event.target.dataset.close !== undefined) {
      close();
    }
  });

  modal.querySelector('form')?.addEventListener('submit', event => {
    event.preventDefault();
    saveBmwChanges(modal);
  });

  return modal;
}

/**
 * Closes the BMWT modal and resets state.
 */
function closeBmwModal() {
  const modal = document.getElementById('fleetBmwModal');
  if (!modal) return;
  modal.classList.remove('show');
  bmwModalState = { truckId: null };
}

/**
 * Saves updates from the BMWT modal back into the dataset.
 */
function saveBmwChanges(modal) {
  const truckId = bmwModalState.truckId;
  const truck = findTruckById(truckId);
  if (!truck) {
    showToast('Geen truck geselecteerd voor BMWT-bijwerking.', { variant: 'error' });
    closeBmwModal();
    return;
  }

  const statusSelect = modal.querySelector('#bmwStatusSelect');
  const expiryInput = modal.querySelector('#bmwExpiryInput');
  const status = statusSelect?.value?.trim();
  const expiry = expiryInput?.value;

  if (!status) {
    showToast('Selecteer een geldige BMWT-status.', { variant: 'error' });
    return;
  }

  if (!expiry) {
    showToast('Geef een vervaldatum op.', { variant: 'error' });
    return;
  }

  truck.bmwStatus = status;
  truck.bmwExpiry = expiry;
  truck.bmwUpdatedAt = new Date().toISOString();

  closeBmwModal();
  renderFleet();
  showToast(`BMWT-status voor ${truck.id} bijgewerkt.`, { variant: 'success' });
}

/**
 * Opens the BMWT modal for the provided truck id.
 */
export function openBmwEditor(truckId) {
  const truck = findTruckById(truckId);
  if (!truck) {
    showToast('Truck niet gevonden voor BMWT-bewerking.', { variant: 'error' });
    return;
  }

  const modal = ensureBmwModal();
  const statusSelect = modal.querySelector('#bmwStatusSelect');
  const expiryInput = modal.querySelector('#bmwExpiryInput');

  if (statusSelect) {
    statusSelect.value = BMW_STATUS_OPTIONS.includes(truck.bmwStatus) ? truck.bmwStatus : BMW_STATUS_OPTIONS[0];
  }
  if (expiryInput) {
    expiryInput.value = truck.bmwExpiry ? truck.bmwExpiry.substring(0, 10) : '';
  }

  bmwModalState.truckId = truck.id;
  modal.classList.add('show');
  statusSelect?.focus();
}

/**
 * Populates all location-based dropdowns with the accessible set for the role.
 */
export function populateLocationFilters() {
  const locationFilter = $('#locationFilter');
  const activityFilter = $('#activityLocationFilter');
  const userLocationSelect = $('#userLocation');
  const ticketSelect = $('#ticketTruck');

  const accessibleFleet = filterFleetByAccess(FLEET);
  const allowedLocations = getLocationOptions(accessibleFleet);
  const resolvedLocation = resolveFilterLocation(allowedLocations);

  renderSelectOptions(locationFilter, allowedLocations, resolvedLocation);

  if (activityFilter) {
    const activityOptions = allowedLocations.includes('Alle locaties')
      ? allowedLocations
      : ['Alle locaties', ...allowedLocations];
    renderSelectOptions(activityFilter, activityOptions, resolvedLocation);
  }

  if (userLocationSelect) {
    const customerLocations = allowedLocations.filter(location => location !== 'Alle locaties');
    renderSelectOptions(userLocationSelect, customerLocations, customerLocations[0]);
  }

  renderTicketOptions(ticketSelect, accessibleFleet);
}

function filteredFleet() {
  const queryValue = state.fleetFilter.query;
  const query = queryValue ? queryValue.trim().toLowerCase() : '';
  const location = state.fleetFilter.location;
  const accessibleFleet = filterFleetByAccess(FLEET);

  return accessibleFleet.filter(truck => {
    if (!truck?.active) {
      return false;
    }

    if (location && location !== 'Alle locaties' && truck.location !== location) {
      return false;
    }

    if (!query) {
      return true;
    }

    const fields = [
      truck.id,
      truck.ref,
      truck.model,
      truck.modelType,
      truck.contract?.nummer,
      truck.location,
      truck.fleetName,
      truck.ownershipLabel,
      truck.customer?.name,
      truck.customer?.subLocation
    ];

    for (const field of fields) {
      if (field == null) continue;
      if (String(field).toLowerCase().includes(query)) {
        return true;
      }
    }

    return false;
  });
}

function renderEmptyState(tableBody) {
  tableBody.innerHTML =
    '<tr><td colspan="5" class="py-6 px-3 text-center text-gray-500">Geen resultaten binnen het huidige filter.</td></tr>';
}

/**
 * Renders the table rows for the provided fleet entries.
 */
function renderRows(tableBody, entries) {
  const rows = entries.map(truck => {
    return `
      <tr class="border-b hover:bg-gray-50 focus-within:bg-gray-50 transition-colors">
        <td class="py-3 px-3" data-label="Serienummer / Referentie">
          <div class="flex items-start gap-3">
            <button class="text-left text-gray-900 hover:underline focus:underline focus:outline-none flex-1" data-open-detail="${truck.id}">
              <div class="font-medium">${truck.id}</div>
              <div class="text-xs text-gray-500">${truck.ref}</div>
              <div class="text-xs text-gray-400">Voor: ${formatCustomerOwnership(truck.customer, truck.fleetName || '—')}</div>
            </button>
            <div class="relative inline-block kebab">
              <button class="px-2 py-1 border rounded-lg" aria-haspopup="true" aria-expanded="false" aria-label="Acties voor ${truck.id}">⋮</button>
              <div class="kebab-menu hidden absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow-soft z-10">
                <button class="w-full text-left px-4 py-2 hover:bg-gray-50" data-action="newTicket" data-id="${truck.id}">Melding aanmaken</button>
                <button class="w-full text-left px-4 py-2 hover:bg-gray-50" data-action="updateOdo" data-id="${truck.id}">Urenstand doorgeven</button>
                <button class="w-full text-left px-4 py-2 hover:bg-gray-50" data-action="editRef" data-id="${truck.id}">Uw referentie wijzigen</button>
                <button class="w-full text-left px-4 py-2 hover:bg-gray-50" data-action="showContract" data-id="${truck.id}">Contract inzien</button>
                <button class="w-full text-left px-4 py-2 hover:bg-gray-50" data-action="editBmw" data-id="${truck.id}">BMWT-status bewerken</button>
                <button class="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600" data-action="inactive" data-id="${truck.id}">Verwijderen uit lijst</button>
              </div>
            </div>
          </div>
        </td>
        <td class="py-3 px-3" data-label="Modeltype">${truck.modelType || '—'}</td>
        <td class="py-3 px-3" data-label="Model">${truck.model}</td>
        <td class="py-3 px-3" data-label="BMWT‑status">${truck.bmwStatus}</td>
        <td class="py-3 px-3" data-label="BMWT‑vervaldatum">${fmtDate(truck.bmwExpiry)}</td>
      </tr>`;
  });

  tableBody.innerHTML = rows.join('');
  animateTableBody(tableBody);
}

/**
 * Returns the shared loading overlay for the fleet table and creates it lazily.
 */
function getLoadingOverlay() {
  let overlay = document.querySelector('#fleetLoadingOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'fleetLoadingOverlay';
    overlay.className =
      'hidden absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center text-gray-600 text-sm';
    overlay.innerHTML = `
      <div class="flex items-center gap-3">
        <svg class="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.2" stroke-width="4"></circle>
          <path d="M22 12a10 10 0 00-10-10" stroke-width="4" stroke-linecap="round"></path>
        </svg>
        <span>Data wordt geladen…</span>
      </div>`;
    const tableWrapper = $('#tab-vloot .responsive-table');
    if (tableWrapper) {
      tableWrapper.style.position = 'relative';
      tableWrapper.appendChild(overlay);
    }
  }
  return overlay;
}

/**
 * Toggles the loading overlay for the fleet table.
 */
export function setFleetLoading(isLoading) {
  const overlay = getLoadingOverlay();
  if (!overlay) return;
  overlay.classList.toggle('hidden', !isLoading);
}

/**
 * Adds a fade animation after the table content changes to soften transitions.
 */
function animateTableBody(tableBody) {
  if (!tableBody) return;
  tableBody.style.transition = 'opacity 220ms ease';
  tableBody.style.opacity = '0';
  requestAnimationFrame(() => {
    tableBody.style.opacity = '1';
  });
}

/**
 * Renders the fleet table according to the active filters and access rules.
 */
export function renderFleet() {
  const tableBody = $('#fleetTbody');
  if (!tableBody) return;

  const entries = filteredFleet();
  if (!entries.length) {
    renderEmptyState(tableBody);
    animateTableBody(tableBody);
    return;
  }

  renderRows(tableBody, entries);
}

/**
 * Updates the state and persistence when the location filter changes.
 */
export function updateLocationFilter(nextLocation) {
  state.fleetFilter.location = nextLocation;
  persistLocationPreference(nextLocation);
  const activityLocationFilter = $('#activityLocationFilter');
  if (activityLocationFilter && activityLocationFilter.value !== nextLocation) {
    const options = Array.from(activityLocationFilter.options);
    if (options.some(option => option.value === nextLocation)) {
      activityLocationFilter.value = nextLocation;
    } else if (options.some(option => option.value === 'Alle locaties')) {
      activityLocationFilter.value = 'Alle locaties';
    } else if (options.length) {
      activityLocationFilter.value = options[0].value;
    }
  }
}

/**
 * Clears all fleet filters back to their defaults.
 */
export function resetFleetFilters() {
  state.fleetFilter.location = 'Alle locaties';
  state.fleetFilter.query = '';
  persistLocationPreference('Alle locaties');
  const locationFilter = $('#locationFilter');
  if (locationFilter) {
    locationFilter.value = 'Alle locaties';
  }
  const searchInput = $('#searchInput');
  if (searchInput) {
    searchInput.value = '';
  }
  const activityLocationFilter = $('#activityLocationFilter');
  if (activityLocationFilter) {
    const options = Array.from(activityLocationFilter.options);
    if (options.some(option => option.value === 'Alle locaties')) {
      activityLocationFilter.value = 'Alle locaties';
    } else if (options.length) {
      activityLocationFilter.value = options[0].value;
    }
  }
}
