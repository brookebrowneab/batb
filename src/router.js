/**
 * Minimal hash-based router for static SPA deployment (GitHub Pages compatible).
 * Routes are defined as { path, render } where render returns an HTMLElement or string.
 */

const routes = [];
let notFoundRenderer = () => '<p>Page not found.</p>';

export function addRoute(path, render) {
  routes.push({ path, render });
}

export function setNotFound(render) {
  notFoundRenderer = render;
}

export function navigate(path) {
  window.location.hash = path;
}

export function currentPath() {
  return window.location.hash.slice(1) || '/';
}

export function startRouter(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) {
    throw new Error(`Router container "${containerSelector}" not found`);
  }

  function renderCurrentRoute() {
    const path = currentPath();
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
}

function updateActiveLinks(currentPath) {
  document.querySelectorAll('nav a[data-route]').forEach((link) => {
    const route = link.getAttribute('data-route');
    link.classList.toggle('active', route === currentPath);
  });
}
