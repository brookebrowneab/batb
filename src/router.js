/**
 * Minimal hash-based router for static SPA deployment (GitHub Pages compatible).
 * Routes are defined as { path, render, guard? } where render returns an HTMLElement or string.
 * Guards are checked before rendering; if a guard returns a redirect, navigation is redirected.
 */

const routes = [];
let notFoundRenderer = () => '<p>Page not found.</p>';
let globalGuard = null;

/**
 * @param {string} path
 * @param {function} render - () => string | HTMLElement
 */
export function addRoute(path, render) {
  routes.push({ path, render });
}

export function setNotFound(render) {
  notFoundRenderer = render;
}

/**
 * Set a global guard that runs before every route render.
 * @param {function} guardFn - (path) => { allowed: boolean, redirect: string|null }
 */
export function setGuard(guardFn) {
  globalGuard = guardFn;
}

export function navigate(path) {
  window.location.hash = path;
}

export function currentPath() {
  return window.location.hash.slice(1) || '/';
}

/**
 * Parse query parameters from the current hash URL.
 * e.g. #/staff/student-profile?id=abc → { id: 'abc' }
 */
export function getQueryParams() {
  const hash = window.location.hash.slice(1) || '/';
  const qIndex = hash.indexOf('?');
  if (qIndex === -1) return {};
  const params = {};
  const pairs = hash.slice(qIndex + 1).split('&');
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key) params[decodeURIComponent(key)] = decodeURIComponent(value || '');
  }
  return params;
}

export function startRouter(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) {
    throw new Error(`Router container "${containerSelector}" not found`);
  }

  function renderCurrentRoute() {
    const fullPath = currentPath();
    const path = fullPath.split('?')[0];

    // Run global guard
    if (globalGuard) {
      const result = globalGuard(path);
      if (!result.allowed && result.redirect) {
        navigate(result.redirect);
        return;
      }
    }

    const match = routes.find((r) => r.path === path);
    const content = match ? match.render() : notFoundRenderer();

    if (typeof content === 'string') {
      container.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      container.innerHTML = '';
      container.appendChild(content);
    }

    updateActiveLinks(path);
  }

  window.addEventListener('hashchange', renderCurrentRoute);
  renderCurrentRoute();

  // Return a re-render function so auth state changes can trigger route re-evaluation
  return { rerender: renderCurrentRoute };
}

function updateActiveLinks(activePath) {
  document.querySelectorAll('nav a[data-route]').forEach((link) => {
    const route = link.getAttribute('data-route');
    link.classList.toggle('active', route === activePath);
  });
}
