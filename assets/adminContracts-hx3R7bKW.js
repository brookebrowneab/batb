import{g as f}from"./index-Bv59R015.js";import{b,s as h,c as p}from"./contracts-B0gzOmPx.js";import{l as y}from"./auditLog-BX5BZujT.js";import{r as C,g as x}from"./sanitizeHtml-D1SfNnaG.js";import"./purify.es-B9ZVCkUG.js";import"./escapeHtml-lW1fV86Q.js";let c=[];async function m(){const{data:t,error:e}=await b();if(e){console.error("Failed to load contracts:",e.message);return}c=t}function u(){return c.length===0?"<p>No contract versions yet. Create the first one below.</p>":`
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
        ${c.map(t=>`
          <tr>
            <td>v${t.version_number}</td>
            <td>${t.is_active?'<span class="badge active">Active</span>':"Inactive"}</td>
            <td>${new Date(t.created_at).toLocaleDateString()}</td>
            <td>
              ${t.is_active?"":`<button class="btn-small" data-activate="${t.id}">Set Active</button>`}
              <button class="btn-small btn-secondary" data-preview="${t.id}">Preview</button>
            </td>
          </tr>`).join("")}
      </tbody>
    </table>
  `}function v(){document.querySelectorAll("[data-activate]").forEach(e=>{e.addEventListener("click",async()=>{const a=e.getAttribute("data-activate");e.disabled=!0,e.textContent="Activating…";const{error:r}=await h(a);if(r){alert("Failed to activate contract: "+r.message),e.disabled=!1,e.textContent="Set Active";return}await l()})}),document.querySelectorAll("[data-preview]").forEach(e=>{e.addEventListener("click",()=>{const a=e.getAttribute("data-preview"),r=c.find(n=>n.id===a);if(r){const n=document.getElementById("contract-preview");n.innerHTML=`
          <h3>Contract v${r.version_number} Preview</h3>
          <div class="contract-text">${C(r.text_snapshot)}</div>
        `}})});const t=document.getElementById("create-contract-form");t&&t.addEventListener("submit",async e=>{e.preventDefault();const a=document.getElementById("create-contract-message"),r=document.getElementById("contract-textarea"),n=(r==null?void 0:r.value)||"";if(!n.trim()){a.textContent="Contract text is required.",a.className="form-message error";return}const{user:g}=f(),s=x(c),o=t.querySelector('button[type="submit"]');o.disabled=!0,o.textContent="Creating…",a.textContent="";const{data:i,error:d}=await p(s,n,g.id);if(d){a.textContent="Failed to create contract: "+d.message,a.className="form-message error",o.disabled=!1,o.textContent="Create Contract Version";return}i&&y("create_contract","contracts",i.id,{version_number:s}),r&&(r.value=""),a.textContent=`Contract v${s} created successfully.`,a.className="form-message success",o.disabled=!1,o.textContent="Create Contract Version",await l()})}async function l(){await m();const t=document.getElementById("contract-list");t&&(t.innerHTML=u(),v())}function N(){const t=document.createElement("div");return t.className="page",t.innerHTML=`
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
        <textarea
          id="contract-textarea"
          rows="12"
          placeholder="Enter the contract text here…"
          style="width:100%;min-height:16rem;resize:vertical"
        ></textarea>
        <button type="submit" class="btn-accent">Create Contract Version</button>
        <div id="create-contract-message" class="form-message" aria-live="polite"></div>
      </form>
    </div>
  `,setTimeout(async()=>{try{await m();const e=document.getElementById("contract-list");e&&(e.innerHTML=u(),v())}catch(e){console.error("Failed to load admin contracts page:",e);const a=document.getElementById("contract-list");a&&(a.innerHTML='<p class="form-message error">Could not load contracts. Please refresh.</p>')}},0),t}export{N as renderAdminContracts};
