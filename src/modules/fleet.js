import { LOCATIONS, FLEET } from '../data.js';
import { state } from '../state.js';
import { $, fmtDate, formatOdoHtml } from '../utils.js';
import { filterFleetByAccess, ensureAccessibleLocation } from './access.js';

export function populateLocationFilters() {
  const locationFilter = $('#locationFilter');
  const activityFilter = $('#activityLocationFilter');
  const userLocationSelect = $('#userLocation');
  const ticketSelect = $('#ticketTruck');

  const baseLocations = Array.isArray(LOCATIONS) && LOCATIONS.length ? LOCATIONS : ['Alle locaties'];
  const accessibleFleet = filterFleetByAccess(FLEET);
  const accessibleLocationSet = new Set(
    accessibleFleet
      .map(truck => truck?.location)
      .filter(location => typeof location === 'string' && location.trim() !== '')
  );

  let allowedLocations = baseLocations.filter(
    location => location === 'Alle locaties' || accessibleLocationSet.has(location)
  );

  if (!allowedLocations.length) {
    allowedLocations = baseLocations.includes('Alle locaties') ? ['Alle locaties'] : [baseLocations[0]];
  }

  const resolvedLocation = ensureAccessibleLocation(state.fleetFilter.location, allowedLocations);
  state.fleetFilter.location = resolvedLocation;

  if (locationFilter) {
    locationFilter.innerHTML = allowedLocations
      .map(location => {
        const selected = location === state.fleetFilter.location ? 'selected' : '';
        return `<option ${selected}>${location}</option>`;
      })
      .join('');
  }

  if (activityFilter) {
    activityFilter.innerHTML = allowedLocations.map(location => `<option>${location}</option>`).join('');
    const activityValue = allowedLocations.includes('Alle locaties') ? 'Alle locaties' : allowedLocations[0] || '';
    activityFilter.value = activityValue;
  }

  if (userLocationSelect) {
    userLocationSelect.innerHTML = allowedLocations
      .filter(location => location !== 'Alle locaties')
      .map(location => `<option>${location}</option>`)
      .join('');
  }

  if (ticketSelect) {
    const activeAccessibleFleet = accessibleFleet.filter(truck => truck?.active);
    ticketSelect.innerHTML = activeAccessibleFleet
      .map(truck => `<option value="${truck.id}">${truck.id} — ${truck.location || 'Onbekende locatie'}</option>`)
      .join('');
  }
}

function filteredFleet() {
  const query = state.fleetFilter.query.trim().toLowerCase();
  return filterFleetByAccess(FLEET)
    .filter(truck => truck?.active)
    .filter(truck => state.fleetFilter.location === 'Alle locaties' || truck.location === state.fleetFilter.location)
    .filter(truck => {
      if (!query) return true;
      return [truck.id, truck.ref, truck.model]
        .map(value => (value == null ? '' : String(value)))
        .some(value => value.toLowerCase().includes(query));
    });
}

export function renderFleet() {
  const tableBody = $('#fleetTbody');
  if (!tableBody) return;

  const rows = filteredFleet().map(truck => {
    const activityList = Array.isArray(truck.activity) ? truck.activity : [];
    const openCount = activityList.filter(activity => activity?.status === 'Open').length;
    return `
      <tr class="border-b hover:bg-gray-50">
        <td class="py-3 px-3" data-label="Serienummer / Referentie">
          <button class="text-left text-gray-900 hover:underline" data-open-detail="${truck.id}">
            <div class="font-medium">${truck.id}</div>
            <div class="text-xs text-gray-500">${truck.ref}</div>
          </button>
        </td>
        <td class="py-3 px-3" data-label="Vloot">${truck.fleetName || '—'}</td>
        <td class="py-3 px-3" data-label="Model">${truck.model}</td>
        <td class="py-3 px-3" data-label="BMWT‑status">${truck.bmwStatus}</td>
        <td class="py-3 px-3" data-label="BMWT‑vervaldatum">${fmtDate(truck.bmwExpiry)}</td>
        <td class="py-3 px-3" data-label="Tellerstand (datum)">${formatOdoHtml(truck.odo, truck.odoDate)}</td>
        <td class="py-3 px-3" data-label="Activiteit">
          <button class="inline-flex items-center justify-center w-7 h-7 bg-red-100 text-motrac-red rounded-full font-semibold" title="Open meldingen" data-open-detail="${truck.id}">${openCount}</button>
        </td>
        <td class="py-3 px-3 sm:text-right" data-label="Acties">
          <div class="relative inline-block kebab">
            <button class="px-2 py-1 border rounded-lg">⋮</button>
            <div class="kebab-menu hidden absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow-soft z-10">
              <button class="w-full text-left px-4 py-2 hover:bg-gray-50" data-action="newTicket" data-id="${truck.id}">Melding aanmaken</button>
              <button class="w-full text-left px-4 py-2 hover:bg-gray-50" data-action="updateOdo" data-id="${truck.id}">Tellerstand doorgeven</button>
              <button class="w-full text-left px-4 py-2 hover:bg-gray-50" data-action="editRef" data-id="${truck.id}">Uw referentie wijzigen</button>
              <button class="w-full text-left px-4 py-2 hover:bg-gray-50" data-action="showContract" data-id="${truck.id}">Contract inzien</button>
              <button class="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600" data-action="inactive" data-id="${truck.id}">Verwijderen uit lijst</button>
            </div>
          </div>
        </td>
      </tr>`;
  }).join('');

  tableBody.innerHTML =
    rows || '<tr><td colspan="8" class="py-6 px-3 text-center text-gray-500">Geen resultaten</td></tr>';
}
