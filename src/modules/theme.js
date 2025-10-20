const STORAGE_KEY = 'theme';
const DARK = 'dark';
const LIGHT = 'light';

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === DARK) {
    root.setAttribute('data-theme', DARK);
  } else {
    root.removeAttribute('data-theme');
  }
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (error) {
    console.error('Thema kon niet opgeslagen worden:', error);
  }
  updateToggle(theme);
}

function getActiveTheme() {
  return document.documentElement.getAttribute('data-theme') === DARK ? DARK : LIGHT;
}

function updateToggle(activeTheme) {
  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;

  const icon = toggle.querySelector('.theme-toggle__icon');
  const label = toggle.querySelector('.theme-toggle__label');

  const nextTheme = activeTheme === DARK ? LIGHT : DARK;
  const isNextDark = nextTheme === DARK;

  if (icon) {
    icon.textContent = isNextDark ? '🌞' : '🌙';
  }
  if (label) {
    label.textContent = isNextDark ? 'Donker thema' : 'Licht thema';
  }

  const ariaLabel = `Schakel naar ${isNextDark ? 'donker' : 'licht'} thema`;
  toggle.setAttribute('aria-label', ariaLabel);
}

export function initThemeToggle() {
  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;

  const storedTheme = (() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      console.error('Thema kon niet uit opslag worden gelezen:', error);
      return null;
    }
  })();
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  const defaultTheme = prefersDark.matches ? DARK : LIGHT;
  const initialTheme = storedTheme === DARK || storedTheme === LIGHT ? storedTheme : defaultTheme;

  applyTheme(initialTheme);

  toggle.addEventListener('click', () => {
    const nextTheme = getActiveTheme() === DARK ? LIGHT : DARK;
    applyTheme(nextTheme);
  });

  prefersDark.addEventListener?.('change', event => {
    const stored = (() => {
      try {
        return localStorage.getItem(STORAGE_KEY);
      } catch (error) {
        console.error('Thema kon niet uit opslag worden gelezen:', error);
        return null;
      }
    })();
    if (stored !== DARK && stored !== LIGHT) {
      applyTheme(event.matches ? DARK : LIGHT);
    }
  });
}
