import { state } from '../state.js';

/**
 * Resolves the active role from the authenticated profile.
 */
function getRole() {
  return state.profile?.role ?? null;
}

/**
 * Returns the set with allowed fleet ids for restricted roles.
 */
function getAllowedFleetIds() {
  const allowed = state.accessibleFleetIds;
  return allowed instanceof Set ? allowed : null;
}

/**
 * Checks whether the current user may view a specific fleet asset.
 */
export function canViewFleetAsset(truck) {
  if (!truck) return false;
  const role = getRole();
  if (!role) {
    return false;
  }

  if (role === 'Beheerder' || role === 'Gebruiker') {
    return true;
  }

  const allowed = getAllowedFleetIds();
  if (!allowed || allowed.size === 0) {
    return false;
  }

  if (!truck.fleetId) {
    return false;
  }

  return allowed.has(truck.fleetId);
}

/**
 * Filters the fleet array so that only accessible entries remain.
 */
export function filterFleetByAccess(fleet = []) {
  return fleet.filter(truck => canViewFleetAsset(truck));
}

/**
 * Ensures the currently selected location remains accessible after updates.
 */
export function ensureAccessibleLocation(currentLocation, availableLocations = []) {
  if (!availableLocations.length) {
    return 'Alle locaties';
  }

  if (availableLocations.includes(currentLocation)) {
    return currentLocation;
  }

  return availableLocations.includes('Alle locaties') ? 'Alle locaties' : availableLocations[0];
}
