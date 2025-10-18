const ROLE_TO_ENVIRONMENT = {
  Beheerder: 'beheerder',
  Gebruiker: 'gebruiker',
  Klant: 'klant',
  Vlootbeheerder: 'vlootbeheerder',
  Gast: 'pending'
};

export const ENVIRONMENTS = {
  pending: {
    key: 'pending',
    label: 'Account in aanvraag',
    summary:
      'Uw account is actief en u kunt inloggen met uw eigen wachtwoord. Alle inhoud blijft verborgen totdat een beheerder uw rol heeft toegewezen en het account heeft goedgekeurd.',
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
  const value = typeof role === 'string' ? role.trim() : '';
  if (!value) {
    return 'pending';
  }

  const directMatch = ROLE_TO_ENVIRONMENT[value];
  if (directMatch) {
    return directMatch;
  }

  const normalisedKey = Object.keys(ROLE_TO_ENVIRONMENT).find(
    knownRole => knownRole.toLowerCase() === value.toLowerCase()
  );

  return normalisedKey ? ROLE_TO_ENVIRONMENT[normalisedKey] : 'pending';
}

export function resolveEnvironment(input) {
  if (!input) {
    return ENVIRONMENTS.pending;
  }

  if (typeof input === 'object') {
    if (input.key && ENVIRONMENTS[input.key]) {
      return ENVIRONMENTS[input.key];
    }

    if (input.role) {
      const keyFromRole = getEnvironmentKeyForRole(input.role);
      if (ENVIRONMENTS[keyFromRole]) {
        return ENVIRONMENTS[keyFromRole];
      }
    }

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
