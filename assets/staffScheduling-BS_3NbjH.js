import{g as y,a as E}from"./index-DpHEjNAw.js";import{f as h,d as $,u as k,c as C}from"./scheduling-CaKXSNop.js";import{l as v}from"./auditLog-DjGyexmA.js";import{L as I,f as B,a as l,v as A}from"./scheduling-DSZ8OVmG.js";let m=[];async function D(){const{data:e,error:t}=await h();if(t){console.error("Failed to load configs:",t.message);return}m=e}function L(){const{role:e}=y();return m.length===0?"<p>No audition dates configured yet.</p>":`
    <div class="table-responsive">
    <table class="data-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Dance</th>
          <th>Vocal</th>
          <th>Callback</th>
          <th>Last Updated By</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${m.map(t=>`
          <tr>
            <td>${B(t.audition_date)}</td>
            <td>${l(t.dance_start_time)} – ${l(t.dance_end_time)}</td>
            <td>${l(t.vocal_start_time)} – ${l(t.vocal_end_time)}</td>
            <td>${l(t.callback_start_time)} – ${l(t.callback_end_time)}</td>
            <td>${new Date(t.updated_at).toLocaleString()}</td>
            <td>
              <button class="btn-small" data-edit="${t.id}">Edit</button>
              ${E(e)?`<button class="btn-small btn-secondary" data-delete="${t.id}">Delete</button>`:""}
            </td>
          </tr>`).join("")}
      </tbody>
    </table>
    </div>
    <p class="lock-time-notice">Lock time: ${I} (server-enforced, admin override only)</p>
  `}function g(e){const t=e||{},a=!!e;return`
    <form id="config-form" class="login-form">
      <h3>${a?"Edit":"Add"} Audition Date</h3>
      ${a?`<input type="hidden" id="config-id" value="${t.id}" />`:""}
      <label for="cfg-date">Audition Date *</label>
      <input type="date" id="cfg-date" required value="${t.audition_date||""}" ${a?"readonly":""} />

      <label for="cfg-dance-start">Dance Start Time</label>
      <input type="time" id="cfg-dance-start" value="${t.dance_start_time||""}" />
      <label for="cfg-dance-end">Dance End Time</label>
      <input type="time" id="cfg-dance-end" value="${t.dance_end_time||""}" />

      <label for="cfg-vocal-start">Vocal Start Time</label>
      <input type="time" id="cfg-vocal-start" value="${t.vocal_start_time||""}" />
      <label for="cfg-vocal-end">Vocal End Time</label>
      <input type="time" id="cfg-vocal-end" value="${t.vocal_end_time||""}" />

      <label for="cfg-callback-start">Callback Start Time</label>
      <input type="time" id="cfg-callback-start" value="${t.callback_start_time||""}" />
      <label for="cfg-callback-end">Callback End Time</label>
      <input type="time" id="cfg-callback-end" value="${t.callback_end_time||""}" />

      <button type="submit">${a?"Update":"Add"} Date</button>
      ${a?'<button type="button" id="cancel-edit" class="btn-small btn-secondary" style="margin-top:0.25rem">Cancel</button>':""}
      <div id="config-form-msg" class="form-message" aria-live="polite"></div>
    </form>
  `}function T(e){document.querySelectorAll("[data-edit]").forEach(t=>{t.addEventListener("click",()=>{const a=t.getAttribute("data-edit"),n=m.find(i=>i.id===a);if(n){const i=document.getElementById("config-form-container");i&&(i.innerHTML=g(n),u(e))}})}),document.querySelectorAll("[data-delete]").forEach(t=>{t.addEventListener("click",async()=>{const a=t.getAttribute("data-delete");if(!window.confirm("Delete this audition date config?"))return;t.disabled=!0;const{error:n}=await $(a);if(n){alert("Failed to delete: "+n.message),t.disabled=!1;return}e()})}),u(e)}function u(e){const t=document.getElementById("config-form");if(!t)return;const a=document.getElementById("cancel-edit");a&&a.addEventListener("click",()=>{const n=document.getElementById("config-form-container");n&&(n.innerHTML=g(null),u(e))}),t.addEventListener("submit",async n=>{n.preventDefault();const{user:i}=y(),d=document.getElementById("config-form-msg"),r=t.querySelector('button[type="submit"]'),f=document.getElementById("config-id"),s=!!f,c={audition_date:document.getElementById("cfg-date").value,dance_start_time:document.getElementById("cfg-dance-start").value||null,dance_end_time:document.getElementById("cfg-dance-end").value||null,vocal_start_time:document.getElementById("cfg-vocal-start").value||null,vocal_end_time:document.getElementById("cfg-vocal-end").value||null,callback_start_time:document.getElementById("cfg-callback-start").value||null,callback_end_time:document.getElementById("cfg-callback-end").value||null},{valid:_,errors:p}=A(c);if(!_){d.textContent=p.join(" "),d.className="form-message error";return}r.disabled=!0,r.textContent="Saving…",d.textContent="";let o;if(s){const b={...c};delete b.audition_date,o=await k(f.value,b,i.id)}else o=await C(c,i.id);if(o.error){d.textContent="Error: "+o.error.message,d.className="form-message error",r.disabled=!1,r.textContent=s?"Update Date":"Add Date";return}s?v("update_config","audition_window_config",f.value,c):o.data&&v("create_config","audition_window_config",o.data.id,c),d.textContent=s?"Updated!":"Added!",d.className="form-message success",setTimeout(()=>e(),300)})}function H(){const e=document.createElement("div");e.className="page",e.innerHTML=`
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-md)">
      <h1 style="margin:0">Scheduling Configuration 📅</h1>
      <button class="btn-ghost" onclick="location.hash='#/staff'" style="min-height:auto;width:auto">← Dashboard</button>
    </div>
    <div class="card" style="margin-bottom:var(--space-lg)">
      <div id="config-table"><p>Loading…</p></div>
    </div>
    <div class="card" id="config-form-container"></div>
  `;async function t(){await D();const a=document.getElementById("config-table"),n=document.getElementById("config-form-container");a&&(a.innerHTML=L()),n&&(n.innerHTML=g(null)),T(t)}return setTimeout(t,0),e}export{H as renderStaffScheduling};
