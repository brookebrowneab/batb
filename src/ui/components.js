import { ICONS } from './icons.js';

/**
 * Build a styled button element.
 * @param {string} text
 * @param {'primary'|'accent'|'destructive'|'ghost'} variant
 * @param {object} [opts] - { icon, disabled, type, className }
 * @returns {HTMLButtonElement}
 */
export function buildButton(text, variant = 'primary', opts = {}) {
  const btn = document.createElement('button');
  btn.type = opts.type || 'button';
  btn.className = `btn-${variant}${opts.className ? ' ' + opts.className : ''}`;
  btn.disabled = !!opts.disabled;
  btn.innerHTML = opts.icon ? `<span>${opts.icon}</span> ${text}` : text;
  return btn;
}

/**
 * Build a status badge.
 * @param {'complete'|'pending'|'locked'} status
 * @param {string} [label]
 * @returns {HTMLSpanElement}
 */
export function buildStatusBadge(status, label) {
  const span = document.createElement('span');
  const icons = { complete: ICONS.check, pending: ICONS.pending, locked: ICONS.lock };
  const labels = { complete: 'Complete', pending: 'Pending', locked: 'Locked' };
  span.className = `status-badge--${status}`;
  span.textContent = `${icons[status] || ''} ${label || labels[status] || status}`;
  return span;
}

/**
 * Build a capacity progress bar.
 * @param {number} current - current count
 * @param {number} total - max capacity
 * @returns {HTMLDivElement}
 */
export function buildCapacityBar(current, total) {
  const pct = total > 0 ? Math.min((current / total) * 100, 100) : 0;
  let color = 'green';
  if (pct >= 100) color = 'full';
  else if (pct >= 80) color = 'red';
  else if (pct >= 60) color = 'amber';

  const bar = document.createElement('div');
  bar.className = 'capacity-bar';
  bar.setAttribute('role', 'progressbar');
  bar.setAttribute('aria-valuenow', String(current));
  bar.setAttribute('aria-valuemax', String(total));
  bar.innerHTML = `<div class="capacity-bar__fill capacity-bar__fill--${color}" style="width:${pct}%"></div>`;
  return bar;
}

/**
 * Build a wizard progress indicator.
 * @param {number} step - current step (1-based)
 * @param {number} total - total steps
 * @param {string[]} names - step labels
 * @returns {HTMLDivElement}
 */
export function buildWizardProgress(step, total, names) {
  const el = document.createElement('div');
  el.className = 'wizard-progress';
  el.setAttribute('aria-label', `Step ${step} of ${total}`);

  for (let i = 1; i <= total; i++) {
    if (i > 1) {
      const connector = document.createElement('div');
      connector.className = `wizard-progress__connector${i <= step ? ' wizard-progress__connector--complete' : ''}`;
      el.appendChild(connector);
    }
    const stepEl = document.createElement('div');
    stepEl.className = 'wizard-progress__step';

    const dot = document.createElement('div');
    if (i < step) dot.className = 'wizard-progress__dot wizard-progress__dot--complete';
    else if (i === step) dot.className = 'wizard-progress__dot wizard-progress__dot--active';
    else dot.className = 'wizard-progress__dot';
    dot.textContent = i < step ? ICONS.check : String(i);
    stepEl.appendChild(dot);

    if (names[i - 1]) {
      const label = document.createElement('span');
      label.className = `wizard-progress__label${i === step ? ' wizard-progress__label--active' : ''}`;
      label.textContent = names[i - 1];
      stepEl.appendChild(label);
    }
    el.appendChild(stepEl);
  }
  return el;
}

/**
 * Show a confirm dialog (replaces window.confirm).
 * Returns a Promise<boolean>.
 * @param {object} opts - { title, message, confirmText, cancelText, variant }
 * @returns {Promise<boolean>}
 */
export function showConfirmDialog(opts = {}) {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'confirm-dialog-backdrop';

    const dialog = document.createElement('div');
    dialog.className = 'confirm-dialog';
    dialog.setAttribute('role', 'alertdialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', opts.title || 'Confirm');

    const variant = opts.variant || 'primary';
    dialog.innerHTML = `
      <div class="confirm-dialog__title">${opts.title || 'Confirm'}</div>
      <div class="confirm-dialog__message">${opts.message || 'Are you sure?'}</div>
      <div class="confirm-dialog__actions">
        <button class="btn-ghost" data-action="cancel">${opts.cancelText || 'Go Back'}</button>
        <button class="btn-${variant}" data-action="confirm">${opts.confirmText || 'Confirm'}</button>
      </div>
    `;

    function cleanup(result) {
      backdrop.remove();
      resolve(result);
    }

    dialog.querySelector('[data-action="confirm"]').addEventListener('click', () => cleanup(true));
    dialog.querySelector('[data-action="cancel"]').addEventListener('click', () => cleanup(false));
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) cleanup(false); });

    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);

    // Focus the confirm button
    dialog.querySelector('[data-action="confirm"]').focus();
  });
}

/**
 * Build a slide-over panel.
 * @param {string} title
 * @returns {{ element: HTMLDivElement, body: HTMLDivElement, show: Function, hide: Function }}
 */
