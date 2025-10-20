import { state } from '../state.js';
import { $ } from '../utils.js';

const DEFAULT_LOCATION = 'Alle locaties';
const DEFAULT_STATUS = 'all';
const QUERY_PARAM_LOCATION = 'locatie';
const QUERY_PARAM_STATUS = 'status';
const QUERY_PARAM_QUERY = 'zoek';
const ALLOWED_STATUSES = new Set(['Open', 'In behandeling', 'Afgerond', 'Geannuleerd', DEFAULT_STATUS]);

function normaliseStatus(value) {
  if (typeof value !== 'string') {
    return DEFAULT_STATUS;
  }
  const trimmed = value.trim();
  return ALLOWED_STATUSES.has(trimmed) ? trimmed : DEFAULT_STATUS;
}

function getSearchParams() {
  return new URLSearchParams(window.location.search);
}

function setSearchInput(value) {
  const searchInput = $('#searchInput');
  if (searchInput) {
    searchInput.value = value ?? '';
  }
}

function setStatusSelect(value) {
  const statusSelect = $('#activityStatusFilter');
  if (statusSelect) {
    statusSelect.value = value ?? DEFAULT_STATUS;
  }
}

function setLocationSelects(value) {
  const locationFilter = $('#locationFilter');
  if (locationFilter && value != null) {
    locationFilter.value = value;
  }
  const activityLocationFilter = $('#activityLocationFilter');
  if (activityLocationFilter && value != null) {
    activityLocationFilter.value = value;
  }
}

function normaliseLocation(value) {
  const trimmed = typeof value === 'string' && value.trim() ? value.trim() : DEFAULT_LOCATION;
  const locationFilter = $('#locationFilter');
  if (!locationFilter) {
    return trimmed;
  }
  const options = Array.from(locationFilter.options).map(option => option.value);
  if (options.length === 0) {
    return trimmed;
  }
  if (options.includes(trimmed)) {
    return trimmed;
  }
  if (options.includes(DEFAULT_LOCATION)) {
    return DEFAULT_LOCATION;
  }
  return options.length ? options[0] : DEFAULT_LOCATION;
}

export function applyFiltersFromUrl(options = {}) {
  const { updateDom = true, fallbackToStored = true } = options;
  const params = getSearchParams();

  const locationParam = params.get(QUERY_PARAM_LOCATION);
  let locationChanged = false;
  let nextLocation = null;
  if (locationParam != null) {
    const rawLocation = locationParam || DEFAULT_LOCATION;
    const resolvedLocation = updateDom ? normaliseLocation(rawLocation) : rawLocation;
    nextLocation = resolvedLocation;
    locationChanged = state.fleetFilter.location !== nextLocation;
    state.fleetFilter.location = nextLocation;
    state.fleetFilter.source = 'url';
  } else {
    state.fleetFilter.source = null;
    if (!fallbackToStored) {
      const resolvedLocation = updateDom ? normaliseLocation(DEFAULT_LOCATION) : DEFAULT_LOCATION;
      nextLocation = resolvedLocation;
      locationChanged = state.fleetFilter.location !== resolvedLocation;
      state.fleetFilter.location = resolvedLocation;
    }
  }

  const statusParam = params.get(QUERY_PARAM_STATUS);
  const nextStatus = statusParam != null ? normaliseStatus(statusParam) : DEFAULT_STATUS;
  const statusChanged = state.activityFilter.status !== nextStatus;
  state.activityFilter.status = nextStatus;

  const queryParam = params.get(QUERY_PARAM_QUERY);
  const nextQuery = queryParam != null ? queryParam : '';
  const queryChanged = state.fleetFilter.query !== nextQuery;
  state.fleetFilter.query = nextQuery;

  if (updateDom) {
    if (nextLocation != null) {
      setLocationSelects(nextLocation);
    }
    if (queryParam != null || queryChanged) {
      setSearchInput(nextQuery);
    }
    if (statusParam != null || statusChanged) {
      setStatusSelect(nextStatus);
    }
  }

  return {
    location: nextLocation,
    locationChanged,
    statusChanged,
    queryChanged
  };
}

export function resetFilters() {
  const hadQuery = Boolean(state.fleetFilter.query);
  const hadStatus = state.activityFilter.status !== DEFAULT_STATUS;

  state.fleetFilter.query = '';
  state.activityFilter.status = DEFAULT_STATUS;

  setSearchInput('');
  if (hadStatus) {
    setStatusSelect(DEFAULT_STATUS);
  }

  const activitySearchInput = $('#activitySearchInput');
  if (activitySearchInput) {
    activitySearchInput.value = '';
  }

  return { hadQuery, hadStatus };
}

export function syncFiltersToUrl() {
  const params = getSearchParams();

  const locationValue = state.fleetFilter.location;
  if (locationValue && locationValue !== DEFAULT_LOCATION) {
    params.set(QUERY_PARAM_LOCATION, locationValue);
  } else {
    params.delete(QUERY_PARAM_LOCATION);
  }

  const statusValue = state.activityFilter.status;
  if (statusValue && statusValue !== DEFAULT_STATUS) {
    params.set(QUERY_PARAM_STATUS, statusValue);
  } else {
    params.delete(QUERY_PARAM_STATUS);
  }

  const queryValue = typeof state.fleetFilter.query === 'string' ? state.fleetFilter.query.trim() : '';
  if (queryValue) {
    params.set(QUERY_PARAM_QUERY, queryValue);
  } else {
    params.delete(QUERY_PARAM_QUERY);
  }

  const searchString = params.toString();
  const newUrl = `${window.location.pathname}${searchString ? `?${searchString}` : ''}${window.location.hash}`;
  window.history.replaceState({}, '', newUrl);
}
