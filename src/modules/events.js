import { FLEET, USERS } from '../data.js';
import { state } from '../state.js';
import { $, $$, fmtDate, openModal, closeModals, kv, formatHoursLabel } from '../utils.js';
import { showToast } from './ui/toast.js';
import { renderFleet, updateLocationFilter, openBmwEditor } from './fleet.js';
import {
  renderActivity,
  openActivityDetail,
  closeActivityDetail,
  initActivityComposer,
  consumeTicketAttachments,
  resetTicketAttachments
} from './activity.js';
import { renderUsers, saveUser } from './users.js';
import { openDetail, setDetailTab } from './detail.js';
import { canViewFleetAsset } from './access.js';
import { switchMainTab } from './tabs.js';
import { handleLoginSubmit, handlePersonaLogin, signOut } from './auth.js';
import { handleAccountRequestAction } from './accountRequests.js';

export function wireEvents() {
  if (state.eventsWired) return;
  state.eventsWired = true;

  initActivityComposer();

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

  const userBtn = $('#userBtn');
  const userMenu = $('#userMenu');
  const setUserMenuVisibility = visible => {
    if (!userMenu || !userBtn) return;
    userMenu.classList.toggle('hidden', !visible);
    userBtn.setAttribute('aria-expanded', visible ? 'true' : 'false');
  };

  userBtn?.addEventListener('click', () => {
    if (!userMenu) return;
    const isHidden = userMenu.classList.contains('hidden');
    setUserMenuVisibility(isHidden);
  });

  const closeUserMenu = () => {
    if (!userMenu || !userBtn) return;
    if (!userMenu.classList.contains('hidden')) {
      setUserMenuVisibility(false);
    }
  };

  $('#cancelUserMenu')?.addEventListener('click', () => {
    closeUserMenu();
    userBtn?.focus?.();
  });

  document.addEventListener('click', event => {
    if (!event.target.closest('#userBtn') && !event.target.closest('#userMenu')) {
      closeUserMenu();
    }
  });

  $('#logoutBtn')?.addEventListener('click', async () => {
    closeUserMenu();
    await signOut();
  });

  const loginForm = $('#loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLoginSubmit);
  }

  $$('[data-persona-login]').forEach(button =>
    button.addEventListener('click', handlePersonaLogin)
  );

  $$('[data-nav-button]').forEach(button =>
    button.addEventListener('click', () => {
      if (button.disabled) return;
      switchMainTab(button.dataset.tab);
      if (window.matchMedia('(max-width: 639px)').matches) {
        collapseMobileMenu();
      }
    })
  );

  const resetUserFormErrors = () => {
    document.querySelectorAll('#modalUser .input-error').forEach(element => {
      element.textContent = '';
      element.classList.add('hidden');
    });
    ['#userName', '#userEmail', '#userLocation', '#userRole'].forEach(selector => {
      const field = $(selector);
      if (field) {
        field.classList.remove('border-red-500');
        field.removeAttribute('aria-invalid');
      }
    });
  };

  $('#locationFilter')?.addEventListener('change', event => {
    updateLocationFilter(event.target.value);
    renderFleet();
    renderActivity();
  });
  const applyFleetSearch = () => {
    state.fleetFilter.query = $('#searchInput').value;
    renderFleet();
  };

  $('#searchBtn')?.addEventListener('click', applyFleetSearch);
  $('#searchInput')?.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      applyFleetSearch();
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const activityCard = event.target.closest('[data-activity-card]');
    if (!activityCard) return;
    event.preventDefault();
    const activityId = activityCard.dataset.activityId;
    const truckId = activityCard.dataset.truckId;
    if (truckId && activityId) {
      openActivityDetail(truckId, activityId);
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
      const ticketSelect = $('#ticketTruck');
      if (ticketSelect) {
        ticketSelect.value = truck.id;
      }
      resetTicketAttachments();
      openModal('#modalTicket');
      return;
    }

    if (action === 'updateOdo' || action === 'updateOdoFromDetail') {
      const odoCurrent = $('#odoCurrent');
      if (odoCurrent) {
        odoCurrent.textContent = formatHoursLabel(truck.hours, truck.hoursDate);
      }
      const odoInput = $('#odoNew');
      if (odoInput) {
        odoInput.value = '';
      }
      const odoSaveButton = $('#odoSave');
      if (odoSaveButton) {
        odoSaveButton.dataset.id = id;
      }
      openModal('#modalOdo');
      return;
    }

    if (action === 'editRef' || action === 'editRefFromDetail') {
      const refCurrent = $('#refCurrent');
      if (refCurrent) {
        refCurrent.textContent = truck.ref;
      }
      const refInput = $('#refNew');
      if (refInput) {
        refInput.value = truck.ref;
      }
      const refSaveButton = $('#refSave');
      if (refSaveButton) {
        refSaveButton.dataset.id = id;
      }
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
      return;
    }

    if (action === 'editBmw') {
      openBmwEditor(id);
      return;
    }
  });

  document.addEventListener('click', event => {
    const requestButton = event.target.closest('[data-request-action]');
    if (!requestButton) return;
    handleAccountRequestAction(requestButton);
  });

  document.addEventListener('click', event => {
    const detailTrigger = event.target.closest('[data-activity-open]');
    if (!detailTrigger) return;
    const activityId = detailTrigger.dataset.activityOpen;
    const truckId = detailTrigger.dataset.truckId || detailTrigger.closest('[data-activity-card]')?.dataset.truckId;
    if (truckId && activityId) {
      openActivityDetail(truckId, activityId);
    }
  });

  document.querySelectorAll('.modal [data-close]').forEach(button => button.addEventListener('click', closeModals));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeModals();
      closeActivityDetail();
    }
  });

  $('#btnNewTicket')?.addEventListener('click', () => openModal('#modalTicket'));
  $('#btnNewTicketMobile')?.addEventListener('click', () => {
    openModal('#modalTicket');
    collapseMobileMenu();
  });
  $('#ticketCreate')?.addEventListener('click', () => {
    const id = $('#ticketTruck')?.value;
    const type = $('#ticketType')?.value;
    const ticketDescInput = $('#ticketDesc');
    const desc = ticketDescInput ? ticketDescInput.value.trim() : '';
    if (!id || !desc) {
      showToast('Vul minimaal truck en omschrijving in.');
      return;
    }

    const truck = FLEET.find(item => item.id === id);
    if (!truck || !canViewFleetAsset(truck)) {
      showToast('U heeft geen toegang tot dit object.');
      return;
    }
    const attachments = consumeTicketAttachments();
    truck.activity.push({
      id: `M-${Math.floor(1000 + Math.random() * 9000)}`,
      type,
      desc,
      status: 'Open',
      date: new Date().toISOString(),
      attachments,
      createdBy: state.profile?.display_name || state.profile?.email || 'Onbekend'
    });
    truck.openActivityCount = truck.activity.filter(activity => activity?.status === 'Open').length;

    closeModals();
    renderFleet();
    renderActivity();
    switchMainTab('activiteit');
    showToast('Servicemelding aangemaakt.');

    const orderInput = $('#ticketOrder');
    if (orderInput) {
      orderInput.value = '';
    }
    const ticketDesc = $('#ticketDesc');
    if (ticketDesc) {
      ticketDesc.value = '';
    }
    const ticketPhotos = $('#ticketPhotos');
    if (ticketPhotos) {
      ticketPhotos.value = '';
    }
  });

  $('#odoSave')?.addEventListener('click', event => {
    const id = event.target.dataset.id;
    const truck = FLEET.find(item => item.id === id);
    if (!truck || !canViewFleetAsset(truck)) {
      showToast('U heeft geen toegang tot dit object.');
      return;
    }
    const odoInput = $('#odoNew');
    if (!odoInput) {
      showToast('Geen veld voor urenstand gevonden.');
      return;
    }
    const value = parseInt(odoInput.value, 10);
    const currentHours = typeof truck.hours === 'number' && Number.isFinite(truck.hours) ? truck.hours : null;
    if (Number.isNaN(value) || value < 0 || (currentHours !== null && value < currentHours)) {
      showToast('Nieuwe urenstand moet ≥ huidige zijn.');
      return;
    }
    truck.hours = value;
    truck.hoursDate = new Date().toISOString();
    truck.odo = value;
    truck.odoDate = truck.hoursDate;
    closeModals();
    renderFleet();
    setDetailTab('info');
    showToast('Urenstand bijgewerkt.');
  });

  $('#refSave')?.addEventListener('click', event => {
    const id = event.target.dataset.id;
    const truck = FLEET.find(item => item.id === id);
    if (!truck || !canViewFleetAsset(truck)) {
      showToast('U heeft geen toegang tot dit object.');
      return;
    }
    const refInput = $('#refNew');
    const value = refInput ? refInput.value.trim() : '';
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

  $('#inactiveConfirm')?.addEventListener('click', event => {
    const id = event.target.dataset.id;
    const date = $('#inactiveDate')?.value;
    const reasonInput = $('#inactiveReason');
    const reason = reasonInput ? reasonInput.value.trim() : '';
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

  $('#activityLocationFilter')?.addEventListener('change', renderActivity);
  const applyActivitySearch = () => {
    renderActivity();
  };

  $('#activitySearchBtn')?.addEventListener('click', applyActivitySearch);
  $('#activitySearchInput')?.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      applyActivitySearch();
    }
  });

  $('#btnAddUser')?.addEventListener('click', () => {
    state.editUserId = null;
    $('#userModalTitle').textContent = 'Gebruiker toevoegen';
    $('#userName').value = '';
    $('#userEmail').value = '';
    $('#userPhone').value = '';
    const locationSelect = $('#userLocation');
    if (locationSelect && locationSelect.options.length) {
      locationSelect.value = locationSelect.options[0].value;
    }
    $('#userRole').value = 'Gebruiker';
    resetUserFormErrors();
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
      resetUserFormErrors();
      openModal('#modalUser');
    } else if (button.dataset.userAction === 'reset') {
      showToast(`Wachtwoordreset aangevraagd voor ${USERS.find(item => item.id === id)?.name || 'gebruiker'}.`, {
        variant: 'info'
      });
    } else if (button.dataset.userAction === 'delete') {
      const index = USERS.findIndex(item => item.id === id);
      if (index > -1) {
        USERS.splice(index, 1);
        renderUsers();
        showToast('Gebruiker verwijderd.');
      }
    }
  });

  $('#userSave')?.addEventListener('click', () => {
    const success = saveUser();
    if (success) {
      closeModals();
    }
  });

  $('#usersPrev')?.addEventListener('click', () => {
    if (state.usersPage > 1) {
      state.usersPage -= 1;
      renderUsers();
    }
  });

  $('#usersNext')?.addEventListener('click', () => {
    state.usersPage += 1;
    renderUsers();
  });

  $('#usersPageSize')?.addEventListener('change', () => {
    state.usersPage = 1;
    renderUsers();
  });

  $('#backToFleet')?.addEventListener('click', () => {
    switchMainTab('vloot');
  });

  $$('#truckDetail [data-subtab]').forEach(button => button.addEventListener('click', () => setDetailTab(button.dataset.subtab)));
}