export function buildSlideOver(title) {
  const backdrop = document.createElement('div');
  backdrop.className = 'slide-over__backdrop';

  const panel = document.createElement('div');
  panel.className = 'slide-over';
  panel.innerHTML = `
    <div class="slide-over__header">
      <h2 class="slide-over__title">${title}</h2>
      <button class="slide-over__close" aria-label="Close">${ICONS.close}</button>
    </div>
    <div class="slide-over__body"></div>
  `;

  const body = panel.querySelector('.slide-over__body');

  function show() {
    document.body.appendChild(backdrop);
    document.body.appendChild(panel);
    window.requestAnimationFrame(() => {
      panel.classList.add('slide-over--open');
      backdrop.classList.add('slide-over__backdrop--visible');
    });
  }

  function hide() {
    panel.classList.remove('slide-over--open');
    backdrop.classList.remove('slide-over__backdrop--visible');
    setTimeout(() => {
      panel.remove();
      backdrop.remove();
    }, 300);
  }

  panel.querySelector('.slide-over__close').addEventListener('click', hide);
  backdrop.addEventListener('click', hide);

  return { element: panel, body, show, hide };
}

/**
 * Build an enchanted banner card with gold left border.
 * @param {string} icon - emoji icon
 * @param {string} title
 * @param {string} message
 * @param {string} [href] - optional link
 * @returns {HTMLDivElement}
 */
export function buildEnchantedBanner(icon, title, message, href) {
  const el = document.createElement('div');
  el.className = 'enchanted-banner';
  el.innerHTML = `
    <div class="enchanted-banner__icon">${icon}</div>
    <div class="enchanted-banner__content">
      <div class="enchanted-banner__title">${title}</div>
      <div class="enchanted-banner__message">${message}</div>
      ${href ? `<a class="enchanted-banner__link" href="${href}">Get started ${ICONS.arrow}</a>` : ''}
    </div>
  `;
  return el;
}

/**
 * Build an avatar circle (photo or initials).
 * @param {string} firstName
 * @param {string} lastName
 * @param {string} [photoUrl]
 * @param {boolean} [large]
 * @returns {HTMLDivElement}
 */
export function buildAvatar(firstName, lastName, photoUrl, large = false) {
  const el = document.createElement('div');
  el.className = `avatar${large ? ' avatar--lg' : ''}`;
  if (photoUrl) {
    el.innerHTML = `<img src="${photoUrl}" alt="${firstName} ${lastName}">`;
  } else {
    el.textContent = `${(firstName || '?')[0]}${(lastName || '?')[0]}`.toUpperCase();
  }
  return el;
}

/**
 * Build a stat card for dashboards.
 * @param {string} label
 * @param {string|number} value
 * @param {string} icon
 * @returns {HTMLDivElement}
 */
export function buildStatCard(label, value, icon) {
  const el = document.createElement('div');
  el.className = 'stat-card';
  el.innerHTML = `
    <div class="stat-card__icon">${icon}</div>
    <div class="stat-card__value">${value}</div>
    <div class="stat-card__label">${label}</div>
  `;
  return el;
}

/**
 * Build a searchable select dropdown (typeahead).
 * @param {{ value: string, label: string }[]} options
 * @param {string} placeholder
 * @returns {{ element: HTMLDivElement, getValue: Function, setValue: Function }}
 */
export function buildSearchableSelect(options, placeholder = 'Search...') {
  const wrapper = document.createElement('div');
  wrapper.className = 'searchable-select';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'searchable-select__input';
  input.placeholder = placeholder;

  const hidden = document.createElement('input');
  hidden.type = 'hidden';

  const dropdown = document.createElement('div');
  dropdown.className = 'searchable-select__dropdown';

  wrapper.appendChild(input);
  wrapper.appendChild(hidden);
  wrapper.appendChild(dropdown);

  function renderOptions(filter = '') {
    const lower = filter.toLowerCase();
    const filtered = options.filter((o) => o.label.toLowerCase().includes(lower));
    dropdown.innerHTML = filtered
      .map((o) => `<div class="searchable-select__option" data-value="${o.value}">${o.label}</div>`)
      .join('');
    dropdown.classList.toggle('searchable-select__dropdown--open', filtered.length > 0 && filter.length > 0);
  }

  input.addEventListener('input', () => {
    hidden.value = '';
    renderOptions(input.value);
  });

  input.addEventListener('focus', () => {
    if (input.value) renderOptions(input.value);
  });

  dropdown.addEventListener('click', (e) => {
    const opt = e.target.closest('.searchable-select__option');
    if (!opt) return;
    hidden.value = opt.dataset.value;
    input.value = opt.textContent;
    dropdown.classList.remove('searchable-select__dropdown--open');
  });

  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) {
      dropdown.classList.remove('searchable-select__dropdown--open');
    }
  });

  return {
    element: wrapper,
    getValue: () => hidden.value,
    setValue: (val, label) => { hidden.value = val; input.value = label || ''; },
    getInput: () => input,
    getHidden: () => hidden,
  };
}
