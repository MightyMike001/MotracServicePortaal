import { wireEvents } from './modules/events.js';
import { initializeAuth } from './modules/auth.js';
import { initThemeToggle } from './modules/theme.js';

document.addEventListener('DOMContentLoaded', async () => {
  wireEvents();
  await initializeAuth();
  initThemeToggle();
});
