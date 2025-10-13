import { state } from '../state.js';

function getRole() {
  return state.profile?.role ?? null;
}

function getAllowedFleetIds() {
  const allowed = state.accessibleFleetIds;
  return allowed instanceof Set ? allowed : null;
}

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
  if (!allowed) {
    // If we have no allow-list for restricted roles we consider the asset hidden.
    return role !== 'Klant';
  }

  if (allowed.size === 0) {
    return false;
  }

  if (!truck.fleetId) {
    return false;
  }

  return allowed.has(truck.fleetId);
}

export function filterFleetByAccess(fleet = []) {
  return fleet.filter(truck => canViewFleetAsset(truck));
}

export function ensureAccessibleLocation(currentLocation, availableLocations = []) {
  if (!availableLocations.length) {
    return 'Alle locaties';
  }

  if (availableLocations.includes(currentLocation)) {
    return currentLocation;
  }

  return availableLocations.includes('Alle locaties') ? 'Alle locaties' : availableLocations[0];
}
