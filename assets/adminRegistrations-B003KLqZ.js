import{e as o}from"./escapeHtml-lW1fV86Q.js";import{a as v,d as b}from"./students-B2nRX23A.js";import{b as y}from"./rolePreferences-Bjabgkc_.js";import{s as $}from"./rolePreferences-B9XCX_X4.js";import"./index-DpHEjNAw.js";import"./scheduling-DSZ8OVmG.js";let a=[],u=[],m="",s="";function T(){const e=document.createElement("div");return e.className="page",e.innerHTML=`
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-md)">
      <h1 style="margin:0">Student Registrations</h1>
      <button class="btn-ghost" onclick="location.hash='#/admin'" style="min-height:auto;width:auto">← Admin Dashboard</button>
    </div>
    <div class="form-message" id="registrations-msg" aria-live="polite"></div>
    <div id="registrations-content"><p>Loading…</p></div>
  `,setTimeout(()=>_(),0),e}async function _(){const[e,r]=await Promise.all([v(),y()]);if(e.error){E(e.error.message||"Failed to load students.");return}a=e.data||[],u=r.data||[],c()}function E(e){const r=document.getElementById("registrations-content");r&&(r.innerHTML=`<div class="placeholder-notice">${o(e)}</div>`)}function g(e){var n;return((n=$(e.role_preferences||[])[0])==null?void 0:n.audition_role_id)||""}function R(e){var r;return e&&((r=u.find(n=>n.id===e))==null?void 0:r.name)||""}function w(){return a.filter(e=>m&&String(e.grade||"")!==m?!1:s?s==="__none__"?!g(e):g(e)===s:!0)}function x(){const r=[...new Set(a.map(t=>String(t.grade||"").trim()).filter(Boolean))].sort((t,i)=>t.localeCompare(i,void 0,{numeric:!0})).map(t=>`<option value="${o(t)}" ${m===t?"selected":""}>${o(t)}</option>`).join(""),n=u.map(t=>`<option value="${t.id}" ${s===t.id?"selected":""}>${o(t.name)}</option>`).join("");return`
    <div style="display:flex;flex-wrap:wrap;gap:var(--space-sm);align-items:flex-end;margin-bottom:var(--space-md)">
      <div>
        <label for="registration-filter-grade" style="font-size:var(--text-small);font-weight:600">Grade</label>
        <select id="registration-filter-grade" style="min-width:140px">
          <option value="">All Grades</option>
          ${r}
        </select>
      </div>
      <div>
        <label for="registration-filter-role" style="font-size:var(--text-small);font-weight:600">Role (#1 Preference)</label>
        <select id="registration-filter-role" style="min-width:220px">
          <option value="">All Roles</option>
          ${n}
          <option value="__none__" ${s==="__none__"?"selected":""}>No Preference</option>
        </select>
      </div>
      <button id="registration-clear-filters" class="btn-small btn-secondary">Clear Filters</button>
    </div>
  `}function S(e){return e.length===0?'<div class="placeholder-notice">No students match the selected filters.</div>':`
    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Grade</th>
            <th>#1 Role</th>
            <th>Registration</th>
            <th>Callback</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>${e.map(n=>{const t=`${n.first_name||""} ${n.last_name||""}`.trim(),i=R(g(n));return`
      <tr>
        <td>
          <a href="#/staff/student-profile?id=${n.id}" data-registration-student-link="${n.id}">
            ${o(t||"Unnamed Student")}
          </a>
        </td>
        <td>${o(n.grade||"—")}</td>
        <td>${i?o(i):'<span style="color:var(--color-text-muted)">—</span>'}</td>
        <td>${n.registration_complete?'<span class="status-badge--complete">Complete</span>':'<span class="status-badge--pending">Incomplete</span>'}</td>
        <td>${n.callback_invited?"⭐":"—"}</td>
        <td><button class="btn-small btn-secondary delete-registration-btn" data-student-id="${n.id}">Delete</button></td>
      </tr>
    `}).join("")}</tbody>
      </table>
    </div>
  `}function A(){const e=document.getElementById("registration-filter-grade");e&&e.addEventListener("change",()=>{m=e.value,c()});const r=document.getElementById("registration-filter-role");r&&r.addEventListener("change",()=>{s=r.value,c()});const n=document.getElementById("registration-clear-filters");n&&n.addEventListener("click",()=>{m="",s="",c()}),document.querySelectorAll(".delete-registration-btn").forEach(t=>{t.addEventListener("click",async()=>{const i=t.getAttribute("data-student-id"),l=a.find(f=>f.id===i),p=`${(l==null?void 0:l.first_name)||""} ${(l==null?void 0:l.last_name)||""}`.trim()||"this student";if(!i||!window.confirm(`Delete registration for ${p}? This permanently removes the student and related records.`))return;t.disabled=!0,t.textContent="Deleting…";const d=document.getElementById("registrations-msg"),{error:h}=await b(i);if(h){t.disabled=!1,t.textContent="Delete",d&&(d.className="form-message error",d.textContent=h.message||"Failed to delete registration.");return}a=a.filter(f=>f.id!==i),d&&(d.className="form-message success",d.textContent=`Deleted registration for ${p}.`),c()})})}function c(){const e=document.getElementById("registrations-content");if(!e)return;const r=w();e.innerHTML=`
    ${x()}
    <p style="font-size:var(--text-small);color:var(--color-text-secondary);margin-bottom:var(--space-md)">
      Showing <strong>${r.length}</strong> of <strong>${a.length}</strong> students.
    </p>
    ${S(r)}
  `,A()}export{T as renderAdminRegistrations};
