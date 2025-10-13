import { wireEvents } from './modules/events.js';
import { initializeAuth } from './modules/auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  wireEvents();
  await initializeAuth();
});
