import { getAuthState } from '../auth.js';
import {
  fetchAllContracts,
  createContract,
  setActiveContract,
} from '../adapters/contracts.js';
import { getNextVersionNumber } from '../domain/contracts.js';
import { escapeHtml } from '../ui/escapeHtml.js';

let contracts = [];

async function loadContracts() {
  const { data, error } = await fetchAllContracts();
  if (error) {
    console.error('Failed to load contracts:', error.message);
    return;
  }
  contracts = data;
}

function renderContractList() {
  if (contracts.length === 0) {
    return '<p>No contract versions yet. Create the first one below.</p>';
  }
  return `
    <table class="data-table">
      <thead>
        <tr>
          <th>Version</th>
          <th>Status</th>
          <th>Created</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${contracts
          .map(
            (c) => `
          <tr>
            <td>v${c.version_number}</td>
            <td>${c.is_active ? '<span class="badge active">Active</span>' : 'Inactive'}</td>
            <td>${new Date(c.created_at).toLocaleDateString()}</td>
            <td>
              ${c.is_active ? '' : `<button class="btn-small" data-activate="${c.id}">Set Active</button>`}
              <button class="btn-small btn-secondary" data-preview="${c.id}">Preview</button>
            </td>
          </tr>`,
          )
          .join('')}
      </tbody>
    </table>
  `;
}

function bindEvents() {
  // Activate buttons
  document.querySelectorAll('[data-activate]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const contractId = btn.getAttribute('data-activate');
      btn.disabled = true;
      btn.textContent = 'Activating…';
      const { error } = await setActiveContract(contractId);
      if (error) {
        alert('Failed to activate contract: ' + error.message);
        btn.disabled = false;
        btn.textContent = 'Set Active';
        return;
      }
      await refreshPage();
    });
  });

  // Preview buttons
  document.querySelectorAll('[data-preview]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const contractId = btn.getAttribute('data-preview');
      const contract = contracts.find((c) => c.id === contractId);
      if (contract) {
        const preview = document.getElementById('contract-preview');
        preview.innerHTML = `
          <h3>Contract v${contract.version_number} Preview</h3>
          <div class="contract-text">${escapeHtml(contract.text_snapshot)}</div>
        `;
      }
    });
  });

  // Create form
  const form = document.getElementById('create-contract-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const textarea = document.getElementById('contract-text-input');
      const text = textarea.value.trim();
      const msg = document.getElementById('create-contract-message');

      if (!text) {
        msg.textContent = 'Contract text is required.';
        msg.className = 'form-message error';
        return;
      }

      const { user } = getAuthState();
      const nextVersion = getNextVersionNumber(contracts);

      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Creating…';
      msg.textContent = '';

      const { error } = await createContract(nextVersion, text, user.id);

      if (error) {
        msg.textContent = 'Failed to create contract: ' + error.message;
        msg.className = 'form-message error';
        btn.disabled = false;
        btn.textContent = 'Create Contract Version';
        return;
      }

      textarea.value = '';
      msg.textContent = `Contract v${nextVersion} created successfully.`;
      msg.className = 'form-message success';
      btn.disabled = false;
      btn.textContent = 'Create Contract Version';
      await refreshPage();
    });
  }
}

async function refreshPage() {
  await loadContracts();
  const listEl = document.getElementById('contract-list');
  if (listEl) {
    listEl.innerHTML = renderContractList();
    bindEvents();
  }
}


export function renderAdminContracts() {
  const container = document.createElement('div');
  container.className = 'page';
  container.innerHTML = `
    <h1>Contract Management</h1>
    <p><a href="#/admin">&larr; Back to Admin Dashboard</a></p>

    <h2>Contract Versions</h2>
    <div id="contract-list"><p>Loading…</p></div>

    <div id="contract-preview" class="contract-preview-box"></div>

    <h2>Create New Version</h2>
    <form id="create-contract-form" class="login-form">
      <label for="contract-text-input">Contract Text</label>
      <textarea id="contract-text-input" rows="10" required
        placeholder="Enter the full contract text here…"></textarea>
      <button type="submit">Create Contract Version</button>
      <div id="create-contract-message" class="form-message" aria-live="polite"></div>
    </form>
  `;

  setTimeout(async () => {
    await loadContracts();
    const listEl = document.getElementById('contract-list');
    if (listEl) {
      listEl.innerHTML = renderContractList();
      bindEvents();
    }
  }, 0);

  return container;
}
