export const $ = (selector, scope = document) => scope.querySelector(selector);
export const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

export const fmtDate = iso => {
  if (!iso) return '—';
  const date = new Date(iso);
  return Number.isNaN(date.valueOf()) ? '—' : date.toLocaleDateString('nl-NL');
};

export function showToast(message) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2200);
}

export function openModal(selector) {
  const el = $(selector);
  if (el) {
    el.classList.add('show');
  }
}

export function closeModals() {
  $$('.modal').forEach(modal => modal.classList.remove('show'));
}

export const kv = (label, value) => `
  <div>
    <div class="text-xs text-gray-500">${label}</div>
    <div class="font-medium">${value}</div>
  </div>
`;
