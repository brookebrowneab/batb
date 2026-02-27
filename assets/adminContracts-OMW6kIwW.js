const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./quill-DEeYgmGS.js","./_commonjsHelpers-Cpj98o6Y.js","./quill-CfZ7kyuK.css"])))=>i.map(i=>d[i]);
import{_ as m,g as b}from"./index-DAsUYhLQ.js";import{b as p,s as y,c as x}from"./contracts-B_TZzxq_.js";import{l as C}from"./auditLog-D7Pcihaz.js";import{r as w,g as E}from"./sanitizeHtml-D1SfNnaG.js";import"./purify.es-B9ZVCkUG.js";import"./escapeHtml-lW1fV86Q.js";let i=[],n=null;async function v(){const{data:t,error:e}=await p();if(e){console.error("Failed to load contracts:",e.message);return}i=t}function g(){return i.length===0?"<p>No contract versions yet. Create the first one below.</p>":`
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
        ${i.map(t=>`
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
  `}function f(){document.querySelectorAll("[data-activate]").forEach(e=>{e.addEventListener("click",async()=>{const a=e.getAttribute("data-activate");e.disabled=!0,e.textContent="Activating…";const{error:r}=await y(a);if(r){alert("Failed to activate contract: "+r.message),e.disabled=!1,e.textContent="Set Active";return}await u()})}),document.querySelectorAll("[data-preview]").forEach(e=>{e.addEventListener("click",()=>{const a=e.getAttribute("data-preview"),r=i.find(c=>c.id===a);if(r){const c=document.getElementById("contract-preview");c.innerHTML=`
          <h3>Contract v${r.version_number} Preview</h3>
          <div class="contract-text">${w(r.text_snapshot)}</div>
        `}})});const t=document.getElementById("create-contract-form");t&&t.addEventListener("submit",async e=>{e.preventDefault();const a=n?n.getHtml():"",r=document.getElementById("create-contract-message");if(!(n?n.getPlainText():"")){r.textContent="Contract text is required.",r.className="form-message error";return}const{user:h}=b(),s=E(i),o=t.querySelector('button[type="submit"]');o.disabled=!0,o.textContent="Creating…",r.textContent="";const{data:l,error:d}=await x(s,a,h.id);if(d){r.textContent="Failed to create contract: "+d.message,r.className="form-message error",o.disabled=!1,o.textContent="Create Contract Version";return}l&&C("create_contract","contracts",l.id,{version_number:s}),n&&n.clear(),r.textContent=`Contract v${s} created successfully.`,r.className="form-message success",o.disabled=!1,o.textContent="Create Contract Version",await u()})}async function u(){await v();const t=document.getElementById("contract-list");t&&(t.innerHTML=g(),f())}async function _(t){try{const[{default:e}]=await Promise.all([m(()=>import("./quill-DEeYgmGS.js"),__vite__mapDeps([0,1]),import.meta.url),m(()=>Promise.resolve({}),__vite__mapDeps([2]),import.meta.url)]),a=new e(t,{theme:"snow",modules:{toolbar:[[{header:[1,2,3,4,!1]}],["bold","italic","underline","strike"],[{list:"ordered"},{list:"bullet"}],["blockquote","link"],["clean"]]},placeholder:"Enter the contract text here…"});n={getHtml:()=>a.root.innerHTML,getPlainText:()=>a.getText().trim(),clear:()=>a.setText("")}}catch(e){console.error("Quill failed to initialize, falling back to textarea:",e),t.innerHTML=`
      <textarea
        id="contract-textarea"
        rows="12"
        placeholder="Enter the contract text here…"
        style="width:100%;min-height:16rem;resize:vertical"
      ></textarea>
    `;const a=t.querySelector("#contract-textarea");n={getHtml:()=>a.value,getPlainText:()=>a.value.trim(),clear:()=>{a.value=""}}}}function V(){const t=document.createElement("div");return t.className="page",t.innerHTML=`
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
  `,setTimeout(async()=>{try{const e=document.getElementById("quill-editor");e&&await _(e),await v();const a=document.getElementById("contract-list");a&&(a.innerHTML=g(),f())}catch(e){console.error("Failed to load admin contracts page:",e);const a=document.getElementById("contract-list");a&&(a.innerHTML='<p class="form-message error">Could not load contracts. Please refresh.</p>')}},0),t}export{V as renderAdminContracts};
