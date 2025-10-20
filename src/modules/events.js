import { USERS, getFleetById } from '../data.js';
import { state } from '../state.js';
import { $, $$, fmtDate, openModal, closeModals, closeModal, kv, formatHoursLabel } from '../utils.js';
import { showToast } from './ui/toast.js';
import { renderFleet, updateLocationFilter, openBmwEditor } from './fleet.js';
import { applyFiltersFromUrl, resetFilters, syncFiltersToUrl } from './filterSync.js';
import {
  renderActivity,
  openActivityDetail,
  closeActivityDetail,
  initActivityComposer,
  hasPendingTicketAttachments,
  consumeTicketAttachments,
  resetTicketAttachments,
  refreshMeldingen
} from './activity.js';
import { renderUsers, saveUser } from './users.js';
import { openDetail, refreshDetail } from './detail.js';
import { canViewFleetAsset } from './access.js';
import { switchMainTab } from './tabs.js';
import { handleLoginSubmit, handlePersonaLogin, signOut } from './auth.js';
import { handleAccountRequestAction } from './accountRequests.js';
import { initRouter } from './router.js';

export function wireEvents() {
  if (state.eventsWired) return;
  state.eventsWired = true;

  initActivityComposer();
  initRouter(switchMainTab);
  applyFiltersFromUrl({ updateDom: false });

  const getAccessibleTruck = truckId => {
    if (!truckId) return null;
    const truck = getFleetById(truckId);
    return truck && canViewFleetAsset(truck) ? truck : null;
  };

  const handleLocationChange = nextLocation => {
    const targetLocation = nextLocation || 'Alle locaties';
    const locationFilter = $('#locationFilter');
    if (locationFilter && locationFilter.value !== targetLocation) {
      locationFilter.value = targetLocation;
    }
    resetFilters();
    updateLocationFilter(targetLocation);
    renderFleet();
    renderActivity();
    syncFiltersToUrl();
  };

  window.addEventListener('popstate', () => {
    const { location, locationChanged } = applyFiltersFromUrl({ fallbackToStored: false });
    const nextLocation = location || state.fleetFilter.location || 'Alle locaties';
    if (locationChanged) {
      updateLocationFilter(nextLocation);
    }
    if (locationChanged || location != null) {
      const locationFilter = $('#locationFilter');
      if (locationFilter) {
        locationFilter.value = nextLocation;
      }
    }
    renderFleet();
    renderActivity();
  });

  function closeKebabMenus(except = null) {
    $$('.kebab-menu').forEach(menu => {
      if (menu !== except) {
        menu.classList.add('hidden');
      }
    });
  }

  const mainNav = $('#mainNav');
  const collapseMobileMenu = () => {
    if (!mainNav) return;
    mainNav.classList.add('hidden');
  };

  const setTicketDateTimeDefaults = () => {
    const now = new Date();
    const dateInput = $('#ticketDate');
    if (dateInput) {
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      dateInput.value = `${year}-${month}-${day}`;
    }
    const timeInput = $('#ticketTime');
    if (timeInput) {
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      timeInput.value = `${hours}:${minutes}`;
    }
  };

  const resetTicketForm = truckId => {
    resetTicketAttachments();
    const ticketSelect = $('#ticketTruck');
    if (ticketSelect && truckId) {
      ticketSelect.value = truckId;
    }
    const orderInput = $('#ticketOrder');
    if (orderInput) {
      orderInput.value = '';
      orderInput.removeAttribute('aria-invalid');
    }
    const descInput = $('#ticketDesc');
    if (descInput) {
      descInput.value = '';
    }
    setTicketDateTimeDefaults();
  };

  setTicketDateTimeDefaults();

  let ticketAutoCloseTimer = null;
  const cancelTicketAutoClose = () => {
    window.clearTimeout(ticketAutoCloseTimer);
    ticketAutoCloseTimer = null;
  };

  const confirmModal = $('#modalConfirmAction');
  const confirmModalConfirmButton = $('#confirmModalConfirm');
  const confirmActionState = {
    type: null,
    userId: null,
    timerId: null
  };

  const resetConfirmActionState = () => {
    if (confirmActionState.timerId != null) {
      window.clearTimeout(confirmActionState.timerId);
      confirmActionState.timerId = null;
    }
    confirmActionState.type = null;
    confirmActionState.userId = null;
    if (confirmModalConfirmButton) {
      confirmModalConfirmButton.disabled = false;
      confirmModalConfirmButton.removeAttribute('aria-busy');
    }
  };

  confirmModal?.addEventListener('close', () => {
    resetConfirmActionState();
  });

  confirmModalConfirmButton?.addEventListener('click', () => {
    if (!confirmModal) return;
    const { type, userId } = confirmActionState;
    if (!type) {
      closeModal(confirmModal);
      return;
    }

    confirmModalConfirmButton.disabled = true;
    confirmModalConfirmButton.setAttribute('aria-busy', 'true');

    if (type === 'delete') {
      const index = USERS.findIndex(item => item.id === userId);
      if (index > -1) {
        USERS.splice(index, 1);
        renderUsers();
      }
    }

    showToast('Actie succesvol uitgevoerd', { variant: 'success' });

    if (confirmActionState.timerId != null) {
      window.clearTimeout(confirmActionState.timerId);
    }
    confirmActionState.timerId = window.setTimeout(() => {
      closeModal(confirmModal);
    }, 2000);
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
    handleLocationChange(event.target.value);
  });
  const applyFleetSearch = () => {
    state.fleetFilter.query = $('#searchInput').value;
    syncFiltersToUrl();
    renderFleet();
  };

  $('#searchBtn')?.addEventListener('click', applyFleetSearch);
  $('#searchInput')?.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      applyFleetSearch();
    }
  });

  $('#resetFiltersBtn')?.addEventListener('click', () => {
    handleLocationChange('Alle locaties');
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
    const truck = getAccessibleTruck(id);
    if (!truck) return;

    const detailModal = $('#vehicleDetailModal');

    if (action === 'newTicket' || action === 'newTicketFromDetail') {
      if (action === 'newTicketFromDetail') {
        closeModal(detailModal);
      }
      resetTicketForm(truck.id);
      cancelTicketAutoClose();
      openModal('#modalTicket');
      return;
    }

    if (action === 'updateOdo' || action === 'updateOdoFromDetail') {
      if (action === 'updateOdoFromDetail') {
        closeModal(detailModal);
      }
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
      if (action === 'editRefFromDetail') {
        closeModal(detailModal);
      }
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

    if (action === 'markOutOfService') {
      closeModal(detailModal);
      truck.active = false;
      renderFleet();
      renderActivity();
      showToast(`${truck.id} is gemarkeerd als buiten gebruik.`, { variant: 'info' });
      return;
    }

    if (action === 'downloadReport') {
      closeModal(detailModal);
      showToast('Rapport wordt klaargezet voor download.', { variant: 'success' });
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

  document.querySelectorAll('.modal [data-close]').forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault();
      const modal = button.closest('.modal');
      if (modal) {
        closeModal(modal);
      } else {
        closeModals();
      }
    });
  });

  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', event => {
      if (event.target === modal) {
        closeModal(modal);
      }
    });
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeModals();
      closeActivityDetail();
    }
  });

  $('#btnNewTicket')?.addEventListener('click', () => {
    resetTicketForm();
    cancelTicketAutoClose();
    openModal('#modalTicket');
  });
  $('#btnNewTicketMobile')?.addEventListener('click', () => {
    resetTicketForm();
    cancelTicketAutoClose();
    openModal('#modalTicket');
    collapseMobileMenu();
  });
  $('#ticketCreate')?.addEventListener('click', async () => {
    const id = $('#ticketTruck')?.value;
    const type = $('#ticketType')?.value;
    const ticketDescInput = $('#ticketDesc');
    const desc = ticketDescInput ? ticketDescInput.value.trim() : '';
    const orderInput = $('#ticketOrder');
    const orderNumber = orderInput ? orderInput.value.trim() : '';
    const dateValue = $('#ticketDate')?.value;
    const timeValue = $('#ticketTime')?.value;

    if (!id || !desc) {
      showToast('Vul minimaal truck en omschrijving in.');
      return;
    }

    const orderIsValid = /^\d{4,}$/.test(orderNumber);
    if (!orderIsValid) {
      showToast('Opdrachtnummer moet minimaal 4 cijfers bevatten.');
      if (orderInput) {
        orderInput.setAttribute('aria-invalid', 'true');
        orderInput.focus();
      }
      return;
    }

    if (orderInput) {
      orderInput.removeAttribute('aria-invalid');
    }

    if (!dateValue || !timeValue) {
      showToast('Vul datum en tijd in.');
      return;
    }

    const scheduledDate = new Date(`${dateValue}T${timeValue}`);
    if (Number.isNaN(scheduledDate.getTime())) {
      showToast('Ongeldige datum of tijd.');
      return;
    }

    if (!hasPendingTicketAttachments()) {
      showToast('Voeg minimaal één foto toe bij de melding.');
      return;
    }

    const truck = getAccessibleTruck(id);
    if (!truck) {
      showToast('U heeft geen toegang tot dit object.');
      return;
    }
    const attachments = consumeTicketAttachments();
    const reportedAt = scheduledDate.toISOString();
    truck.activity.push({
      id: `M-${Math.floor(1000 + Math.random() * 9000)}`,
      type,
      desc,
      status: 'Open',
      date: reportedAt,
      orderNumber,
      attachments,
      createdBy: state.profile?.display_name || state.profile?.email || 'Onbekend'
    });
    truck.openActivityCount = truck.activity.filter(activity => activity?.status === 'Open').length;

    renderFleet();
    await refreshMeldingen();

    showToast('Storingsmelding succesvol aangemaakt', { variant: 'success' });

    window.clearTimeout(ticketAutoCloseTimer);
    ticketAutoCloseTimer = window.setTimeout(() => {
      closeModals();
      switchMainTab('activiteit');
      ticketAutoCloseTimer = null;
    }, 2000);

    resetTicketForm(id);
  });

  $('#odoSave')?.addEventListener('click', event => {
    const id = event.target.dataset.id;
    const truck = getAccessibleTruck(id);
    if (!truck) {
      showToast('U heeft geen toegang tot dit object.');
      return;
    }
    const odoInput = $('#odoNew');
    if (!odoInput) {
      showToast('Geen veld voor urenstand gevonden.');
      return;
    }
    const rawValue = typeof odoInput.value === 'string' ? odoInput.value.trim() : '';
    const value = rawValue === '' ? Number.NaN : Number.parseInt(rawValue, 10);
    const currentHours = typeof truck.hours === 'number' && Number.isFinite(truck.hours) ? truck.hours : null;
    if (Number.isNaN(value) || value < 0 || (currentHours !== null && value < currentHours)) {
      showToast('Nieuwe urenstand moet ≥ huidige zijn.');
      return;
    }
    truck.hours = value;
    truck.hoursDate = new Date().toISOString();
    truck.odo = value;
    truck.odoDate = truck.hoursDate;
    closeModal($('#modalOdo'));
    renderFleet();
    refreshDetail();
    showToast('Urenstand bijgewerkt.');
  });

  $('#refSave')?.addEventListener('click', event => {
    const id = event.target.dataset.id;
    const truck = getAccessibleTruck(id);
    if (!truck) {
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
    closeModal($('#modalRef'));
    renderFleet();
    refreshDetail();
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
    const truck = getAccessibleTruck(id);
    if (!truck) {
      showToast('U heeft geen toegang tot dit object.');
      return;
    }
    truck.active = false;
    closeModals();
    renderFleet();
    renderActivity();
    showToast('Truck gemarkeerd als inactief.');
  });

  $('#activityLocationFilter')?.addEventListener('change', event => {
    handleLocationChange(event.target.value);
  });
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
    } else if (button.dataset.userAction === 'reset' || button.dataset.userAction === 'delete') {
      resetConfirmActionState();
      confirmActionState.type = button.dataset.userAction;
      confirmActionState.userId = id;
      openModal('#modalConfirmAction');
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

  $('#moduleCycleBtn')?.addEventListener('click', () => {
    const allowedTabs = Array.isArray(state.allowedTabs) ? state.allowedTabs : [];
    if (allowedTabs.length <= 1) return;
    const currentIndex = allowedTabs.indexOf(state.activeTab);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % allowedTabs.length : 0;
    const nextTab = allowedTabs[nextIndex];
    if (nextTab && nextTab !== state.activeTab) {
      switchMainTab(nextTab);
    }
  });
}
