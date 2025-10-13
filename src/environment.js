const ROLE_TO_ENVIRONMENT = {
  Beheerder: 'beheerder',
  Gebruiker: 'gebruiker',
  Klant: 'klant',
  Vlootbeheerder: 'vlootbeheerder'
};

export const ENVIRONMENTS = {
  pending: {
    key: 'pending',
    label: 'Nog geen rol',
    summary: 'Uw account is aangemaakt. Een beheerder kent binnenkort de juiste rechten toe.',
    allowedTabs: []
  },
  beheerder: {
    key: 'beheerder',
    label: 'Beheerder',
    summary: 'Volledige toegang tot vloot, activiteiten en gebruikersbeheer.',
    allowedTabs: ['vloot', 'activiteit', 'users']
  },
  gebruiker: {
    key: 'gebruiker',
    label: 'Gebruiker',
    summary: 'Interne gebruikersomgeving met vloot- en activiteiteninzage.',
    allowedTabs: ['vloot', 'activiteit']
  },
  vlootbeheerder: {
    key: 'vlootbeheerder',
    label: 'Vlootbeheerder',
    summary: 'Toegang tot vloot en meldingen voor toegewezen wagenparken.',
    allowedTabs: ['vloot', 'activiteit']
  },
  klant: {
    key: 'klant',
    label: 'Klant',
    summary: 'Klantportaal met alleen de eigen vlootomgeving.',
    allowedTabs: ['vloot']
  }
};

export function getEnvironmentKeyForRole(role) {
  if (!role) return 'pending';
  return ROLE_TO_ENVIRONMENT[role] || 'gebruiker';
}

export function resolveEnvironment(input) {
  if (!input) {
    return ENVIRONMENTS.pending;
  }

  if (ENVIRONMENTS[input]) {
    return ENVIRONMENTS[input];
  }

  const key = getEnvironmentKeyForRole(input);
  return ENVIRONMENTS[key] || ENVIRONMENTS.pending;
}

export function isTabAllowed(environment, tab) {
  if (!environment) return false;
  return environment.allowedTabs.includes(tab);
}
