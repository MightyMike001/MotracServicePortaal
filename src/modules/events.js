import { FLEET, USERS } from '../data.js';
import { state } from '../state.js';
import { $, $$, fmtDate, showToast, openModal, closeModals, kv, formatOdoLabel } from '../utils.js';
import { renderFleet } from './fleet.js';
import { renderActivity } from './activity.js';
import { renderUsers } from './users.js';
import { openDetail, setDetailTab } from './detail.js';
import { canViewFleetAsset } from './access.js';
import { switchMainTab } from './tabs.js';
import { handleLoginSubmit, signOut } from './auth.js';
import { handleAccountRequestSubmit, handleAccountRequestAction } from './accountRequests.js';

export function wireEvents() {
  if (state.eventsWired) return;
  state.eventsWired = true;

  function closeKebabMenus(except = null) {
    $$('.kebab-menu').forEach(menu => {
      if (menu !== except) {
        menu.classList.add('hidden');
      }
    });
  }

  const mainNav = $('#mainNav');
  const mobileMenuToggle = $('#mobileMenuToggle');
  const collapseMobileMenu = () => {
    if (!mainNav || !mobileMenuToggle) return;
    mainNav.classList.add('hidden');
    mobileMenuToggle.setAttribute('aria-expanded', 'false');
  };

  mobileMenuToggle?.addEventListener('click', () => {
    if (!mainNav) return;
    const isHidden = mainNav.classList.toggle('hidden');
    mobileMenuToggle.setAttribute('aria-expanded', isHidden ? 'false' : 'true');
  });

  document.addEventListener('click', event => {
    if (!mainNav || !mobileMenuToggle) return;
    if (mainNav.classList.contains('hidden')) return;
    if (!window.matchMedia('(max-width: 639px)').matches) return;
    if (event.target.closest('#mainNav') || event.target.closest('#mobileMenuToggle')) return;
    collapseMobileMenu();
  });

  $('#userBtn').addEventListener('click', () => $('#userMenu').classList.toggle('hidden'));
  $('#cancelUserMenu').addEventListener('click', () => $('#userMenu').classList.add('hidden'));
  document.addEventListener('click', event => {
    if (!event.target.closest('#userBtn') && !event.target.closest('#userMenu')) {
      $('#userMenu').classList.add('hidden');
    }
  });
  $('#logoutBtn').addEventListener('click', signOut);

  const loginForm = $('#loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLoginSubmit);
  }

  $$('#mainTabs button').forEach(button =>
    button.addEventListener('click', () => {
      if (button.disabled) return;
      switchMainTab(button.dataset.tab);
      if (window.matchMedia('(max-width: 639px)').matches) {
        collapseMobileMenu();
      }
    })
  );

  $('#openAccountRequest')?.addEventListener('click', () => {
    const form = $('#accountRequestForm');
    if (form?.reset) {
      form.reset();
    }
    openModal('#modalAccountRequest');
  });

  const accountRequestForm = $('#accountRequestForm');
  if (accountRequestForm) {
    accountRequestForm.addEventListener('submit', handleAccountRequestSubmit);
  }

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
    if (!truck || !canViewFleetAsset(truck)) return;

    if (action === 'newTicket' || action === 'newTicketFromDetail') {
      $('#ticketTruck').value = truck.id;
      openModal('#modalTicket');
      return;
    }

    if (action === 'updateOdo' || action === 'updateOdoFromDetail') {
      $('#odoCurrent').textContent = formatOdoLabel(truck.odo, truck.odoDate);
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

  document.addEventListener('click', event => {
    const requestButton = event.target.closest('[data-request-action]');
    if (!requestButton) return;
    handleAccountRequestAction(requestButton);
  });

  document.querySelectorAll('.modal [data-close]').forEach(button => button.addEventListener('click', closeModals));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeModals();
  });

  $('#btnNewTicket').addEventListener('click', () => openModal('#modalTicket'));
  $('#btnNewTicketMobile')?.addEventListener('click', () => {
    openModal('#modalTicket');
    collapseMobileMenu();
  });
  $('#ticketCreate').addEventListener('click', () => {
    const id = $('#ticketTruck').value;
    const type = $('#ticketType').value;
    const desc = $('#ticketDesc').value.trim();
    if (!id || !desc) {
      showToast('Vul minimaal truck en omschrijving in.');
      return;
    }

    const truck = FLEET.find(item => item.id === id);
    if (!truck || !canViewFleetAsset(truck)) {
      showToast('U heeft geen toegang tot dit object.');
      return;
    }
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
    switchMainTab('activiteit');
    showToast('Servicemelding aangemaakt.');

    $('#ticketOrder').value = '';
    $('#ticketDesc').value = '';
    $('#ticketPhotos').value = '';
  });

  $('#odoSave').addEventListener('click', event => {
    const id = event.target.dataset.id;
    const truck = FLEET.find(item => item.id === id);
    if (!truck || !canViewFleetAsset(truck)) {
      showToast('U heeft geen toegang tot dit object.');
      return;
    }
    const value = parseInt($('#odoNew').value, 10);
    const currentOdo = typeof truck.odo === 'number' && Number.isFinite(truck.odo) ? truck.odo : null;
    if (Number.isNaN(value) || value < 0 || (currentOdo !== null && value < currentOdo)) {
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
    if (!truck || !canViewFleetAsset(truck)) {
      showToast('U heeft geen toegang tot dit object.');
      return;
    }
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
    if (!truck || !canViewFleetAsset(truck)) {
      showToast('U heeft geen toegang tot dit object.');
      return;
    }
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
    switchMainTab('vloot');
  });

  $$('#truckDetail [data-subtab]').forEach(button => button.addEventListener('click', () => setDetailTab(button.dataset.subtab)));
}
