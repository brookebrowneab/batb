import { getAuthState } from '../auth.js';
import {
  fetchAllContracts,
  createContract,
  setActiveContract,
} from '../adapters/contracts.js';
import { logAuditEntry } from '../adapters/auditLog.js';
import { getNextVersionNumber } from '../domain/contracts.js';
import { renderContractText } from '../ui/sanitizeHtml.js';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

let contracts = [];
let quillEditor = null;

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
          <div class="contract-text">${renderContractText(contract.text_snapshot)}</div>
        `;
      }
    });
  });

  // Create form
  const form = document.getElementById('create-contract-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = quillEditor ? quillEditor.root.innerHTML : '';
      const msg = document.getElementById('create-contract-message');

      // Check if editor is effectively empty (Quill uses <p><br></p> for empty)
      const plainText = quillEditor ? quillEditor.getText().trim() : '';
      if (!plainText) {
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

      const { data: contractData, error } = await createContract(nextVersion, text, user.id);

      if (error) {
        msg.textContent = 'Failed to create contract: ' + error.message;
        msg.className = 'form-message error';
        btn.disabled = false;
        btn.textContent = 'Create Contract Version';
        return;
      }

      if (contractData) {
        logAuditEntry('create_contract', 'contracts', contractData.id, { version_number: nextVersion });
      }

      if (quillEditor) quillEditor.setText('');
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
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-md)">
      <h1 style="margin:0">Contract Management 📋</h1>
      <button class="btn-ghost" onclick="location.hash='#/admin'" style="min-height:auto;width:auto">← Dashboard</button>
    </div>

    <div class="card" style="margin-bottom:var(--space-lg)">
      <h2 style="margin-bottom:var(--space-md)">Contract Versions</h2>
      <div id="contract-list"><p>Loading…</p></div>
    </div>

    <div id="contract-preview" class="contract-preview-box card" style="margin-bottom:var(--space-lg)"></div>

    <div class="card">
      <h2 style="margin-bottom:var(--space-md)">Create New Version</h2>
      <form id="create-contract-form" class="login-form" style="max-width:none">
        <label>Contract Text</label>
        <div id="quill-editor"></div>
        <button type="submit" class="btn-accent">Create Contract Version</button>
        <div id="create-contract-message" class="form-message" aria-live="polite"></div>
      </form>
    </div>
  `;

  setTimeout(async () => {
    // Initialize Quill
    const editorEl = document.getElementById('quill-editor');
    if (editorEl) {
      quillEditor = new Quill(editorEl, {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, 4, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['blockquote', 'link'],
            ['clean'],
          ],
        },
        placeholder: 'Enter the contract text here…',
      });
    }

    await loadContracts();
    const listEl = document.getElementById('contract-list');
    if (listEl) {
      listEl.innerHTML = renderContractList();
      bindEvents();
    }
  }, 0);

  return container;
}
