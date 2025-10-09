import { LOCATIONS, FLEET } from '../data.js';
import { state } from '../state.js';
import { $, fmtDate } from '../utils.js';

export function populateLocationFilters() {
  if (!LOCATIONS.includes(state.fleetFilter.location)) {
    state.fleetFilter.location = LOCATIONS[0] || 'Alle locaties';
  }
  const locOptions = LOCATIONS.map(location => {
    const selected = location === state.fleetFilter.location ? 'selected' : '';
    return `<option ${selected}>${location}</option>`;
  }).join('');
  $('#locationFilter').innerHTML = locOptions;
  $('#activityLocationFilter').innerHTML = LOCATIONS.map(location => `<option>${location}</option>`).join('');
  $('#activityLocationFilter').value = 'Alle locaties';
  $('#userLocation').innerHTML = LOCATIONS.filter(location => location !== 'Alle locaties')
    .map(location => `<option>${location}</option>`)
    .join('');
  $('#ticketTruck').innerHTML = FLEET.filter(truck => truck.active)
    .map(truck => `<option value="${truck.id}">${truck.id} — ${truck.location}</option>`)
    .join('');
}

function filteredFleet() {
  const query = state.fleetFilter.query.trim().toLowerCase();
  return FLEET.filter(truck => truck.active)
    .filter(truck => state.fleetFilter.location === 'Alle locaties' || truck.location === state.fleetFilter.location)
    .filter(truck => {
      if (!query) return true;
      return [truck.id, truck.ref, truck.model].some(value => String(value).toLowerCase().includes(query));
    });
}

export function renderFleet() {
  const rows = filteredFleet().map(truck => {
    const openCount = truck.activity.filter(activity => activity.status === 'Open').length;
    return `
      <tr class="border-b hover:bg-gray-50">
        <td class="py-3 px-3">
          <button class="text-left text-gray-900 hover:underline" data-open-detail="${truck.id}">
            <div class="font-medium">${truck.id}</div>
            <div class="text-xs text-gray-500">${truck.ref}</div>
          </button>
        </td>
        <td class="py-3 px-3">${truck.model}</td>
        <td class="py-3 px-3">${truck.bmwStatus}</td>
        <td class="py-3 px-3">${fmtDate(truck.bmwExpiry)}</td>
        <td class="py-3 px-3">${truck.odo.toLocaleString('nl-NL')} <span class="text-xs text-gray-500">(${fmtDate(truck.odoDate)})</span></td>
        <td class="py-3 px-3">
          <button class="inline-flex items-center justify-center w-7 h-7 bg-red-100 text-motrac-red rounded-full font-semibold" title="Open meldingen" data-open-detail="${truck.id}">${openCount}</button>
        </td>
        <td class="py-3 px-3 text-right">
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

  $('#fleetTbody').innerHTML = rows || '<tr><td colspan="7" class="py-6 text-center text-gray-500">Geen resultaten</td></tr>';
}
