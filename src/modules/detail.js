import { FLEET } from '../data.js';
import { state } from '../state.js';
import { $, $$, fmtDate, kv } from '../utils.js';

export function openDetail(id) {
  state.selectedTruckId = id;
  const truck = FLEET.find(item => item.id === id);
  if (!truck) return;

  $('#detailTitle').textContent = `${truck.id} • ${truck.ref}`;
  setDetailTab('info');

  $('#tab-vloot').classList.add('hidden');
  $('#tab-activiteit').classList.add('hidden');
  $('#tab-users').classList.add('hidden');
  $('#truckDetail').classList.remove('hidden');
}

export function setDetailTab(tab) {
  $$('#truckDetail [data-subtab]').forEach(button => {
    button.classList.toggle('tab-active', button.dataset.subtab === tab);
  });

  const truck = FLEET.find(item => item.id === state.selectedTruckId);
  if (!truck) return;

  if (tab === 'info') {
    $('#detailContent').innerHTML = `
      <div class="grid sm:grid-cols-2 gap-4 text-sm">
        ${infoRow('Objectnummer', truck.id, true)}
        ${infoRow('Referentie', truck.ref, false, 'editRefFromDetail')}
        ${infoRow('Model', truck.model)}
        ${infoRow('Tellerstand (datum)', `${truck.odo.toLocaleString('nl-NL')} (${fmtDate(truck.odoDate)})`, false, 'updateOdoFromDetail')}
        ${infoRow('BMWT‑status', truck.bmwStatus)}
        ${infoRow('BMWT‑vervaldatum', fmtDate(truck.bmwExpiry))}
      </div>`;
  } else if (tab === 'act') {
    const items = truck.activity;
    $('#detailContent').innerHTML = items.length
      ? items.map(activity => `
        <div class="border rounded-lg p-3 mb-2">
          <div class="text-xs text-gray-500">${fmtDate(activity.date)} • ${activity.type}</div>
          <div class="font-medium">${activity.id}</div>
          <div class="text-sm">${activity.desc}</div>
          <div class="mt-1 text-xs ${activity.status === 'Open' ? 'text-motrac-red' : 'text-green-700'}">${activity.status}</div>
        </div>`).join('')
      : '<div class="text-gray-500">Geen actieve meldingen</div>';
  } else {
    const contract = truck.contract;
    $('#detailContent').innerHTML = `
      <div class="grid sm:grid-cols-2 gap-3 text-sm">
        ${kv('Contractnummer', contract.nummer)}
        ${kv('Contract type', contract.type)}
        ${kv('Model', contract.model)}
        ${kv('Start datum', fmtDate(contract.start))}
        ${kv('Eind datum', fmtDate(contract.eind))}
        ${kv('Uren per jaar', contract.uren)}
      </div>`;
  }
}

function infoRow(label, value, readonly = false, actionKey = null) {
  return `
    <div class="bg-gray-50 rounded-lg p-3">
      <div class="text-xs text-gray-500 mb-1">${label}</div>
      <div class="flex items-center justify-between">
        <div class="font-medium">${value}</div>
        ${readonly ? '' : `<button class="text-sm underline" data-action="${actionKey || ''}">Bewerken</button>`}
      </div>
    </div>`;
}
