import { $, $$ } from '../utils.js';
export function setMainTab(tab) {
  $$('[data-nav-button]').forEach(button => {
    const isActive = button.dataset.tab === tab;
    button.classList.toggle('tab-active', isActive);
    button.setAttribute('aria-current', isActive ? 'page' : 'false');
  });

  $('#tab-vloot')?.classList.toggle('hidden', tab !== 'vloot');
  $('#tab-activiteit')?.classList.toggle('hidden', tab !== 'activiteit');
  $('#tab-users')?.classList.toggle('hidden', tab !== 'users');
}
