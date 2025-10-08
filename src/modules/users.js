import { USERS } from '../data.js';
import { state } from '../state.js';
import { $ } from '../utils.js';

export function renderUsers() {
  state.usersPageSize = parseInt($('#usersPageSize').value, 10) || state.usersPageSize;
  const totalPages = Math.max(1, Math.ceil(USERS.length / state.usersPageSize));
  if (state.usersPage > totalPages) {
    state.usersPage = totalPages;
  }

  const start = (state.usersPage - 1) * state.usersPageSize;
  const pageItems = USERS.slice(start, start + state.usersPageSize);

  $('#usersTbody').innerHTML = pageItems.map(user => `
    <tr class="border-b hover:bg-gray-50">
      <td class="py-3 px-3">
        <div class="font-medium">${user.name}</div>
        <div class="text-xs text-gray-500">${user.phone}</div>
      </td>
      <td class="py-3 px-3">${user.location}</td>
      <td class="py-3 px-3">${user.email}</td>
      <td class="py-3 px-3">${user.role}</td>
      <td class="py-3 px-3 text-right">
        <div class="relative inline-block kebab">
          <button class="px-2 py-1 border rounded-lg">⋮</button>
          <div class="kebab-menu hidden absolute right-0 mt-2 w-44 bg-white border rounded-lg shadow-soft z-10">
            <button class="w-full text-left px-4 py-2 hover:bg-gray-50" data-user-action="edit" data-id="${user.id}">Edit</button>
            <button class="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600" data-user-action="delete" data-id="${user.id}">Delete</button>
          </div>
        </div>
      </td>
    </tr>`).join('');

  $('#usersPageInfo').textContent = `Pagina ${state.usersPage} van ${totalPages}`;
  $('#usersPrev').disabled = state.usersPage <= 1;
  $('#usersNext').disabled = state.usersPage >= totalPages;
}
