export const LOCATIONS = [
  'Alle locaties',
  'Demovloot Motrac – Almere',
  'Demovloot Motrac – Venlo',
  'Demovloot Motrac – Zwijndrecht'
];

export const FLEET = [
  {
    id: 'E16-123456',
    ref: 'Reachtruck – Magazijn A',
    model: 'Linde E16',
    bmwStatus: 'Goedgekeurd',
    bmwExpiry: '2026-03-15',
    odo: 1523,
    odoDate: '2025-09-28',
    location: 'Demovloot Motrac – Almere',
    activity: [
      { id: 'M-1001', type: 'Onderhoud', desc: 'Periodieke servicebeurt', status: 'Afgerond', date: '2025-06-20' },
      { id: 'M-1010', type: 'Storing', desc: 'Mast-sensor foutcode', status: 'Open', date: '2025-10-01' }
    ],
    contract: {
      nummer: 'CTR-2023-ALM-001',
      start: '2023-01-01',
      eind: '2026-12-31',
      uren: 800,
      type: 'Full Service',
      model: 'Linde E16'
    },
    active: true
  },
  {
    id: 'H25-654321',
    ref: 'Buiten terrein',
    model: 'Linde H25',
    bmwStatus: 'Goedgekeurd',
    bmwExpiry: '2025-12-01',
    odo: 3420,
    odoDate: '2025-09-10',
    location: 'Demovloot Motrac – Zwijndrecht',
    activity: [],
    contract: {
      nummer: 'CTR-2022-ZWD-019',
      start: '2022-05-15',
      eind: '2025-11-30',
      uren: 1200,
      type: 'PM + Correctief',
      model: 'Linde H25'
    },
    active: true
  },
  {
    id: 'E20-777777',
    ref: 'Productiehal 3',
    model: 'Linde E20',
    bmwStatus: 'Afkeur',
    bmwExpiry: '2025-09-01',
    odo: 801,
    odoDate: '2025-09-30',
    location: 'Demovloot Motrac – Venlo',
    activity: [
      { id: 'M-1020', type: 'Schade', desc: 'Vork beschadigd', status: 'Open', date: '2025-10-03' }
    ],
    contract: {
      nummer: 'CTR-2024-VNL-003',
      start: '2024-02-01',
      eind: '2027-01-31',
      uren: 900,
      type: 'Full Service',
      model: 'Linde E20'
    },
    active: true
  }
];

export const USERS = [
  { id: 'U1', name: 'Test User 2', email: 'test2@example.com', phone: '+31 6 12345678', location: 'Demovloot Motrac – Almere', role: 'Beheerder' },
  { id: 'U2', name: 'Jan Jansen', email: 'jan.jansen@example.com', phone: '+31 6 98765432', location: 'Demovloot Motrac – Venlo', role: 'Gebruiker' },
  { id: 'U3', name: 'Eva Visser', email: 'eva.visser@example.com', phone: '+31 6 45678901', location: 'Demovloot Motrac – Zwijndrecht', role: 'Gebruiker' },
  { id: 'U4', name: 'Kees Bakker', email: 'k.bakker@example.com', phone: '+31 6 33445566', location: 'Demovloot Motrac – Almere', role: 'Gebruiker' },
  { id: 'U5', name: 'Sanne de Boer', email: 's.boer@example.com', phone: '+31 6 11112222', location: 'Demovloot Motrac – Almere', role: 'Beheerder' },
  { id: 'U6', name: 'Ruben Smit', email: 'r.smit@example.com', phone: '+31 6 22223333', location: 'Demovloot Motrac – Venlo', role: 'Gebruiker' },
  { id: 'U7', name: 'Hanna Mulder', email: 'h.mulder@example.com', phone: '+31 6 33334444', location: 'Demovloot Motrac – Zwijndrecht', role: 'Gebruiker' },
  { id: 'U8', name: 'Peter Groen', email: 'p.groen@example.com', phone: '+31 6 44445555', location: 'Demovloot Motrac – Venlo', role: 'Gebruiker' },
  { id: 'U9', name: 'Laura Kok', email: 'l.kok@example.com', phone: '+31 6 55556666', location: 'Demovloot Motrac – Almere', role: 'Gebruiker' },
  { id: 'U10', name: 'William de Vries', email: 'w.vries@example.com', phone: '+31 6 66667777', location: 'Demovloot Motrac – Zwijndrecht', role: 'Gebruiker' },
  { id: 'U11', name: 'Noa Willems', email: 'n.willems@example.com', phone: '+31 6 77778888', location: 'Demovloot Motrac – Almere', role: 'Gebruiker' }
];
