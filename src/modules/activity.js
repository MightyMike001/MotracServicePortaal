import { FLEET } from '../data.js';
import { $, fmtDate } from '../utils.js';
import { filterFleetByAccess } from './access.js';

export function renderActivity() {
  const container = $('#activityList');
  const query = $('#activitySearchInput').value.trim().toLowerCase();
  const location = $('#activityLocationFilter').value;
  const items = [];

  filterFleetByAccess(FLEET).forEach(truck => {
    if (!truck.active) return;
    if (location !== 'Alle locaties' && truck.location !== location) return;
    truck.activity.forEach(activity => {
      const text = `${activity.id} ${activity.type} ${activity.desc} ${truck.id}`.toLowerCase();
      if (query && !text.includes(query)) return;
      items.push({ truck, activity });
    });
  });

  container.innerHTML = items.map(({ truck, activity }) => `
    <article class="bg-white rounded-xl shadow-soft p-4 flex flex-col gap-2">
      <div class="text-xs text-gray-500">${fmtDate(activity.date)} • ${activity.type}</div>
      <h4 class="font-semibold">${activity.id} – ${truck.id}</h4>
      <p class="text-sm text-gray-700 truncate-2">${activity.desc}</p>
      <div class="mt-2 flex items-center justify-between">
        <span class="text-xs px-2 py-1 rounded-full ${activity.status === 'Open' ? 'bg-red-100 text-motrac-red' : 'bg-green-100 text-green-700'}">${activity.status}</span>
        <button class="text-sm underline" data-open-detail="${truck.id}">Naar truck</button>
      </div>
    </article>`).join('');

  $('#activityEmpty').classList.toggle('hidden', items.length !== 0);
}
