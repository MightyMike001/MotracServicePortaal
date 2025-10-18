import test from 'node:test';
import assert from 'node:assert/strict';

function createStubElement() {
  return {
    classList: {
      add() {},
      remove() {},
      toggle() {},
      contains() {
        return false;
      }
    },
    setAttribute() {},
    removeAttribute() {},
    appendChild() {},
    append() {},
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    addEventListener() {},
    removeEventListener() {},
    focus() {},
    textContent: '',
    innerHTML: '',
    value: ''
  };
}

const elementCache = new Map();

function getOrCreateElement(selector) {
  if (!elementCache.has(selector)) {
    elementCache.set(selector, createStubElement());
  }
  return elementCache.get(selector);
}

function querySelector(selector) {
  if (selector === '#currentUserName') {
    return null;
  }
  return getOrCreateElement(selector);
}

global.document = {
  querySelector,
  querySelectorAll() {
    return [];
  },
  getElementById: querySelector,
  createElement() {
    return createStubElement();
  },
  createTextNode(value) {
    return { textContent: String(value ?? '') };
  },
  body: {
    appendChild() {},
    removeChild() {}
  }
};

global.window = {
  matchMedia() {
    return {
      matches: false,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {}
    };
  },
  sessionStorage: {
    getItem() {
      return null;
    },
    setItem() {},
    removeItem() {}
  },
  localStorage: {
    getItem() {
      return null;
    },
    setItem() {},
    removeItem() {}
  },
  addEventListener() {},
  removeEventListener() {},
  setTimeout,
  clearTimeout
};

global.localStorage = window.localStorage;
global.sessionStorage = window.sessionStorage;

globalThis.Element = function () {};

delete global.navigator;

global.navigator = {
  userAgent: 'node'
};

const { handleAuthenticatedSession } = await import('../src/modules/auth.js');
import { state } from '../src/state.js';

test('handleAuthenticatedSession resets state safely when user name element is absent', async () => {
  state.session = { access_token: 'token' };
  state.profile = { role: 'Beheerder' };
  await assert.doesNotReject(() => handleAuthenticatedSession(null, { forceReload: true }));
  assert.equal(state.session, null);
  assert.equal(state.profile, null);
});

test('handleAuthenticatedSession signs out gracefully when session user details are missing', async () => {
  state.session = { access_token: 'token', user: { id: 'existing-user' } };
  state.profile = { id: 'profile-id', auth_user_id: 'existing-user' };

  const incompleteSession = { access_token: 'token', user: null };

  await assert.doesNotReject(() => handleAuthenticatedSession(incompleteSession, { forceReload: true }));

  assert.equal(state.session, null);
  assert.equal(state.profile, null);
});
