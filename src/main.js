import { wireEvents } from './modules/events.js';
import { initializeAuth } from './modules/auth.js';
import { initThemeToggle } from './modules/theme.js';

async function bootstrap() {
  wireEvents();
  await initializeAuth();
  initThemeToggle();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
  bootstrap();
}
