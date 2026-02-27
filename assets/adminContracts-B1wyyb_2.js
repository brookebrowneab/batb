const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./quill-DEeYgmGS.js","./_commonjsHelpers-Cpj98o6Y.js","./quill-CfZ7kyuK.css"])))=>i.map(i=>d[i]);
import{_ as m,g as p}from"./index-CISvQlxv.js";import{b as h,s as y,c as C}from"./contracts-Ccb3_VRS.js";import{l as x}from"./auditLog-zqOHhrDM.js";import{r as w,g as E}from"./sanitizeHtml-D1SfNnaG.js";import"./purify.es-B9ZVCkUG.js";import"./escapeHtml-lW1fV86Q.js";let i=[],n=null;async function v(){const{data:a,error:t}=await h();if(t){console.error("Failed to load contracts:",t.message);return}i=a}function f(){return i.length===0?"<p>No contract versions yet. Create the first one below.</p>":`
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
        ${i.map(a=>`
          <tr>
            <td>v${a.version_number}</td>
            <td>${a.is_active?'<span class="badge active">Active</span>':"Inactive"}</td>
            <td>${new Date(a.created_at).toLocaleDateString()}</td>
            <td>
              ${a.is_active?"":`<button class="btn-small" data-activate="${a.id}">Set Active</button>`}
              <button class="btn-small btn-secondary" data-preview="${a.id}">Preview</button>
            </td>
          </tr>`).join("")}
      </tbody>
    </table>
  `}function g(){document.querySelectorAll("[data-activate]").forEach(t=>{t.addEventListener("click",async()=>{const e=t.getAttribute("data-activate");t.disabled=!0,t.textContent="Activating…";const{error:r}=await y(e);if(r){alert("Failed to activate contract: "+r.message),t.disabled=!1,t.textContent="Set Active";return}await u()})}),document.querySelectorAll("[data-preview]").forEach(t=>{t.addEventListener("click",()=>{const e=t.getAttribute("data-preview"),r=i.find(s=>s.id===e);if(r){const s=document.getElementById("contract-preview");s.innerHTML=`
          <h3>Contract v${r.version_number} Preview</h3>
          <div class="contract-text">${w(r.text_snapshot)}</div>
        `}})});const a=document.getElementById("create-contract-form");a&&a.addEventListener("submit",async t=>{t.preventDefault();const e=document.getElementById("create-contract-message");if(!n){e.textContent="Rich text editor is not available. Please refresh.",e.className="form-message error";return}const r=n.getHtml();if(!n.getPlainText()){e.textContent="Contract text is required.",e.className="form-message error";return}const{user:b}=p(),c=E(i),o=a.querySelector('button[type="submit"]');o.disabled=!0,o.textContent="Creating…",e.textContent="";const{data:l,error:d}=await C(c,r,b.id);if(d){e.textContent="Failed to create contract: "+d.message,e.className="form-message error",o.disabled=!1,o.textContent="Create Contract Version";return}l&&x("create_contract","contracts",l.id,{version_number:c}),n&&n.clear(),e.textContent=`Contract v${c} created successfully.`,e.className="form-message success",o.disabled=!1,o.textContent="Create Contract Version",await u()})}async function u(){await v();const a=document.getElementById("contract-list");a&&(a.innerHTML=f(),g())}async function _(a){try{const[{default:t}]=await Promise.all([m(()=>import("./quill-DEeYgmGS.js"),__vite__mapDeps([0,1]),import.meta.url),m(()=>Promise.resolve({}),__vite__mapDeps([2]),import.meta.url)]),e=new t(a,{theme:"snow",modules:{toolbar:[[{header:[1,2,3,4,!1]}],["bold","italic","underline","strike"],[{list:"ordered"},{list:"bullet"}],["blockquote","link"],["clean"]]},placeholder:"Enter the contract text here…"});n={getHtml:()=>e.root.innerHTML,getPlainText:()=>e.getText().trim(),clear:()=>e.setText("")}}catch(t){console.error("Quill failed to initialize:",t),n=null,a.innerHTML='<p class="form-message error">Rich text editor failed to load. Please refresh.</p>'}}function $(){const a=document.createElement("div");return a.className="page",a.innerHTML=`
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
  `,setTimeout(async()=>{try{const t=document.getElementById("quill-editor");t&&await _(t),await v();const e=document.getElementById("contract-list");e&&(e.innerHTML=f(),g())}catch(t){console.error("Failed to load admin contracts page:",t);const e=document.getElementById("contract-list");e&&(e.innerHTML='<p class="form-message error">Could not load contracts. Please refresh.</p>')}},0),a}export{$ as renderAdminContracts};
