export const state = {
  fleetFilter: { location: 'Alle locaties', query: '' },
  activityFilter: { status: 'all' },
  selectedTruckId: null,
  usersPage: 1,
  usersPageSize: 10,
  usersSearchQuery: '',
  editUserId: null,
  session: null,
  profile: null,
  accountContext: null,
  accessibleFleetIds: null,
  hasLoadedInitialData: false,
  eventsWired: false,
  accountRequests: [],
  activeEnvironmentKey: 'pending',
  allowedTabs: [],
  activeTab: null
};
