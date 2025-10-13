export const state = {
  fleetFilter: { location: 'Alle locaties', query: '' },
  selectedTruckId: null,
  usersPage: 1,
  usersPageSize: 10,
  editUserId: null,
  session: null,
  profile: null,
  accessibleFleetIds: null,
  hasLoadedInitialData: false,
  eventsWired: false,
  accountRequests: [
    {
      id: 'R1001',
      name: 'Mila Hofman',
      email: 'm.hofman@hofmanlogistics.nl',
      phone: '+31 6 9900 1122',
      organisation: 'Hofman Logistics',
      requestedRole: null,
      requestNotes: 'Klantnummer HL-5582',
      status: 'pending',
      submittedAt: '2025-10-06T09:30:00+02:00'
    }
  ],
  activeEnvironmentKey: 'beheerder',
  allowedTabs: ['vloot', 'activiteit', 'users'],
  activeTab: 'vloot'
};
