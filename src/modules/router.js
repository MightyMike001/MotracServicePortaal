const HASH_PREFIX = '#/';
let onRouteChange = null;
let pendingHash = null;

function normaliseHash(hash) {
  if (typeof hash !== 'string') return null;
  if (!hash.startsWith(HASH_PREFIX)) return null;
  const value = hash.slice(HASH_PREFIX.length).trim();
  return value || null;
}

function handleHashChange() {
  if (pendingHash && window.location.hash === pendingHash) {
    pendingHash = null;
    return;
  }

  if (!onRouteChange) return;
  const tab = getCurrentRoute();
  if (tab) {
    onRouteChange(tab);
  }
}

export function initRouter(handler) {
  if (typeof handler !== 'function') {
    throw new TypeError('initRouter expects a handler function');
  }

  onRouteChange = handler;
  window.addEventListener('hashchange', handleHashChange);
  handleHashChange();
}

export function getCurrentRoute() {
  return normaliseHash(window.location.hash);
}

export function navigateToTab(tab) {
  if (!tab) return;
  const desiredHash = `${HASH_PREFIX}${tab}`;
  if (window.location.hash === desiredHash) return;
  pendingHash = desiredHash;
  window.location.hash = desiredHash;
}
