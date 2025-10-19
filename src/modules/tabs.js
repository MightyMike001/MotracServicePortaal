import { getFleetGroupByFleetId } from '../data.js';
import { state } from '../state.js';
import { resolveEnvironment } from '../environment.js';
import { $, $$ } from '../utils.js';
import { renderAccountRequests } from './users.js';
import { setMainTab } from './navigation.js';

export function getFleetSummaryById(fleetId) {
  if (!fleetId) return null;
  const matches = getFleetGroupByFleetId(fleetId);
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

  const inlineLabelEl = $('#environmentInlineLabel');
  if (inlineLabelEl) {
    inlineLabelEl.textContent = environment.label;
  }

  const inlineSummaryEl = $('#environmentInlineSummary');
  if (inlineSummaryEl) {
    inlineSummaryEl.textContent = environment.summary;
  }

  const inlineContainerEl = $('#environmentInline');
  if (inlineContainerEl) {
    inlineContainerEl.setAttribute('title', environment.summary);
    inlineContainerEl.setAttribute(
      'aria-label',
      `${environment.label}. ${environment.summary}`
    );
  }

  $$('[data-tab-target]').forEach(item => {
    const tabKey = item.dataset.tabTarget;
    const button = item.querySelector('[data-nav-button]');
    const allowed = environment.allowedTabs.includes(tabKey);
    item.classList.toggle('hidden', !allowed);
    if (button) {
      button.disabled = !allowed;
      button.classList.toggle('opacity-40', !allowed);
    }
  });

  switchMainTab(state.activeTab);
  renderAccountRequests();
}
