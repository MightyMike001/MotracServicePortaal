const OVERLAY_ID = 'globalLoadingOverlay';
const MESSAGE_ID = 'globalLoadingMessage';
const VISIBLE_ATTR = 'visible';
let hideTimer = null;

function getOverlay() {
  return document.getElementById(OVERLAY_ID);
}

export function showGlobalLoading(message = 'Bezig met laden…') {
  const overlay = getOverlay();
  if (!overlay) return;
  if (hideTimer) {
    window.clearTimeout(hideTimer);
    hideTimer = null;
  }
  const messageEl = overlay.querySelector(`#${MESSAGE_ID}`) || document.getElementById(MESSAGE_ID);
  if (messageEl && typeof message === 'string') {
    messageEl.textContent = message;
  }
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
  overlay.dataset[VISIBLE_ATTR] = 'true';
}

export function hideGlobalLoading() {
  const overlay = getOverlay();
  if (!overlay) return;
  overlay.dataset[VISIBLE_ATTR] = 'false';
  overlay.setAttribute('aria-hidden', 'true');
  hideTimer = window.setTimeout(() => {
    overlay.classList.add('hidden');
  }, 220);
}
