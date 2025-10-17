import { LOCATIONS, FLEET } from '../data.js';
import { state } from '../state.js';
import { $, fmtDate, formatHoursHtml, formatCustomerOwnership } from '../utils.js';
import { filterFleetByAccess, ensureAccessibleLocation } from './access.js';

const LOCATION_STORAGE_KEY = 'motrac:lastLocation';

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

function getLocationPreference() {
  try {
    return localStorage.getItem(LOCATION_STORAGE_KEY);
  } catch (error) {
    console.warn('Kon locatievoorkeur niet laden.', error);
    return null;
  }
}

function getAccessibleLocations(accessibleFleet) {
  return new Set(
    accessibleFleet
      .map(truck => truck?.location)
      .filter(location => typeof location === 'string' && location.trim() !== '')
  );
}

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

function resolveFilterLocation(allowedLocations) {
  const stored = getLocationPreference();
  const desired = stored || state.fleetFilter.location;
  const resolved = ensureAccessibleLocation(desired, allowedLocations);
  state.fleetFilter.location = resolved;
  persistLocationPreference(resolved);
  return resolved;
}

function renderSelectOptions(select, options, selectedValue) {
  if (!select) return;
  select.innerHTML = options
    .map(location => `<option value="${location}">${location}</option>`)
    .join('');
  if (selectedValue) {
    select.value = selectedValue;
  }
}

function renderTicketOptions(select, accessibleFleet) {
  if (!select) return;
  const activeFleet = accessibleFleet.filter(truck => truck?.active);
  select.innerHTML = activeFleet
    .map(truck => `<option value="${truck.id}">${truck.id} — ${truck.location || 'Onbekende locatie'}</option>`)
    .join('');
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
  const query = state.fleetFilter.query.trim().toLowerCase();
  const location = state.fleetFilter.location;
  return filterFleetByAccess(FLEET)
    .filter(truck => truck?.active)
    .filter(truck => location === 'Alle locaties' || truck.location === location)
    .filter(truck => {
      if (!query) return true;
      return [
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
      ]
        .map(value => (value == null ? '' : String(value)))
        .some(value => value.toLowerCase().includes(query));
    });
}

function renderEmptyState(tableBody) {
  tableBody.innerHTML =
    '<tr><td colspan="12" class="py-6 px-3 text-center text-gray-500">Geen resultaten binnen het huidige filter.</td></tr>';
}

function renderRows(tableBody, entries) {
  const rows = entries.map(truck => {
    const activityList = Array.isArray(truck.activity) ? truck.activity : [];
    const openCount =
      typeof truck.openActivityCount === 'number'
        ? truck.openActivityCount
        : activityList.filter(activity => activity?.status === 'Open').length;
    return `
      <tr class="border-b hover:bg-gray-50 focus-within:bg-gray-50 transition-colors">
        <td class="py-3 px-3" data-label="Serienummer / Referentie">
          <button class="text-left text-gray-900 hover:underline focus:underline focus:outline-none" data-open-detail="${truck.id}">
            <div class="font-medium">${truck.id}</div>
            <div class="text-xs text-gray-500">${truck.ref}</div>
            <div class="text-xs text-gray-400">Voor: ${formatCustomerOwnership(truck.customer, truck.fleetName || '—')}</div>
          </button>
        </td>
        <td class="py-3 px-3" data-label="Modeltype">${truck.modelType || '—'}</td>
        <td class="py-3 px-3" data-label="Model">${truck.model}</td>
        <td class="py-3 px-3" data-label="BMWT‑status">${truck.bmwStatus}</td>
        <td class="py-3 px-3" data-label="BMWT‑vervaldatum">${fmtDate(truck.bmwExpiry)}</td>
        <td class="py-3 px-3" data-label="Locatie">${truck.location || '—'}</td>
        <td class="py-3 px-3" data-label="Urenstand (datum)">${formatHoursHtml(truck.hours, truck.hoursDate)}</td>
        <td class="py-3 px-3" data-label="Contractnummer">${truck.contract?.nummer || '—'}</td>
        <td class="py-3 px-3" data-label="Contract startdatum">${fmtDate(truck.contract?.start)}</td>
        <td class="py-3 px-3" data-label="Contract einddatum">${fmtDate(truck.contract?.eind)}</td>
        <td class="py-3 px-3" data-label="Openstaande meldingen">
          <button class="inline-flex items-center justify-center w-8 h-8 rounded-full border border-red-200 bg-red-50 text-red-700 font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-red-300" title="Open meldingen" data-open-detail="${truck.id}">${openCount}</button>
        </td>
        <td class="py-3 px-3 sm:text-right" data-label="Acties">
          <div class="relative inline-block kebab">
            <button class="px-2 py-1 border rounded-lg" aria-haspopup="true" aria-expanded="false">⋮</button>
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
  });

  tableBody.innerHTML = rows.join('');
}

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
 * Renders the fleet table according to the active filters and access rules.
 */
export function renderFleet() {
  const tableBody = $('#fleetTbody');
  if (!tableBody) return;

  const entries = filteredFleet();
  if (!entries.length) {
    renderEmptyState(tableBody);
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
}
