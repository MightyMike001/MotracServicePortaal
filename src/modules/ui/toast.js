const TOAST_ID = 'toast';
const DEFAULT_DURATION = 5000;
let hideTimer = null;

/**
 * Renders a toast message with consistent styling and close behaviour.
 */
export function showToast(message, { duration = DEFAULT_DURATION, variant = 'info' } = {}) {
  const toast = document.getElementById(TOAST_ID);
  if (!toast) {
    console.warn('Toast container ontbreekt in de DOM.');
    return;
  }

  window.clearTimeout(hideTimer);

  toast.classList.remove('bg-gray-900', 'bg-green-600', 'bg-red-600', 'bg-amber-600');
  toast.classList.add(resolveVariantClass(variant));
  toast.innerHTML = `
    <span class="toast-message">${escapeHtml(message)}</span>
    <button type="button" class="toast-close" aria-label="Melding sluiten">×</button>
  `;

  toast.classList.remove('hidden');
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');

  const closeButton = toast.querySelector('.toast-close');
  closeButton?.addEventListener('click', hideToast, { once: true });

  hideTimer = window.setTimeout(() => {
    hideToast();
  }, Math.max(1000, duration));
}

/**
 * Hides the toast container.
 */
export function hideToast() {
  const toast = document.getElementById(TOAST_ID);
  if (!toast) return;
  window.clearTimeout(hideTimer);
  hideTimer = null;
  toast.classList.add('hidden');
  toast.removeAttribute('role');
  toast.removeAttribute('aria-live');
}

function resolveVariantClass(variant) {
  switch (variant) {
    case 'success':
      return 'bg-green-600';
    case 'error':
      return 'bg-red-600';
    case 'warning':
      return 'bg-amber-600';
    default:
      return 'bg-gray-900';
  }
}

function escapeHtml(value) {
  const text = document.createTextNode(String(value ?? ''));
  const span = document.createElement('span');
  span.append(text);
  return span.innerHTML;
}
