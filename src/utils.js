export const $ = (selector, scope = document) => scope.querySelector(selector);
export const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

export const fmtDate = iso => {
  if (!iso) return '—';
  const date = new Date(iso);
  return Number.isNaN(date.valueOf()) ? '—' : date.toLocaleDateString('nl-NL');
};

const formatNumericValue = value => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toLocaleString('nl-NL');
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return numeric.toLocaleString('nl-NL');
    }
  }
  return '—';
};

const formatNumericHtml = (value, date) => {
  const odo = formatNumericValue(value);
  const formattedDate = fmtDate(date);
  if (formattedDate === '—') {
    return odo;
  }
  return `${odo} <span class="text-xs text-gray-500">(${formattedDate})</span>`;
};

const formatNumericLabel = (value, date) => {
  const odo = formatNumericValue(value);
  const formattedDate = fmtDate(date);
  return formattedDate === '—' ? odo : `${odo} (${formattedDate})`;
};

export const formatHoursValue = formatNumericValue;
export const formatHoursHtml = formatNumericHtml;
export const formatHoursLabel = formatNumericLabel;

export const formatOdoValue = formatNumericValue;
export const formatOdoHtml = formatNumericHtml;
export const formatOdoLabel = formatNumericLabel;

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
    <div class="font-medium">${value ?? '—'}</div>
  </div>
`;
