import { $, $$ } from '../utils.js';
import { getTabLabel } from './tabConfig.js';

export function setMainTab(tab) {
  $$('[data-nav-button]').forEach(button => {
    const isActive = button.dataset.tab === tab;
    button.classList.toggle('tab-active', isActive);
    button.setAttribute('aria-current', isActive ? 'page' : 'false');
  });

  $('#tab-vloot')?.classList.toggle('hidden', tab !== 'vloot');
  $('#tab-activiteit')?.classList.toggle('hidden', tab !== 'activiteit');
  $('#tab-users')?.classList.toggle('hidden', tab !== 'users');
  $('#truckDetail')?.classList.add('hidden');
}

export function updateModuleCycleButton(allowedTabs, activeTab) {
  const button = $('#moduleCycleBtn');
  const label = $('#moduleCycleLabel');

  if (!button || !label) return;

  const availableTabs = Array.isArray(allowedTabs) ? allowedTabs.filter(Boolean) : [];

  if (!availableTabs.length) {
    const text = 'Geen modules beschikbaar';
    button.disabled = true;
    button.classList.add('module-cycle--disabled');
    label.textContent = text;
    button.setAttribute('aria-label', text);
    button.setAttribute('title', text);
    return;
  }

  if (availableTabs.length === 1) {
    const text = `Enige module: ${getTabLabel(availableTabs[0])}`;
    button.disabled = true;
    button.classList.add('module-cycle--disabled');
    label.textContent = text;
    button.setAttribute('aria-label', text);
    button.setAttribute('title', text);
    return;
  }

  button.disabled = false;
  button.classList.remove('module-cycle--disabled');

  let currentIndex = availableTabs.indexOf(activeTab);
  if (currentIndex < 0) {
    currentIndex = -1;
  }
  const nextTab = availableTabs[(currentIndex + 1) % availableTabs.length];
  const nextLabel = getTabLabel(nextTab);
  const text = `Volgende: ${nextLabel}`;
  label.textContent = text;
  button.setAttribute('aria-label', `Ga naar ${nextLabel}`);
  button.setAttribute('title', `Ga naar ${nextLabel}`);
}
