import{g as I,a as V}from"./index-BPlG99mH.js";import{f as b,a as h}from"./scheduling-DSZ8OVmG.js";import{e as x}from"./escapeHtml-lW1fV86Q.js";import{a as F,h as G,b as H,j as O,V as L,k as N,l as P}from"./vocalBookings-C7LsKPFp.js";import{f as j}from"./scheduling-DoqIqOKx.js";import{c as z,b as q,d as U}from"./rateLimiting-DKJxXDBD.js";import{f as Y,d as J,e as K}from"./rolePreferences-CehJ0G8R.js";import{i as k}from"./rolePreferences-B9XCX_X4.js";import"./evaluations-CY4VeNKz.js";import"./callbacks-B0RK_Msz.js";import"./students-B3ZGlsBg.js";import"./storage-BUcvpCC1.js";const Q=z(q),W=z(U);let v=[],M=[],B={},g="",$=null,S=[],A=[],m=new Set;function ft(){const l=document.createElement("div");return l.className="page",l.innerHTML=`
    <h1>Vocal Roster 🎤</h1>
    <div id="vocal-roster-mode-banner"></div>
    <div id="vocal-roster-actions" style="margin-bottom:var(--space-md)"></div>
    <div class="form-message" id="vocal-roster-msg" aria-live="polite"></div>
    <div id="vocal-roster-content"><p>Loading…</p></div>
  `,setTimeout(()=>E(),0),l}async function E(){const[l,c,n,d,i,t]=await Promise.all([F(),G(),H(),Y(),j(),J()]);v=l.data||[],M=c.data||[],B=n.data||{},$=d.data||null,S=[...new Set((i.data||[]).map(o=>o.audition_date))].sort(),A=t.data||[],m=new Set([...m].filter(o=>v.some(s=>s.id===o)));const e=document.getElementById("vocal-roster-mode-banner");e&&k($)?e.innerHTML=`
      <div class="warning-box" style="padding:var(--space-md);border-radius:var(--radius-sm);margin-bottom:var(--space-md)">
        <strong>Day Assignment Mode Active</strong>
        <p style="font-size:var(--text-small);margin:var(--space-xs) 0 0">
          Vocal auditions are using day assignment mode. Families cannot self-book timeslots.
          <a href="#/staff/vocal-assignments">Manage day assignments →</a>
        </p>
      </div>
    `:e&&(e.innerHTML=""),X(),w()}function X(){var d,i,t;const l=document.getElementById("vocal-roster-actions");if(!l)return;const{role:c}=I();if(k($)){l.innerHTML=`
    <div style="display:flex;flex-wrap:wrap;gap:var(--space-sm);align-items:center">
      <a href="#/staff/vocal-assignments" class="btn-primary" style="display:inline-flex;align-items:center;justify-content:center;text-decoration:none">Manage Vocal Day Assignments</a>
      <span style="font-size:var(--text-xs);color:var(--color-text-muted)">Day mode roster groups students by assigned audition date.</span>
    </div>
  `;return}l.innerHTML=`
    <div style="display:flex;flex-wrap:wrap;gap:var(--space-sm);align-items:center">
      <button class="btn-primary" id="generate-slots-btn">Generate Slots</button>
      <button class="btn-small" id="export-vocal-pdf-btn">📄 PDF</button>
      <button class="btn-small btn-secondary" id="export-vocal-csv-btn">📊 CSV</button>
      ${V(c)?'<span style="font-size:var(--text-xs);color:var(--color-text-muted)">(Admin: delete slots and override bookings below)</span>':""}
    </div>
  `,(d=document.getElementById("generate-slots-btn"))==null||d.addEventListener("click",async e=>{const o=e.target,s=document.getElementById("vocal-roster-msg");o.disabled=!0,o.textContent="Generating…",s&&(s.className="form-message",s.textContent="");const{user:a}=I(),{data:r,error:f}=await O(a.id);if(f){o.disabled=!1,o.textContent="Generate Slots",s&&(s.className="form-message error",s.textContent=f.message||"Failed to generate slots.");return}const p=(r==null?void 0:r.length)||0;s&&(s.className="form-message success",s.textContent=p>0?`Generated ${p} slot(s).`:"No new slots to generate (all time blocks already exist)."),o.disabled=!1,o.textContent="Generate Slots",await E()}),(i=document.getElementById("export-vocal-pdf-btn"))==null||i.addEventListener("click",async e=>{const o=e.target,s=document.getElementById("vocal-roster-msg");o.disabled=!0,o.textContent="Generating…",s&&(s.className="form-message",s.textContent="");try{await Q(),s&&(s.className="form-message success",s.textContent="PDF downloaded.")}catch(a){s&&(s.className="form-message error",s.textContent=a.message||"Export failed.")}o.disabled=!1,o.textContent="📄 PDF"}),(t=document.getElementById("export-vocal-csv-btn"))==null||t.addEventListener("click",async e=>{const o=e.target,s=document.getElementById("vocal-roster-msg");o.disabled=!0,o.textContent="Exporting…";try{await W(),s&&(s.className="form-message success",s.textContent="CSV downloaded.")}catch(a){s&&(s.className="form-message error",s.textContent=a.message||"Export failed.")}o.disabled=!1,o.textContent="📊 CSV"})}function w(){const l=document.getElementById("vocal-roster-content");if(!l)return;const{role:c}=I(),n=V(c),d=k($);if(d){l.innerHTML=Z(n),_(l);return}if(v.length===0){let a='<div class="placeholder-notice">No vocal slots exist yet. Click "Generate Slots" to create them.</div>';n&&(a+=D(d)),l.innerHTML=a,_(l);return}const i=[...new Set(v.map(a=>a.audition_date))].sort();let t='<div style="margin-bottom:var(--space-md)"><label for="vocal-date-filter" style="margin-right:var(--space-sm);font-weight:600;font-size:var(--text-small)">Filter by date:</label>';t+='<select id="vocal-date-filter" style="padding:0.5rem 0.75rem;border:1px solid var(--color-border);border-radius:var(--radius-sm);font-family:var(--font-body);font-size:var(--text-small)">',t+='<option value="">All dates</option>',i.forEach(a=>{t+=`<option value="${a}" ${g===a?"selected":""}>${b(a)}</option>`}),t+="</select></div>";const e=g?v.filter(a=>a.audition_date===g):v,o=e.length>0&&e.every(a=>m.has(a.id)),s={};e.forEach(a=>{s[a.audition_date]||(s[a.audition_date]=[]),s[a.audition_date].push(a)}),t+=`
    <div class="table-responsive">
    <table class="data-table">
      <thead>
        <tr>
          ${n?`<th class="checkbox-cell"><input type="checkbox" id="select-all-slots-cb" ${o?"checked":""} /></th>`:""}
          <th>Date</th>
          <th>Time</th>
          <th>Booked</th>
          ${n?"<th>Actions</th>":""}
        </tr>
      </thead>
      <tbody>
  `,e.forEach(a=>{const r=B[a.id]||0;t+=`
      <tr>
        ${n?`<td class="checkbox-cell"><input type="checkbox" class="slot-select-cb" data-id="${a.id}" ${m.has(a.id)?"checked":""} /></td>`:""}
        <td>${b(a.audition_date)}</td>
        <td>${h(a.start_time)} – ${h(a.end_time)}</td>
        <td>${r} / ${L}</td>
        ${n?`<td><button class="btn-small btn-secondary delete-slot-btn" data-id="${a.id}">Delete</button></td>`:""}
      </tr>
    `}),t+="</tbody></table></div>",n&&m.size>0&&(t+=`
      <div class="bulk-action-bar" style="margin-top:var(--space-sm)">
        <span class="bulk-action-bar__count">${m.size} slot(s) selected</span>
        <div class="bulk-action-bar__actions">
          <button class="btn-small btn-secondary" id="bulk-delete-slots-btn">Delete Selected Slots</button>
        </div>
      </div>
    `),t+='<h2 style="margin-top:var(--space-xl)">Attendees by Slot</h2>';for(const[a,r]of Object.entries(s))t+=`<h3 style="margin-top:var(--space-md)">${b(a)}</h3>`,r.forEach(f=>{const p=M.filter(y=>y.audition_slot_id===f.id),C=B[f.id]||0;t+=`<h4 style="margin-top:var(--space-sm);font-size:var(--text-small)">${h(f.start_time)} – ${h(f.end_time)} (${C}/${L})</h4>`,p.length===0?t+='<p style="font-size:var(--text-small);color:var(--color-text-muted);margin-bottom:var(--space-sm)">No bookings yet.</p>':(t+='<table class="data-table"><thead><tr><th>#</th><th>Student</th><th>Grade</th></tr></thead><tbody>',p.forEach((y,T)=>{const u=y.students,R=`#/staff/student-profile?id=${(u==null?void 0:u.id)||""}`;t+=`<tr><td>${T+1}</td><td><a href="${R}">${x((u==null?void 0:u.first_name)||"")} ${x((u==null?void 0:u.last_name)||"")}</a></td><td>${x((u==null?void 0:u.grade)||"—")}</td></tr>`}),t+="</tbody></table>")});n&&(t+=D(d)),l.innerHTML=t,_(l)}function Z(l){const c=S.length>0?S:[...new Set(A.map(e=>e.audition_date))].sort();if(c.length===0){let e='<div class="placeholder-notice">No audition dates configured yet. Use Scheduling to add dates.</div>';return l&&(e+=D(!0)),e}let n='<div style="margin-bottom:var(--space-md)"><label for="vocal-date-filter" style="margin-right:var(--space-sm);font-weight:600;font-size:var(--text-small)">Filter by date:</label>';n+='<select id="vocal-date-filter" style="padding:0.5rem 0.75rem;border:1px solid var(--color-border);border-radius:var(--radius-sm);font-family:var(--font-body);font-size:var(--text-small)">',n+='<option value="">All dates</option>',c.forEach(e=>{n+=`<option value="${e}" ${g===e?"selected":""}>${b(e)}</option>`}),n+="</select></div>";const d=g?c.filter(e=>e===g):c,i=new Map;d.forEach(e=>i.set(e,[])),A.forEach(e=>{i.has(e.audition_date)&&i.get(e.audition_date).push(e)}),n+='<h2 style="margin-top:var(--space-sm)">Students by Vocal Day</h2>',d.forEach(e=>{const o=i.get(e)||[];if(n+=`
      <h3 style="margin-top:var(--space-md)">${b(e)} (${o.length})</h3>
    `,o.length===0){n+='<p style="font-size:var(--text-small);color:var(--color-text-muted);margin-bottom:var(--space-sm)">No students assigned to this day.</p>';return}n+='<table class="data-table"><thead><tr><th>#</th><th>Student</th><th>Grade</th></tr></thead><tbody>',o.forEach((s,a)=>{const r=s.students,f=`#/staff/student-profile?id=${(r==null?void 0:r.id)||""}`;n+=`<tr><td>${a+1}</td><td><a href="${f}">${x((r==null?void 0:r.first_name)||"")} ${x((r==null?void 0:r.last_name)||"")}</a></td><td>${x((r==null?void 0:r.grade)||"—")}</td></tr>`}),n+="</tbody></table>"});const t=A.filter(e=>!e.audition_date).length;return t>0&&(n+=`<p style="margin-top:var(--space-sm);font-size:var(--text-small);color:var(--color-text-muted)">${t} assignment(s) missing a date.</p>`),l&&(n+=D(!0)),n}function D(l){const c=v.map(t=>`<option value="${t.id}">${b(t.audition_date)} — ${h(t.start_time)}–${h(t.end_time)}</option>`).join(""),n=[...new Set(v.map(t=>t.audition_date))].sort(),i=(S.length>0?S:n).map(t=>`<option value="${t}">${b(t)}</option>`).join("");return`
    <hr>
    <h2>Admin Override</h2>
    <p style="font-size:var(--text-small);color:var(--color-text-secondary);margin-bottom:var(--space-md)">${l?"Assign or change a student's vocal audition day.":"Assign or change a student's vocal slot (bypasses lock time and capacity)."}</p>
    <div class="login-form" style="max-width:500px">
      <label for="vocal-override-student-id">Student ID</label>
      <input type="text" id="vocal-override-student-id" placeholder="Paste student UUID" />
      ${l?`<label for="vocal-override-day">Vocal Day</label>
      <select id="vocal-override-day" style="padding:0.5rem 0.75rem;border:1px solid var(--color-border);border-radius:var(--radius-sm);font-family:var(--font-body)">
        <option value="">Select a day…</option>
        ${i}
      </select>`:`<label for="vocal-override-slot">Vocal Slot</label>
      <select id="vocal-override-slot" style="padding:0.5rem 0.75rem;border:1px solid var(--color-border);border-radius:var(--radius-sm);font-family:var(--font-body)">
        <option value="">Select a slot…</option>
        ${c}
      </select>`}
      <button id="vocal-override-btn" class="btn-primary">${l?"Assign Day":"Assign Slot"}</button>
      <div class="form-message" id="vocal-override-msg" aria-live="polite"></div>
    </div>
  `}function _(l){const c=document.getElementById("vocal-date-filter");c&&c.addEventListener("change",()=>{g=c.value,w()});const n=document.getElementById("select-all-slots-cb");n&&n.addEventListener("change",()=>{const t=g?v.filter(e=>e.audition_date===g):v;n.checked?t.forEach(e=>m.add(e.id)):t.forEach(e=>m.delete(e.id)),w()}),l.querySelectorAll(".slot-select-cb").forEach(t=>{t.addEventListener("change",()=>{t.checked?m.add(t.dataset.id):m.delete(t.dataset.id),w()})}),l.querySelectorAll(".delete-slot-btn").forEach(t=>{t.addEventListener("click",async()=>{if(!window.confirm("Delete this vocal slot? Any existing bookings will be removed."))return;const e=t.dataset.id;t.disabled=!0,t.textContent="Deleting…";const{error:o}=await N(e),s=document.getElementById("vocal-roster-msg");if(o){t.disabled=!1,t.textContent="Delete",s&&(s.className="form-message error",s.textContent=o.message||"Failed to delete slot.");return}s&&(s.className="form-message success",s.textContent="Slot deleted."),m.delete(e),await E()})});const d=document.getElementById("bulk-delete-slots-btn");d&&d.addEventListener("click",async()=>{if(m.size===0||!window.confirm(`Delete ${m.size} selected vocal slot(s)? Any existing bookings will be removed.`))return;const t=document.getElementById("vocal-roster-msg");d.disabled=!0,d.textContent="Deleting…";let e=0,o=0;for(const s of m){const{error:a}=await N(s);a?o++:e++}d.disabled=!1,d.textContent="Delete Selected Slots",m.clear(),t&&(o===0?(t.className="form-message success",t.textContent=`Deleted ${e} slot(s).`):(t.className="form-message error",t.textContent=`Deleted ${e} slot(s), ${o} failed.`)),await E()});const i=document.getElementById("vocal-override-btn");i&&i.addEventListener("click",async()=>{var f,p,C,y;const t=k($),e=(p=(f=document.getElementById("vocal-override-student-id"))==null?void 0:f.value)==null?void 0:p.trim(),o=(C=document.getElementById("vocal-override-slot"))==null?void 0:C.value,s=(y=document.getElementById("vocal-override-day"))==null?void 0:y.value,a=document.getElementById("vocal-override-msg");if(!e||!t&&!o||t&&!s){a&&(a.className="form-message error",a.textContent=t?"Both student ID and day are required.":"Both student ID and slot are required.");return}i.disabled=!0,i.textContent="Assigning…",a&&(a.className="form-message",a.textContent="");const{error:r}=t?await K(e,s):await P(e,o);if(r){i.disabled=!1,i.textContent=t?"Assign Day":"Assign Slot",a&&(a.className="form-message error",a.textContent=r.message||"Override failed.");return}a&&(a.className="form-message success",a.textContent=t?"Student assigned to day.":"Student assigned to slot."),i.disabled=!1,i.textContent=t?"Assign Day":"Assign Slot",await E()})}export{ft as renderStaffVocalRoster};
