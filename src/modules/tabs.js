import { FLEET } from '../data.js';
import { state } from '../state.js';
import { resolveEnvironment } from '../environment.js';
import { $, $$ } from '../utils.js';
import { renderAccountRequests } from './users.js';
import { setMainTab } from './navigation.js';

export function getFleetSummaryById(fleetId) {
  if (!fleetId) return null;
  const matches = FLEET.filter(item => item?.fleetId === fleetId);
  if (!matches.length) {
    return null;
  }

  const locations = Array.from(new Set(matches.map(item => item.location).filter(Boolean)));
  return {
    id: fleetId,
    name: matches[0]?.fleetName || '—',
    locations
  };
}

export function switchMainTab(tab) {
  const allowedTabs = Array.isArray(state.allowedTabs) ? state.allowedTabs : ['vloot', 'activiteit', 'users'];

  if (!allowedTabs.length) {
    state.activeTab = null;
    setMainTab(null);
    return;
  }

  const fallback = allowedTabs[0] || 'vloot';
  const targetTab = allowedTabs.includes(tab) ? tab : fallback;
  state.activeTab = targetTab;
  setMainTab(targetTab);
}

export function applyEnvironmentForRole(role) {
  const environment = resolveEnvironment(role);
  state.activeEnvironmentKey = environment.key;
  state.allowedTabs = [...environment.allowedTabs];

  const nameEl = $('#environmentName');
  if (nameEl) {
    nameEl.textContent = environment.label;
  }

  const badgeEl = $('#environmentBadge');
  if (badgeEl) {
    badgeEl.textContent = environment.label;
  }

  const summaryEl = $('#environmentSummary');
  if (summaryEl) {
    summaryEl.textContent = environment.summary;
  }

  $$('#mainTabs button').forEach(button => {
    const allowed = environment.allowedTabs.includes(button.dataset.tab);
    const listItem = button.closest('li');
    if (listItem) {
      listItem.classList.toggle('hidden', !allowed);
    }
    button.disabled = !allowed;
    button.classList.toggle('opacity-40', !allowed);
  });

  switchMainTab(state.activeTab);
  renderAccountRequests();
}
