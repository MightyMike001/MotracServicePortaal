import { FLEET, USERS, setFleet, setLocations, setUsers } from './data.js';
import { state } from './state.js';
import { $, $$, fmtDate, showToast, openModal, closeModals, kv } from './utils.js';
import { populateLocationFilters, renderFleet } from './modules/fleet.js';
import { renderActivity } from './modules/activity.js';
import { renderUsers } from './modules/users.js';
import { openDetail, setDetailTab } from './modules/detail.js';
import { setMainTab } from './modules/navigation.js';
import { fetchFleet, fetchLocations, fetchUsers } from './api/supabase.js';

function wireEvents() {
  function closeKebabMenus(except = null) {
    $$('.kebab-menu').forEach(menu => {
      if (menu !== except) {
        menu.classList.add('hidden');
      }
    });
  }

  $('#userBtn').addEventListener('click', () => $('#userMenu').classList.toggle('hidden'));
  $('#cancelUserMenu').addEventListener('click', () => $('#userMenu').classList.add('hidden'));
  document.addEventListener('click', event => {
    if (!event.target.closest('#userBtn') && !event.target.closest('#userMenu')) {
      $('#userMenu').classList.add('hidden');
    }
  });
  $('#logoutBtn').addEventListener('click', () => showToast('Uitgelogd (prototype)'));

  $$('#mainTabs button').forEach(button => button.addEventListener('click', () => setMainTab(button.dataset.tab)));

  $('#locationFilter').addEventListener('change', event => {
    state.fleetFilter.location = event.target.value;
    renderFleet();
  });
  const applyFleetSearch = () => {
    state.fleetFilter.query = $('#searchInput').value;
    renderFleet();
  };

  $('#searchBtn').addEventListener('click', applyFleetSearch);
  $('#searchInput').addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      applyFleetSearch();
    }
  });

  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-open-detail]');
    if (trigger) {
      openDetail(trigger.dataset.openDetail);
    }
  });

  document.addEventListener('click', event => {
    const button = event.target.closest('.kebab > button');
    if (button) {
      const menu = button.parentElement.querySelector('.kebab-menu');
      const shouldShow = menu && menu.classList.contains('hidden');
      closeKebabMenus(menu);
      if (menu && shouldShow) {
        menu.classList.remove('hidden');
      }
      return;
    }

    if (!event.target.closest('.kebab-menu')) {
      closeKebabMenus();
    }
  });

  document.addEventListener('click', event => {
    const actionButton = event.target.closest('[data-action]');
    if (!actionButton) return;

    closeKebabMenus();

    const action = actionButton.dataset.action;
    const id = actionButton.dataset.id || state.selectedTruckId;
    const truck = FLEET.find(item => item.id === id);
    if (!truck) return;

    if (action === 'newTicket' || action === 'newTicketFromDetail') {
      $('#ticketTruck').value = truck.id;
      openModal('#modalTicket');
      return;
    }

    if (action === 'updateOdo' || action === 'updateOdoFromDetail') {
      $('#odoCurrent').textContent = `${truck.odo.toLocaleString('nl-NL')} (${fmtDate(truck.odoDate)})`;
      $('#odoNew').value = '';
      $('#odoSave').dataset.id = id;
      openModal('#modalOdo');
      return;
    }

    if (action === 'editRef' || action === 'editRefFromDetail') {
      $('#refCurrent').textContent = truck.ref;
      $('#refNew').value = truck.ref;
      $('#refSave').dataset.id = id;
      openModal('#modalRef');
      return;
    }

    if (action === 'showContract') {
      const contract = truck.contract;
      $('#contractBody').innerHTML = `
        ${kv('Contractnummer', contract.nummer)}
        ${kv('Start datum', fmtDate(contract.start))}
        ${kv('Eind datum', fmtDate(contract.eind))}
        ${kv('Uren per jaar', contract.uren)}
        ${kv('Contract type', contract.type)}
        ${kv('Model', contract.model)}
      `;
      openModal('#modalContract');
      return;
    }

    if (action === 'inactive') {
      $('#inactiveDate').valueAsDate = new Date();
      $('#inactiveConfirm').dataset.id = id;
      openModal('#modalInactive');
    }
  });

  document.querySelectorAll('.modal [data-close]').forEach(button => button.addEventListener('click', closeModals));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeModals();
  });

  $('#btnNewTicket').addEventListener('click', () => openModal('#modalTicket'));
  $('#ticketCreate').addEventListener('click', () => {
    const id = $('#ticketTruck').value;
    const type = $('#ticketType').value;
    const desc = $('#ticketDesc').value.trim();
    if (!id || !desc) {
      showToast('Vul minimaal truck en omschrijving in.');
      return;
    }

    const truck = FLEET.find(item => item.id === id);
    truck.activity.push({
      id: `M-${Math.floor(1000 + Math.random() * 9000)}`,
      type,
      desc,
      status: 'Open',
      date: new Date().toISOString()
    });

    closeModals();
    renderFleet();
    renderActivity();
    setMainTab('activiteit');
    showToast('Servicemelding aangemaakt.');

    $('#ticketOrder').value = '';
    $('#ticketDesc').value = '';
    $('#ticketPhotos').value = '';
  });

  $('#odoSave').addEventListener('click', event => {
    const id = event.target.dataset.id;
    const truck = FLEET.find(item => item.id === id);
    const value = parseInt($('#odoNew').value, 10);
    if (Number.isNaN(value) || value < truck.odo) {
      showToast('Nieuwe tellerstand moet ≥ huidige zijn.');
      return;
    }
    truck.odo = value;
    truck.odoDate = new Date().toISOString();
    closeModals();
    renderFleet();
    setDetailTab('info');
    showToast('Tellerstand bijgewerkt.');
  });

  $('#refSave').addEventListener('click', event => {
    const id = event.target.dataset.id;
    const truck = FLEET.find(item => item.id === id);
    const value = $('#refNew').value.trim();
    if (!value) {
      showToast('Referentie mag niet leeg zijn.');
      return;
    }
    truck.ref = value;
    closeModals();
    renderFleet();
    setDetailTab('info');
    showToast('Referentie bijgewerkt.');
  });

  $('#inactiveConfirm').addEventListener('click', event => {
    const id = event.target.dataset.id;
    const date = $('#inactiveDate').value;
    const reason = $('#inactiveReason').value.trim();
    if (!date || !reason) {
      showToast('Datum en reden zijn verplicht.');
      return;
    }
    const truck = FLEET.find(item => item.id === id);
    truck.active = false;
    closeModals();
    renderFleet();
    renderActivity();
    showToast('Truck gemarkeerd als inactief.');
  });

  $('#activityLocationFilter').addEventListener('change', renderActivity);
  const applyActivitySearch = () => {
    renderActivity();
  };

  $('#activitySearchBtn').addEventListener('click', applyActivitySearch);
  $('#activitySearchInput').addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      applyActivitySearch();
    }
  });

  $('#btnAddUser').addEventListener('click', () => {
    state.editUserId = null;
    $('#userModalTitle').textContent = 'Gebruiker toevoegen';
    $('#userName').value = '';
    $('#userEmail').value = '';
    $('#userPhone').value = '';
    $('#userRole').value = 'Gebruiker';
    openModal('#modalUser');
  });

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-user-action]');
    if (!button) return;

    closeKebabMenus();

    const id = button.dataset.id;
    if (button.dataset.userAction === 'edit') {
      state.editUserId = id;
      const user = USERS.find(item => item.id === id);
      $('#userModalTitle').textContent = 'Gebruiker bewerken';
      $('#userName').value = user.name;
      $('#userEmail').value = user.email;
      $('#userPhone').value = user.phone;
      $('#userLocation').value = user.location;
      $('#userRole').value = user.role;
      openModal('#modalUser');
    } else if (button.dataset.userAction === 'delete') {
      const index = USERS.findIndex(item => item.id === id);
      if (index > -1) {
        USERS.splice(index, 1);
        renderUsers();
        showToast('Gebruiker verwijderd.');
      }
    }
  });

  $('#userSave').addEventListener('click', () => {
    const name = $('#userName').value.trim();
    const email = $('#userEmail').value.trim();
    const phone = $('#userPhone').value.trim();
    const location = $('#userLocation').value;
    const role = $('#userRole').value;

    if (!name || !email) {
      showToast('Naam en e-mail zijn verplicht.');
      return;
    }

    if (state.editUserId) {
      const user = USERS.find(item => item.id === state.editUserId);
      Object.assign(user, { name, email, phone, location, role });
      showToast('Gebruiker bijgewerkt.');
    } else {
      USERS.push({ id: `U${Math.floor(Math.random() * 10000)}`, name, email, phone, location, role });
      showToast('Gebruiker toegevoegd.');
    }

    closeModals();
    renderUsers();
  });

  $('#usersPrev').addEventListener('click', () => {
    if (state.usersPage > 1) {
      state.usersPage -= 1;
      renderUsers();
    }
  });

  $('#usersNext').addEventListener('click', () => {
    state.usersPage += 1;
    renderUsers();
  });

  $('#usersPageSize').addEventListener('change', () => {
    state.usersPage = 1;
    renderUsers();
  });

  $('#backToFleet').addEventListener('click', () => {
    setMainTab('vloot');
  });

  $$('#truckDetail [data-subtab]').forEach(button => button.addEventListener('click', () => setDetailTab(button.dataset.subtab)));
}

async function loadInitialData() {
  const [locationsResult, fleetResult, usersResult] = await Promise.allSettled([
    fetchLocations(),
    fetchFleet(),
    fetchUsers()
  ]);

  let hadError = false;

  if (locationsResult.status === 'fulfilled') {
    setLocations(locationsResult.value);
  } else {
    console.error('Kon locaties niet laden vanuit Supabase.', locationsResult.reason);
    hadError = true;
  }

  if (fleetResult.status === 'fulfilled') {
    setFleet(fleetResult.value);
  } else {
    console.error('Kon vloot niet laden vanuit Supabase.', fleetResult.reason);
    hadError = true;
  }

  if (usersResult.status === 'fulfilled') {
    setUsers(usersResult.value);
  } else {
    console.error('Kon gebruikers niet laden vanuit Supabase.', usersResult.reason);
    hadError = true;
  }

  if (hadError) {
    showToast('Live data niet beschikbaar – voorbeelddata worden gebruikt.');
  }
}

async function init() {
  await loadInitialData();
  populateLocationFilters();
  renderFleet();
  renderActivity();
  renderUsers();
  wireEvents();
}

document.addEventListener('DOMContentLoaded', () => {
  init();
});
