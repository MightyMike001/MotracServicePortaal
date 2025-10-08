import { $, $$ } from '../utils.js';

export function setMainTab(tab) {
  $$('#mainTabs button').forEach(button => {
    button.classList.toggle('tab-active', button.dataset.tab === tab);
  });
  $('#tab-vloot').classList.toggle('hidden', tab !== 'vloot');
  $('#tab-activiteit').classList.toggle('hidden', tab !== 'activiteit');
  $('#tab-users').classList.toggle('hidden', tab !== 'users');
  $('#truckDetail').classList.add('hidden');
}
