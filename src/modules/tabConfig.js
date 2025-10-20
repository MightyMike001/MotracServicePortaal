export const TAB_LABELS = {
  vloot: 'Vloot',
  activiteit: 'Activiteit',
  users: 'Gebruikersbeheer'
};

export function getTabLabel(tab) {
  if (!tab) return '';
  return TAB_LABELS[tab] || tab;
}
