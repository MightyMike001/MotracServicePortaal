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

const toggleModalVisibility = (modal, shouldOpen) => {
  if (!(modal instanceof Element)) return;
  if (modal instanceof HTMLDialogElement) {
    if (shouldOpen) {
      if (!modal.open) {
        modal.showModal();
      }
    } else if (modal.open) {
      modal.close();
    }
    return;
  }

  if (shouldOpen) {
    modal.classList.add('show');
  } else {
    modal.classList.remove('show');
  }
};

export function openModal(selector) {
  const el = $(selector);
  if (el) {
    toggleModalVisibility(el, true);
  }
}

export function closeModals() {
  $$('.modal').forEach(modal => toggleModalVisibility(modal, false));
}

export function closeModal(modal) {
  if (!modal) return;
  toggleModalVisibility(modal, false);
}

export const kv = (label, value) => `
  <div>
    <div class="text-xs text-gray-500">${label}</div>
    <div class="font-medium">${value ?? '—'}</div>
  </div>
`;

export function formatCustomerOwnership(customer, fallback = '—') {
  if (customer && typeof customer === 'object' && !Array.isArray(customer)) {
    const name = typeof customer.name === 'string' ? customer.name.trim() : '';
    const branch = typeof customer.subLocation === 'string' ? customer.subLocation.trim() : '';
    if (name) {
      return branch ? `${name} – ${branch}` : name;
    }
  }

  if (typeof fallback === 'string' && fallback.trim() !== '') {
    return fallback;
  }

  return '—';
}
