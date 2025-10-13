import { USERS } from '../data.js';
import { state } from '../state.js';
import { $, showToast, closeModals } from '../utils.js';
import { renderAccountRequests, renderUsers } from './users.js';
import { getFleetSummaryById } from './tabs.js';
import {
  createAccountRequest,
  approveAccountRequest,
  rejectAccountRequest
} from '../api/supabase.js';

export async function handleAccountRequestSubmit(event) {
  event.preventDefault();

  const name = $('#requestName')?.value.trim();
  const organisation = $('#requestOrganisation')?.value.trim();
  const email = $('#requestEmail')?.value.trim();
  const phone = $('#requestPhone')?.value.trim();
  const requestNotes = $('#requestNotes')?.value.trim();

  if (!name || !organisation || !email) {
    showToast('Naam, organisatie en e-mailadres zijn verplicht.');
    return;
  }

  const form = event.target;
  const submitButton = form.querySelector('[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
  }

  try {
    const createdRequest = await createAccountRequest({
      name,
      organisation,
      email,
      phone,
      requestNotes
    });

    if (typeof form.reset === 'function') {
      form.reset();
    }

    closeModals();

    if (Array.isArray(state.accountRequests) && state.allowedTabs?.includes('users') && createdRequest) {
      state.accountRequests.unshift(createdRequest);
      renderAccountRequests();
    }

    showToast(
      'Uw aanvraag is ontvangen. U kunt direct een wachtwoord instellen en inloggen; alle inhoud blijft verborgen totdat een beheerder uw rol heeft toegewezen en het account heeft goedgekeurd.'
    );
  } catch (error) {
    console.error('Accountaanvraag versturen mislukt', error);
    showToast('Het versturen van de accountaanvraag is mislukt. Probeer het opnieuw.');
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
    }
  }
}

export async function handleAccountRequestAction(button) {
  const action = button.dataset.requestAction;
  const requestId = button.dataset.id;
  if (!action || !requestId) return;

  const request = state.accountRequests.find(item => item.id === requestId);
  if (!request) return;

  if (request.status !== 'pending') {
    showToast('Deze aanvraag is al verwerkt.');
    renderAccountRequests();
    return;
  }

  const container = button.closest('[data-request]');
  if (!container) return;

  const toggleButtonsDisabled = disabled => {
    container.querySelectorAll('[data-request-action]').forEach(actionButton => {
      actionButton.disabled = disabled;
    });
  };

  if (action === 'reject') {
    toggleButtonsDisabled(true);
    try {
      const updatedRequest = await rejectAccountRequest({
        id: requestId,
        assignedByProfileId: state.profile?.id || null
      });

      if (updatedRequest) {
        Object.assign(request, updatedRequest);
        renderAccountRequests();
        showToast(`Aanvraag van ${request.name} geweigerd.`);
      }
    } catch (error) {
      console.error('Accountaanvraag weigeren mislukt', error);
      showToast('Aanvraag kon niet worden geweigerd. Probeer het opnieuw.');
    } finally {
      toggleButtonsDisabled(false);
    }
    return;
  }

  if (action !== 'approve') {
    return;
  }

  const roleSelect = container.querySelector('[data-request-role]');
  const fleetSelect = container.querySelector('[data-request-fleet]');
  const selectedRole = roleSelect?.value || 'Gebruiker';
  const selectedFleetId = fleetSelect?.value || '';
  const fleetSummary = getFleetSummaryById(selectedFleetId);
  const newUserLocation = fleetSummary?.locations?.[0] || request.organisation || '—';

  toggleButtonsDisabled(true);

  try {
    const updatedRequest = await approveAccountRequest({
      id: requestId,
      assignedRole: selectedRole,
      assignedFleetId: selectedFleetId || null,
      assignedByProfileId: state.profile?.id || null
    });

    if (updatedRequest) {
      Object.assign(request, updatedRequest);

      USERS.push({
        id: `U${Math.floor(Math.random() * 10000)}`,
        name: request.name,
        email: request.email,
        phone: request.phone || '',
        location: newUserLocation,
        role: selectedRole
      });

      renderUsers();
      renderAccountRequests();
      showToast(`Account toegekend aan ${request.name}.`);
    }
  } catch (error) {
    console.error('Accountaanvraag toekennen mislukt', error);
    showToast('Account kon niet worden toegekend. Probeer het opnieuw.');
  } finally {
    toggleButtonsDisabled(false);
  }
}
