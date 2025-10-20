import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createCustomer,
  createCustomerLocation,
  addMachineToCustomerLocation,
  fetchCustomers,
  resetLocalStore
} from '../src/api/browserStorage.js';
import { resetToDefaults, USERS, LOCATIONS, FLEET } from '../src/data.js';

function resetAll() {
  resetLocalStore();
  resetToDefaults();
}

test('beheerder kan klant aanmaken en gebruiker koppelen', async () => {
  resetAll();

  const demoUser = {
    id: 'U-TEST',
    name: 'Demo Klant',
    email: 'demo.klant@example.com',
    phone: '+31 6 99998888',
    location: 'Demovloot Motrac – Almere',
    role: 'Gebruiker'
  };
  USERS.push(demoUser);

  const customer = await createCustomer({
    name: 'Acme Logistics',
    actorRole: 'Beheerder',
    linkedUserId: demoUser.id
  });

  assert.equal(customer.name, 'Acme Logistics');
  assert.ok(customer.id.startsWith('CUS-'));
  assert.ok(customer.userIds.includes(demoUser.id));

  const linkedUser = USERS.find(user => user.id === demoUser.id);
  assert.equal(linkedUser.role, 'Klant');
  assert.equal(linkedUser.customerId, customer.id);

  const customers = await fetchCustomers();
  assert.ok(customers.some(entry => entry.id === customer.id));
});

test('klant kan eigen locaties en machines beheren', async () => {
  resetAll();

  const customers = await fetchCustomers();
  const customer = customers.find(entry => entry.name === 'Van Dijk Logistics');
  assert.ok(customer, 'verwacht standaardklant Van Dijk Logistics');

  const location = await createCustomerLocation({
    customerId: customer.id,
    name: 'Magazijn Utrecht',
    actorRole: 'Klant',
    actorCustomerId: customer.id
  });

  assert.equal(location.createdByRole, 'Klant');
  assert.ok(LOCATIONS.includes(location.displayName));

  const machine = await addMachineToCustomerLocation({
    customerId: customer.id,
    locationId: location.id,
    actorRole: 'Klant',
    actorCustomerId: customer.id,
    machine: {
      model: 'Linde E30',
      hours: 120
    }
  });

  assert.equal(machine.location, location.displayName);
  assert.equal(machine.customer.name, customer.name);
  assert.ok(FLEET.some(entry => entry.id === machine.id));
});

test('beheerder kan locatie voor klant aanmaken', async () => {
  resetAll();

  const customers = await fetchCustomers();
  const customer = customers.find(entry => entry.name === 'Motrac');
  assert.ok(customer, 'verwacht standaardklant Motrac');

  const location = await createCustomerLocation({
    customerId: customer.id,
    name: 'Nieuwe Demo',
    actorRole: 'Beheerder'
  });

  assert.equal(location.createdByRole, 'Beheerder');
  assert.ok(LOCATIONS.includes(location.displayName));
});

test('rolrestricties worden afgedwongen', async () => {
  resetAll();

  await assert.rejects(
    () => createCustomer({ name: 'Verboden Klant', actorRole: 'Klant' }),
    /Alleen beheerders/
  );

  const customers = await fetchCustomers();
  const customer = customers.find(entry => entry.name === 'Van Dijk Logistics');
  const otherCustomer = customers.find(entry => entry.name === 'Motrac');
  assert.ok(customer && otherCustomer);

  await assert.rejects(
    () =>
      createCustomerLocation({
        customerId: otherCustomer.id,
        name: 'Ongeoorloofd',
        actorRole: 'Klant',
        actorCustomerId: customer.id
      }),
    /eigen locaties/
  );

  const location = customer.locations[0];
  await assert.rejects(
    () =>
      addMachineToCustomerLocation({
        customerId: otherCustomer.id,
        locationId: location.id,
        actorRole: 'Klant',
        actorCustomerId: customer.id,
        machine: { model: 'Test' }
      }),
    /Locatie hoort niet bij de geselecteerde klant|eigen locaties beheren/
  );
});
