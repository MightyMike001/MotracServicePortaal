const HASH_PREFIX = '#/';

const ROUTE_ALIASES = {
  gebruikers: 'users',
  gebruikersbeheer: 'users'
};

const PATHNAME_ALIASES = {
  '/gebruikers': 'users',
  '/gebruikers/': 'users'
};

let onRouteChange = null;
let pendingHash = null;

function normaliseHash(hash) {
  if (typeof hash !== 'string') return null;
  if (!hash.startsWith(HASH_PREFIX)) return null;
  const value = hash.slice(HASH_PREFIX.length).trim();
  if (!value) return null;
  const aliasKey = value.toLowerCase();
  return ROUTE_ALIASES[aliasKey] || value;
}

function resolveRouteFromPathname(pathname) {
  if (typeof pathname !== 'string') return null;
  const normalised = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  return PATHNAME_ALIASES[normalised] || null;
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

  const pathRoute = resolveRouteFromPathname(window.location.pathname);
  if (pathRoute) {
    navigateToTab(pathRoute);
  }

  handleHashChange();
}

export function getCurrentRoute() {
  return normaliseHash(window.location.hash);
}

export function navigateToTab(tab) {
  if (!tab) return;
  const target = ROUTE_ALIASES[tab?.toLowerCase?.()] || tab;
  const desiredHash = `${HASH_PREFIX}${target}`;
  if (window.location.hash === desiredHash) return;
  pendingHash = desiredHash;
  window.location.hash = desiredHash;
}
